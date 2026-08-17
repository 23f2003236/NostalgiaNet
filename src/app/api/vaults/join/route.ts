import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

// Join a vault as a contributor using its invite token.
// If the user isn't logged in, the frontend should redirect to signup first.
export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteToken } = await req.json();
    if (!inviteToken) {
      return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
    }

    const vault = await db.vault.findUnique({
      where: { inviteToken },
    });
    if (!vault) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
    }

    // Owner is implicitly a contributor already
    if (vault.userId === userId) {
      return NextResponse.json({ vault, alreadyMember: true });
    }

    // Check if already a contributor
    const existing = await db.vaultContributor.findUnique({
      where: { vaultId_userId: { vaultId: vault.id, userId } },
    });
    if (existing) {
      return NextResponse.json({ vault, alreadyMember: true });
    }

    // Check if vault is still sealed — can't join after unlock
    if (new Date(vault.unlockAt) <= new Date()) {
      return NextResponse.json(
        { error: "This vault has already unlocked — too late to add memories." },
        { status: 400 }
      );
    }

    await db.vaultContributor.create({
      data: {
        vaultId: vault.id,
        userId,
        invitedBy: vault.userId,
      },
    });

    // Notify the owner
    await db.notification.create({
      data: {
        userId: vault.userId,
        type: "SHARED_VAULT",
        title: `Someone joined "${vault.title}"`,
        body: `A new contributor has joined your collaborative vault.`,
        link: `/?vault=${vault.id}`,
      },
    });

    return NextResponse.json({ vault, joined: true });
  } catch (e) {
    console.error("[join POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
