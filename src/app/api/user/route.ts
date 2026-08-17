import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, avatar } = body as {
      name?: string;
      bio?: string;
      avatar?: string;
    };

    const data: { name?: string; bio?: string | null; avatar?: string | null } = {};
    if (typeof name === "string" && name.trim().length >= 2) {
      data.name = name.trim();
    }
    if (typeof bio === "string") {
      data.bio = bio.trim() || null;
    }
    if (typeof avatar === "string") {
      data.avatar = avatar || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[user PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
