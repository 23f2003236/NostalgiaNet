import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { db } from "@/lib/db";

/**
 * Server-side: get the current authenticated user id from the NextAuth session.
 *
 * This is the ONLY way routes should resolve the current user — never trust
 * client-supplied headers like `x-user-id` (would be a trivial auth bypass).
 */
export async function getServerUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return user?.id || null;
}
