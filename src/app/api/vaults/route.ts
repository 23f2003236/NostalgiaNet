import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    const scope = req.nextUrl.searchParams.get("scope") || "mine";

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (scope === "public") {
      // Public discovery feed — supports search & sort
      const q = req.nextUrl.searchParams.get("q") || "";
      const sort = req.nextUrl.searchParams.get("sort") || "newest"; // newest | soonest | most_memories
      const category = req.nextUrl.searchParams.get("category") || "";

      const where: { isPublic: boolean; OR?: { title?: { contains: string }; description?: { contains: string }; user?: { name: { contains: string } } }[]; category?: string } = {
        isPublic: true,
      };
      if (q.trim()) {
        where.OR = [
          { title: { contains: q } },
          { description: { contains: q } },
          { user: { name: { contains: q } } },
        ];
      }
      if (category.trim()) {
        where.category = category;
      }

      const orderBy =
        sort === "soonest"
          ? { unlockAt: "asc" as const }
          : sort === "oldest"
          ? { createdAt: "asc" as const }
          : { createdAt: "desc" as const };

      const vaults = await db.vault.findMany({
        where,
        include: {
          user: { select: { name: true, avatar: true } },
          memories: true,
        },
        orderBy,
        take: 60,
      });
      return NextResponse.json({ vaults });
    }

    if (scope === "shared") {
      const shares = await db.share.findMany({
        where: { sharedWithId: userId },
        include: {
          vault: {
            include: {
              user: { select: { name: true, avatar: true } },
              memories: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ vaults: shares.map((s) => s.vault) });
    }

    // "mine" scope: vaults I own + vaults I've joined as a contributor.
    // Without the contributor join, Phase 2's join-vault flow is a dead end —
    // the user joins and the vault never appears in their dashboard.
    const ownedVaults = await db.vault.findMany({
      where: { userId },
      include: { memories: true, user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });

    const contributorRows = await db.vaultContributor.findMany({
      where: { userId },
      select: { vaultId: true },
    });
    const contributorVaultIds = contributorRows.map((c) => c.vaultId);

    const contributedVaults = contributorVaultIds.length
      ? await db.vault.findMany({
          where: { id: { in: contributorVaultIds } },
          include: { memories: true, user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    // Mark contributed vaults so the UI can show "Contributing" badge
    const vaults = [
      ...ownedVaults.map((v) => ({ ...v, _role: "owner" as const })),
      ...contributedVaults.map((v) => ({ ...v, _role: "contributor" as const })),
    ];

    return NextResponse.json({
      vaults,
      // Track which vault IDs the current user is merely a contributor on,
      // so the frontend can render "Contributing" badges without re-querying.
      contributedVaultIds: contributorVaultIds,
    });
  } catch (e) {
    console.error("[vaults GET]", e);
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
    const {
      title,
      description,
      coverImage,
      unlockAt,
      isPublic,
      category,
      memories,
    } = body as {
      title: string;
      description?: string;
      coverImage?: string;
      unlockAt: string;
      isPublic?: boolean;
      category?: string;
      memories?: { type: string; url: string; caption?: string }[];
    };

    if (!title?.trim() || !unlockAt) {
      return NextResponse.json(
        { error: "Title and unlock date are required" },
        { status: 400 }
      );
    }

    const unlockDate = new Date(unlockAt);
    if (isNaN(unlockDate.getTime())) {
      return NextResponse.json({ error: "Invalid unlock date" }, { status: 400 });
    }

    const vault = await db.vault.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        unlockAt: unlockDate,
        isPublic: !!isPublic,
        category: category || null,
        isSealed: true,
        userId,
        memories: memories?.length
          ? {
              create: memories.map((m, i) => ({
                type: m.type,
                url: m.url,
                caption: m.caption || null,
                order: i,
              })),
            }
          : undefined,
      },
      include: { memories: true },
    });

    return NextResponse.json({ vault });
  } catch (e) {
    console.error("[vaults POST]", e);
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
    const vault = await db.vault.findUnique({ where: { id } });
    if (!vault || vault.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.vault.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[vaults DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
