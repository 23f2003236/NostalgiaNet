import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const journals = await db.journal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ journals });
  } catch (e) {
    console.error("[journals GET]", e);
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
    const { title, content, mood, weather, location, tags } = body as {
      title: string;
      content: string;
      mood?: string;
      weather?: string;
      location?: string;
      tags?: string;
    };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const journal = await db.journal.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        mood: mood || null,
        weather: weather || null,
        location: location || null,
        tags: tags || null,
        userId,
      },
    });

    return NextResponse.json({ journal });
  } catch (e) {
    console.error("[journals POST]", e);
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
    const journal = await db.journal.findUnique({ where: { id } });
    if (!journal || journal.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await db.journal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[journals DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
