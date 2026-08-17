import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return {
    rules: [
      {
        // Allow everything public — including all /v/, /a/, /discover routes
        userAgent: "*",
        allow: ["/", "/discover", "/v/", "/a/", "/join-vault/"],
        // Never crawl auth, API, or private routes
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
