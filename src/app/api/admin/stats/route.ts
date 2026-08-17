import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerUserId } from "@/lib/session";

export async function GET() {
  const adminId = await getServerUserId();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const me = await db.user.findUnique({ where: { id: adminId }, select: { role: true } });
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    totalUsers,
    totalVaults,
    totalAlbums,
    totalJournals,
    totalMemories,
    totalPublicVaults,
    sealedVaults,
    unlockedVaults,
    recentSignups,
  ] = await Promise.all([
    db.user.count(),
    db.vault.count(),
    db.album.count(),
    db.journal.count(),
    db.memory.count(),
    db.vault.count({ where: { isPublic: true } }),
    db.vault.count({ where: { isSealed: true } }),
    db.vault.count({ where: { isSealed: false } }),
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalVaults,
    totalAlbums,
    totalJournals,
    totalMemories,
    totalPublicVaults,
    sealedVaults,
    unlockedVaults,
    recentSignups,
  });
}
