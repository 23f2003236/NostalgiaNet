import { del } from "@vercel/blob";

function isVercelBlobUrl(value: string): boolean {
  try {
    return new URL(value).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

// Blob cleanup is best-effort: database deletion must never fail because
// storage cleanup is unavailable or a Blob object was already removed.
export async function cleanupBlobUrls(urls: Array<string | null | undefined>) {
  const blobUrls = [...new Set(urls.filter((url): url is string => !!url && isVercelBlobUrl(url)))];
  await Promise.all(
    blobUrls.map(async (url) => {
      try {
        await del(url);
      } catch (error) {
        console.warn(`[blob cleanup] failed to delete ${url}`, error);
      }
    })
  );
}
