import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

// In-memory rate limiter — per IP, per minute.
// Production should use Redis or Vercel KV, but for free-tier this is enough
// to prevent brute-force password guessing and email enumeration at scale.
// Limits: 10 precheck requests per IP per minute (generous for legit use).
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

function getClientIp(req: NextRequest): string {
  // Vercel puts real client IP in x-forwarded-for, x-real-ip, or x-vercel-forwarded-for
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  const xvf = req.headers.get("x-vercel-forwarded-for");
  if (xvf) return xvf.split(",")[0].trim();
  return "unknown";
}

// Pre-flight validation endpoint called by the auth modal BEFORE
// invoking NextAuth's signIn(). This lets us return real, specific error
// messages ("An account with this email already exists", "Invalid email or
// password") instead of NextAuth's generic "CredentialsSignin" code.
//
// This endpoint does NOT create a session — it only validates. If it returns
// ok:true, the client then calls signIn("credentials", ...) which is the
// real auth call. If it returns ok:false, the client shows the error and
// never calls signIn().
//
// SECURITY NOTE: This endpoint does reveal whether a given email is
// registered (via the "already exists" / "no account found" messages).
// This is a deliberate UX trade-off. Rate limiting (10/min/IP) caps the
// enumeration vector. For production with real users, add email verification
// and consider not differentiating the error messages.
export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${rl.retryAfter}s.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfter || 60),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { mode, email, password, name } = body as {
      mode: "login" | "signup";
      email: string;
      password: string;
      name?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (mode === "signup") {
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: "Please tell us your name" },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Try signing in." },
          { status: 409 }
        );
      }

      // Pre-flight passed for signup
      return NextResponse.json({ ok: true });
    }

    // login mode — verify credentials
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "No account found with that email. Try signing up." },
        { status: 404 }
      );
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Pre-flight passed for login
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[precheck] error", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
