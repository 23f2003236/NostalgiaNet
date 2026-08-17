import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public album view — no auth required, only returns public albums.
// Albums are always "open" (no sealed concept), so all memories are visible.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const album = await db.album.findUnique({
      where: { id },
      include: {
        memories: { orderBy: { order: "asc" } },
        user: { select: { name: true, avatar: true } },
      },
    });

    if (!album || !album.isPublic) {
      return NextResponse.json(
        { error: "Album not found or not public" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      album: {
        id: album.id,
        title: album.title,
        description: album.description,
        coverImage: album.coverImage,
        isPublic: album.isPublic,
        createdAt: album.createdAt,
        user: album.user,
        memories: album.memories,
      },
    });
  } catch (e) {
    console.error("[public album GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
