import { Metadata } from "next";
import { db } from "@/lib/db";
import { PublicDiscoverClient } from "@/components/nostalgia/public-discover-client";
import type { Vault } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover public time capsules — NostalgiaNet++",
  description:
    "Browse public time capsules from people around the world. Letters to future selves, sealed memories, family vaults, milestones — sealed today, opened tomorrow.",
  keywords: [
    "time capsule",
    "letter to future self",
    "memory vault",
    "sealed memories",
    "future capsule",
    "discover time capsules",
  ],
  openGraph: {
    title: "Discover public time capsules — NostalgiaNet++",
    description:
      "Browse public capsules from memory-keepers around the world. Sealed today, opened tomorrow.",
    siteName: "NostalgiaNet++",
    type: "website",
  },
  alternates: {
    canonical: "/discover",
  },
};

export default async function PublicDiscoverPage() {
  // Server-side fetch — Google can crawl this
  const dbVaults = await db.vault.findMany({
    where: { isPublic: true },
    include: {
      user: { select: { name: true, avatar: true } },
      memories: true,
      _count: { select: { reactions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  // Serialize Date → string at the boundary and redact sealed-vault media.
  // This page has no user context (unauthenticated, Google-crawlable), so
  // every vault whose unlockAt is still in the future must have its
  // coverImage and memories stripped before reaching the client.
  const now = new Date();
  const vaults: Vault[] = dbVaults.map((v) => {
    const isUnlocked = new Date(v.unlockAt) <= now;
    return {
      ...v,
      unlockAt: v.unlockAt.toISOString(),
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
      // Sealed vault → strip media; only title/category/countdown exposed
      coverImage: isUnlocked ? v.coverImage : null,
      memories: isUnlocked
        ? v.memories.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
        : [],
      // Reaction count from Prisma _count — no extra client fetch needed
      reactionCount: v._count.reactions,
    };
  });

  // Group by category for SEO-friendly structure
  const byCategory: Record<string, Vault[]> = {};
  for (const v of vaults) {
    const cat = v.category || "uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(v);
  }

  return <PublicDiscoverClient vaults={vaults} byCategory={byCategory} />;
}

