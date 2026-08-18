import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";
import { hasExactlyOneMemoryParent } from "@/lib/memory-association";

// Add memories (photos/videos) to an EXISTING vault.
// Access: vault owner OR any contributor on the vault's VaultContributor table.
// Sealed check: cannot add memories after unlockAt has passed.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vault = await db.vault.findUnique({
      where: { id },
      include: { memories: true },
    });

    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    // Permission check: owner OR contributor
    const isOwner = vault.userId === userId;
    let isContributor = false;
    if (!isOwner) {
      const contributorRow = await db.vaultContributor.findUnique({
        where: { vaultId_userId: { vaultId: vault.id, userId } },
      });
      isContributor = !!contributorRow;
    }
    if (!isOwner && !isContributor) {
      return NextResponse.json(
        { error: "You don't have access to add memories to this vault" },
        { status: 403 }
      );
    }

    // Sealed check: can't add after unlock
    if (new Date(vault.unlockAt) <= new Date()) {
      return NextResponse.json(
        { error: "This vault has already unlocked — too late to add memories." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { memories } = body as {
      memories: { type: string; url: string; caption?: string; vaultId?: string | null; albumId?: string | null }[];
    };

    if (!memories || !Array.isArray(memories) || memories.length === 0) {
      return NextResponse.json(
        { error: "No memories provided" },
        { status: 400 }
      );
    }

    if (memories.some((memory) => !hasExactlyOneMemoryParent(memory, vault.id, null))) {
      return NextResponse.json(
        { error: "Each memory must belong to exactly one vault or album" },
        { status: 400 }
      );
    }

    if (memories.length > 20) {
      return NextResponse.json(
        { error: "Too many files. Max 20 per upload." },
        { status: 400 }
      );
    }

    // Append after existing memories
    const startOrder = vault.memories.length;
    const created = await db.memory.createMany({
      data: memories.map((m, i) => ({
        type: m.type,
        url: m.url,
        caption: m.caption || null,
        order: startOrder + i,
        vaultId: vault.id,
        contributorId: userId,
      })),
    });

    // Notify the owner (if a contributor added the memory)
    if (!isOwner) {
      const contributor = await db.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await db.notification.create({
        data: {
          userId: vault.userId,
          type: "SHARED_VAULT",
          title: `${contributor?.name || "Someone"} added to "${vault.title}"`,
          body: `New memories were added to your collaborative vault.`,
          link: `/?vault=${vault.id}`,
        },
      });
    }

    // Return updated vault with all memories
    const updated = await db.vault.findUnique({
      where: { id: vault.id },
      include: { memories: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({
      ok: true,
      added: created.count,
      vault: updated,
    });
  } catch (e) {
    console.error("[memories POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
