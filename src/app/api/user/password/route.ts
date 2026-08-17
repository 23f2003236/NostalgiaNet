import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";

// POST /api/user/password — change password (requires current password)
export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Password change not available." },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashed = await hashPassword(newPassword);
    await db.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[password POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
