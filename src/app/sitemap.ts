import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/discover`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  // Public vaults
  const publicVaults = await db.vault.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
    take: 500,
  });
  const vaultEntries: MetadataRoute.Sitemap = publicVaults.map((v) => ({
    url: `${baseUrl}/v/${v.id}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Public albums
  const publicAlbums = await db.album.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
    take: 500,
  });
  const albumEntries: MetadataRoute.Sitemap = publicAlbums.map((a) => ({
    url: `${baseUrl}/a/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...vaultEntries, ...albumEntries];
}
