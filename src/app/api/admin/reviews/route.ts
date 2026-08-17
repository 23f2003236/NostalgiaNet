import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

async function requireAdmin() {
  const userId = await getServerUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? userId : null;
}

// GET /api/admin/reviews — list ALL reviews (approved + pending)
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const reviews = await db.review.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

// PATCH /api/admin/reviews?id=... — approve/unapprove a review
export async function PATCH(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const body = await req.json();
  const { isApproved } = body as { isApproved: boolean };
  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.review.update({
    where: { id },
    data: { isApproved: !!isApproved },
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/reviews?id=...
export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
