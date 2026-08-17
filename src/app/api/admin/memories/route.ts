import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

async function requireAdmin() {
  const userId = await getServerUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "ADMIN" ? userId : null;
}

// Delete a single memory (photo/video) — admin only
export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const memory = await db.memory.findUnique({ where: { id } });
  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.memory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
