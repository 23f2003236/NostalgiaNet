import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reactions?vaultId=xxx
// Returns the current candle count for a public vault.
export async function GET(req: NextRequest) {
  const vaultId = req.nextUrl.searchParams.get("vaultId");
  if (!vaultId) {
    return NextResponse.json({ error: "Missing vaultId" }, { status: 400 });
  }
  try {
    const count = await db.vaultReaction.count({ where: { vaultId } });
    return NextResponse.json({ count });
  } catch (e) {
    console.error("[reactions GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/reactions
// Body: { vaultId: string; visitorId: string }
// Creates a reaction (@@unique prevents duplicates). Returns updated count.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { vaultId?: string; visitorId?: string };
    const { vaultId, visitorId } = body;

    if (!vaultId || !visitorId || visitorId.length < 6) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Rate-limit sanity check — visitorId must look like a UUID (36 chars)
    if (visitorId.length > 64) {
      return NextResponse.json({ error: "Invalid visitorId" }, { status: 400 });
    }

    // Verify vault exists and is public
    const vault = await db.vault.findUnique({
      where: { id: vaultId },
      select: { isPublic: true },
    });
    if (!vault?.isPublic) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    // Create reaction — silently ignore unique constraint violation (already lit)
    let alreadyLit = false;
    try {
      await db.vaultReaction.create({ data: { vaultId, visitorId } });
    } catch {
      alreadyLit = true;
    }

    const count = await db.vaultReaction.count({ where: { vaultId } });
    return NextResponse.json({ count, alreadyLit });
  } catch (e) {
    console.error("[reactions POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}