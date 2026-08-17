import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

// Generate (or return existing) invite token for a vault.
// Only the vault owner can do this.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vault = await db.vault.findUnique({ where: { id } });
    if (!vault || vault.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return existing token if it exists, else generate one
    if (vault.inviteToken) {
      return NextResponse.json({ inviteToken: vault.inviteToken });
    }

    const inviteToken = randomBytes(12).toString("hex");
    await db.vault.update({
      where: { id },
      data: { inviteToken },
    });
    return NextResponse.json({ inviteToken });
  } catch (e) {
    console.error("[invite POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
