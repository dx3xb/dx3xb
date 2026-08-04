import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/me", "/studio/", "/trio/bridge"],
    },
    sitemap: "https://dx3xb.com/sitemap.xml",
    host: "https://dx3xb.com",
  };
}
