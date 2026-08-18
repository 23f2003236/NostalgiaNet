import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";
import { cleanupBlobUrls } from "@/lib/blob-cleanup";
import { hasExactlyOneMemoryParent } from "@/lib/memory-association";

export async function GET(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = req.nextUrl.searchParams.get("scope") || "mine";

    if (scope === "public") {
      const albums = await db.album.findMany({
        where: { isPublic: true },
        include: {
          user: { select: { name: true, avatar: true } },
          memories: true,
        },
        orderBy: { createdAt: "desc" },
        take: 60,
      });
      return NextResponse.json({ albums });
    }

    const albums = await db.album.findMany({
      where: { userId },
      include: { memories: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ albums });
  } catch (e) {
    console.error("[albums GET]", e);
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
    const { title, description, coverImage, isPublic, memories } = body as {
      title: string;
      description?: string;
      coverImage?: string;
      isPublic?: boolean;
      memories?: { type: string; url: string; caption?: string; vaultId?: string | null; albumId?: string | null }[];
    };

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (memories?.some((memory) => !hasExactlyOneMemoryParent(memory, null, "new-album"))) {
      return NextResponse.json(
        { error: "Each memory must belong to exactly one vault or album" },
        { status: 400 }
      );
    }

    const album = await db.album.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        isPublic: !!isPublic,
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

    return NextResponse.json({ album });
  } catch (e) {
    console.error("[albums POST]", e);
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
    const album = await db.album.findUnique({
      where: { id },
      include: { memories: { select: { url: true } } },
    });
    if (!album || album.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.album.delete({ where: { id } });
    await cleanupBlobUrls([album.coverImage, ...album.memories.map((memory) => memory.url)]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[albums DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
