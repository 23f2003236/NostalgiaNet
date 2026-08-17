import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicAlbumView } from "@/components/nostalgia/public-views";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const album = await db.album.findUnique({
    where: { id },
    select: { title: true, description: true, coverImage: true, isPublic: true },
  });

  if (!album || !album.isPublic) {
    return {
      title: "Album not found — NostalgiaNet++",
      description: "This album is private or no longer exists.",
    };
  }

  return {
    title: `${album.title} — NostalgiaNet++`,
    description: album.description || `A photo album: ${album.title}`,
    openGraph: {
      title: album.title,
      description: album.description || "",
      type: "website",
      siteName: "NostalgiaNet++",
      images: album.coverImage
        ? [{ url: album.coverImage, width: 1200, height: 630, alt: album.title }]
        : undefined,
    },
    twitter: {
      card: album.coverImage ? "summary_large_image" : "summary",
      title: album.title,
      description: album.description || "",
      images: album.coverImage ? [album.coverImage] : undefined,
    },
  };
}

export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dbAlbum = await db.album.findUnique({
    where: { id },
    include: {
      memories: { orderBy: { order: "asc" } },
      user: { select: { name: true, avatar: true } },
    },
  });

  if (!dbAlbum || !dbAlbum.isPublic) {
    notFound();
  }

  // Serialize Date → string at the boundary
  const album = {
    ...dbAlbum,
    createdAt: dbAlbum.createdAt.toISOString(),
    updatedAt: dbAlbum.updatedAt.toISOString(),
    memories: dbAlbum.memories.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  return <PublicAlbumView album={album} />;
}
