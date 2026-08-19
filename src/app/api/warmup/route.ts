import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Lightweight DB warm-up endpoint.
 *
 * Called by the auth modal BEFORE the Google OAuth redirect so Neon has
 * time to wake from a cold start. The OAuth callback fires after the user
 * authenticates with Google (minimum ~2s), by which point a Neon cold start
 * (typically 0.5-4s) will have already completed.
 *
 * Without this, the first Google sign-in after an idle period fails because
 * the signIn/jwt callbacks cannot reach the DB during the cold-start window,
 * causing NextAuth to redirect to the error page instead of the dashboard.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    // DB still unavailable — caller will handle via retry logic in callbacks
    return NextResponse.json({ ok: false });
  }
}
