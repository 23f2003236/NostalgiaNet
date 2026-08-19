import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lightweight DB warm-up endpoint.
// Called by auth-modal.tsx before the Google OAuth redirect.
// Ensures Neon is awake before the OAuth callback fires, preventing
// the first-Google-login failure caused by DB cold-start timeouts.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}