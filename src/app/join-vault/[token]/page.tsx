import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { JoinVaultPage } from "@/components/nostalgia/join-vault-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const vault = await db.vault.findUnique({
    where: { inviteToken: token },
    select: { title: true, description: true, coverImage: true, unlockAt: true, isSealed: true },
  });

  if (!vault) {
    return {
      title: "Invite not found — NostalgiaNet++",
      description: "This invite link is invalid or has expired.",
    };
  }

  return {
    title: `Join "${vault.title}" — NostalgiaNet++`,
    description: vault.description || `You've been invited to contribute to a collaborative time capsule.`,
    openGraph: {
      title: `Join "${vault.title}"`,
      description: vault.description || "A collaborative time capsule awaits your memories.",
      siteName: "NostalgiaNet++",
      images: vault.coverImage ? [{ url: vault.coverImage }] : undefined,
    },
  };
}

export default async function JoinVaultRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dbVault = await db.vault.findUnique({
    where: { inviteToken: token },
    include: {
      user: { select: { name: true } },
      memories: true,
      contributors: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  });

  if (!dbVault) {
    notFound();
  }

  // Serialize Date → string at the boundary
  const vault = {
    ...dbVault,
    unlockAt: dbVault.unlockAt.toISOString(),
    createdAt: dbVault.createdAt.toISOString(),
    updatedAt: dbVault.updatedAt.toISOString(),
    memories: dbVault.memories.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    contributors: dbVault.contributors.map((c) => ({
      ...c,
      joinedAt: c.joinedAt.toISOString(),
    })),
  };

  return <JoinVaultPage vault={vault} />;
}
