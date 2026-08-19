import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicVaultView } from "@/components/nostalgia/public-views";

// Server-side: generate metadata for link previews (WhatsApp/iMessage/Slack)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const vault = await db.vault.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      unlockAt: true,
      isPublic: true,
    },
  });

  if (!vault || !vault.isPublic) {
    return {
      title: "Capsule not found — NostalgiaNet++",
      description: "This memory has been sealed away or no longer exists.",
    };
  }

  const isUnlocked = new Date(vault.unlockAt) <= new Date();
  const unlockDate = new Date(vault.unlockAt).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const title = vault.title;
  const description = isUnlocked
    ? `A memory that was sealed away has just unlocked. ${vault.description || ""}`.trim()
    : `Sealed until ${unlockDate}. ${vault.description || ""}`.trim();

  // Auto-generated OG share card
  const ogImage = `/api/og/vault/${vault.id}`;

  return {
    title: `${title} — NostalgiaNet++`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "NostalgiaNet++",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicVaultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dbVault = await db.vault.findUnique({
    where: { id },
    include: {
      memories: { orderBy: { order: "asc" } },
      user: { select: { name: true, avatar: true } },
    },
  });

  if (!dbVault || !dbVault.isPublic) {
    notFound();
  }

  // Serialize Date → string at the boundary and redact sealed-vault media.
  // The UI already shows a "Still sealed" state for sealed vaults, but without
  // this guard the raw coverImage + memories URLs are embedded in the RSC
  // payload — visible in page source and browser devtools to any visitor.
  const isUnlocked = new Date(dbVault.unlockAt) <= new Date();
  const vault = {
    ...dbVault,
    unlockAt: dbVault.unlockAt.toISOString(),
    createdAt: dbVault.createdAt.toISOString(),
    updatedAt: dbVault.updatedAt.toISOString(),
    // Sealed vault → strip media so no URLs reach the client bundle
    coverImage: isUnlocked ? dbVault.coverImage : null,
    memories: isUnlocked
      ? dbVault.memories.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
      : [],
    // Preserve count so the UI can show "X memories sealed inside"
    memoriesCount: dbVault.memories.length,
  };

  return <PublicVaultView vault={vault} />;
}
