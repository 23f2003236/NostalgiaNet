import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";
import { cleanupBlobUrls } from "@/lib/blob-cleanup";

async function requireAdmin() {
  const userId = await getServerUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return userId;
}

// GET /api/admin/users — list all users with counts
export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      bio: true,
      plan: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          vaults: true,
          journals: true,
          albums: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

// DELETE /api/admin/users?id=... — delete a user (cannot delete self or other admins)
export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const targetId = req.nextUrl.searchParams.get("id");
  if (!targetId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (targetId === adminId) {
    return NextResponse.json({ error: "You can't delete your own admin account" }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Can't delete another admin" }, { status: 400 });
  }
  const [memories, vaults, albums] = await Promise.all([
    db.memory.findMany({
      where: {
        OR: [
          { vault: { userId: targetId } },
          { album: { userId: targetId } },
        ],
      },
      select: { url: true },
    }),
    db.vault.findMany({ where: { userId: targetId }, select: { coverImage: true } }),
    db.album.findMany({ where: { userId: targetId }, select: { coverImage: true } }),
  ]);
  await db.user.delete({ where: { id: targetId } });
  await cleanupBlobUrls([
    target.avatar,
    ...memories.map((memory) => memory.url),
    ...vaults.map((vault) => vault.coverImage),
    ...albums.map((album) => album.coverImage),
  ]);
  return NextResponse.json({ ok: true });
}
