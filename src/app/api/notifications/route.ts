import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unread = await db.notification.count({
      where: { userId, read: false },
    });
    return NextResponse.json({ notifications, unread });
  } catch (e) {
    console.error("[notifications GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, all } = body as { id?: string; all?: boolean };

    if (all) {
      await db.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await db.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notifications PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
