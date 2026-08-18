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

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const vaults = await db.vault.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      memories: { select: { id: true, type: true, url: true, caption: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ vaults });
}

export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const vault = await db.vault.findUnique({
    where: { id },
    include: { memories: { select: { url: true } } },
  });
  if (!vault) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.vault.delete({ where: { id } });
  await cleanupBlobUrls([vault.coverImage, ...vault.memories.map((memory) => memory.url)]);
  return NextResponse.json({ ok: true });
}
