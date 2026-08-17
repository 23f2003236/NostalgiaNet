import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public vault view — no auth required, only returns public vaults.
// Sealed vaults return only metadata (title, cover, unlock date).
// Unlocked vaults return full memories.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vault = await db.vault.findUnique({
      where: { id },
      include: {
        memories: { orderBy: { order: "asc" } },
        user: { select: { name: true, avatar: true } },
      },
    });

    if (!vault || !vault.isPublic) {
      return NextResponse.json(
        { error: "Vault not found or not public" },
        { status: 404 }
      );
    }

    const isUnlocked = new Date(vault.unlockAt) <= new Date();

    return NextResponse.json({
      vault: {
        id: vault.id,
        title: vault.title,
        description: vault.description,
        coverImage: vault.coverImage,
        unlockAt: vault.unlockAt,
        isPublic: vault.isPublic,
        isSealed: !isUnlocked,
        isUnlocked,
        createdAt: vault.createdAt,
        category: vault.category,
        user: vault.user,
        // Only include memories if unlocked
        memories: isUnlocked ? vault.memories : [],
        memoriesCount: vault.memories.length,
      },
    });
  } catch (e) {
    console.error("[public vault GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
