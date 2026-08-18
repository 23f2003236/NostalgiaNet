import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";
import { cleanupBlobUrls } from "@/lib/blob-cleanup";

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
  // A selected memory may also be the vault/album cover. Clear those references
  // before deleting the Blob so no surviving card points at a removed file.
  await Promise.all([
    db.vault.updateMany({ where: { coverImage: memory.url }, data: { coverImage: null } }),
    db.album.updateMany({ where: { coverImage: memory.url }, data: { coverImage: null } }),
  ]);
  await db.memory.delete({ where: { id } });
  await cleanupBlobUrls([memory.url]);
  return NextResponse.json({ ok: true });
}
