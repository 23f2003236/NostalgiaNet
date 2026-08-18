import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const vaultId = req.nextUrl.searchParams.get("vaultId");

    if (vaultId) {
      // List shares for a specific vault (must own it)
      const vault = await db.vault.findUnique({ where: { id: vaultId } });
      if (!vault || vault.userId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const shares = await db.share.findMany({
        where: { vaultId },
        include: {
          recipient: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ shares });
    }

    // List all vaults shared with me
    const shares = await db.share.findMany({
      where: { sharedWithId: userId },
      include: {
        vault: {
          include: {
            user: { select: { name: true, avatar: true } },
            memories: true,
          },
        },
        sharer: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      shares: shares.map((s) => ({
        id: s.id,
        vault: s.vault,
        sharer: s.sharer,
        createdAt: s.createdAt,
      })),
    });
  } catch (e) {
    console.error("[share GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { vaultId, friendIds } = body as {
      vaultId: string;
      friendIds: string[];
    };

    if (!vaultId || !Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json(
        { error: "vaultId and friendIds are required" },
        { status: 400 }
      );
    }

    const vault = await db.vault.findUnique({ where: { id: vaultId } });
    if (!vault || vault.userId !== userId) {
      return NextResponse.json(
        { error: "You can only share your own vaults" },
        { status: 403 }
      );
    }

    // Verify all friends are actually friends
    const friendships = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: userId, receiverId: { in: friendIds } },
          { receiverId: userId, senderId: { in: friendIds } },
        ],
      },
    });
    const validFriendIds = new Set(
      friendships.flatMap((f) =>
        f.senderId === userId ? [f.receiverId] : [f.senderId]
      )
    );
    const validIds = friendIds.filter((id) => validFriendIds.has(id));

    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "None of the selected users are your friends" },
        { status: 400 }
      );
    }

    // Create shares (skip existing)
    const created: { id: string }[] = [];
    let concurrentDuplicates = 0;
    for (const fid of validIds) {
      const existing = await db.share.findFirst({
        where: { vaultId, sharedWithId: fid },
      });
      if (existing) continue;
      let share;
      try {
        share = await db.share.create({
          data: {
            vaultId,
            sharedById: userId,
            sharedWithId: fid,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          concurrentDuplicates++;
          continue;
        }
        throw e;
      }
      created.push({ id: share.id });

      // Create in-app notification
      await db.notification.create({
        data: {
          userId: fid,
          type: "SHARED_VAULT",
          title: `${vault.title} was shared with you`,
          body: `Someone shared a TimeVault with you. It will unlock on ${new Date(
            vault.unlockAt
          ).toLocaleDateString()}.`,
          link: `/vaults?scope=shared`,
        },
      });
    }

    if (created.length === 0 && concurrentDuplicates > 0) {
      return NextResponse.json(
        { error: "This vault was already shared with the selected friend" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      shared: created.length,
      skipped: friendIds.length - validIds.length + concurrentDuplicates,
    });
  } catch (e) {
    console.error("[share POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const share = await db.share.findUnique({ where: { id } });
    if (!share) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Only the sharer or the recipient can revoke
    if (share.sharedById !== userId && share.sharedWithId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.share.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[share DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
