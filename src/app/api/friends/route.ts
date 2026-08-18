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
    const q = req.nextUrl.searchParams.get("q") || "";

    // Friends list (accepted)
    const sent = await db.friendship.findMany({
      where: { senderId: userId, status: "ACCEPTED" },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, avatar: true, bio: true },
        },
      },
    });
    const received = await db.friendship.findMany({
      where: { receiverId: userId, status: "ACCEPTED" },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true, bio: true },
        },
      },
    });
    const friends = [
      ...sent.map((s) => s.receiver),
      ...received.map((r) => r.sender),
    ];

    // Pending requests received (incoming)
    const incoming = await db.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Pending requests sent (outgoing)
    const outgoing = await db.friendship.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Search by email
    let search: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    }[] = [];
    if (q.trim()) {
      search = await db.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { email: { contains: q } },
                { name: { contains: q } },
              ],
            },
          ],
        },
        select: { id: true, name: true, email: true, avatar: true },
        take: 8,
      });
    }

    return NextResponse.json({
      friends,
      incoming: incoming.map((i) => ({ id: i.id, sender: i.sender })),
      outgoing: outgoing.map((o) => ({ id: o.id, receiver: o.receiver })),
      search,
    });
  } catch (e) {
    console.error("[friends GET]", e);
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
    const { action, receiverEmail, requestId } = body as {
      action: "invite" | "accept" | "decline";
      receiverEmail?: string;
      requestId?: string;
    };

    if (action === "invite") {
      if (!receiverEmail) {
        return NextResponse.json({ error: "Email required" }, { status: 400 });
      }
      const receiver = await db.user.findUnique({
        where: { email: receiverEmail },
      });
      if (!receiver) {
        return NextResponse.json(
          { error: "No user found with that email" },
          { status: 404 }
        );
      }
      if (receiver.id === userId) {
        return NextResponse.json(
          { error: "You can't befriend yourself" },
          { status: 400 }
        );
      }
      const existing = await db.friendship.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: userId },
          ],
        },
      });
      if (existing) {
        if (existing.status === "ACCEPTED") {
          return NextResponse.json(
            { error: "Already friends" },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Request already pending" },
          { status: 400 }
        );
      }
      let friendship;
      try {
        friendship = await db.friendship.create({
          data: { senderId: userId, receiverId: receiver.id, status: "PENDING" },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return NextResponse.json({ error: "A friend request already exists" }, { status: 409 });
        }
        throw e;
      }
      return NextResponse.json({ friendship });
    }

    if (action === "accept" || action === "decline") {
      if (!requestId) {
        return NextResponse.json(
          { error: "Request ID required" },
          { status: 400 }
        );
      }
      const fr = await db.friendship.findUnique({ where: { id: requestId } });
      if (!fr || fr.receiverId !== userId) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }
      if (action === "accept") {
        await db.friendship.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        });
        return NextResponse.json({ ok: true, status: "ACCEPTED" });
      }
      await db.friendship.delete({ where: { id: requestId } });
      return NextResponse.json({ ok: true, status: "DECLINED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("[friends POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
