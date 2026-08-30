import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Deal Board",
    short_name: "Deal Board",
    description:
      "Wholesale assignment marketplace. Independent of Frontburner and Edge.Sys.",
    start_url: "/",
    display: "standalone",
    background_color: "#E8EAEE",
    theme_color: "#1A4DFF",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
