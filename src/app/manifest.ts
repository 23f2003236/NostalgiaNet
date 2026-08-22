import type { MetadataRoute } from "next";

// Next.js App Router manifest route.
// Automatically injects <link rel="manifest"> into every page's <head>.
// Ref: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NostalgiaNet++",
    short_name: "NostalgiaNet",
    description:
      "Preserve your cherished moments in time capsules. Lock memories away, set an unlock date, and relive them years from now.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8f5f0",
    theme_color: "#8b4513",
    categories: ["lifestyle", "productivity"],
    icons: [
      {
        src: "/api/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/api/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}