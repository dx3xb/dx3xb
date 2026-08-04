import type { MetadataRoute } from "next";
import { getServiceClient } from "@/lib/supabase";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: "https://dx3xb.com", lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: "https://dx3xb.com/trio", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://dx3xb.com/studio", lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return staticEntries;

  try {
    const supabase = getServiceClient();
    const [{ data: apps, error: appsError }, { data: creators, error: creatorsError }] = await Promise.all([
      supabase
        .from("dx3xb_microapps")
        .select("slug,updated_at,created_at")
        .eq("status", "public")
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("dx3xb_profiles")
        .select("handle,created_at")
        .not("handle", "is", null)
        .limit(1000),
    ]);
    if (appsError) throw appsError;
    if (creatorsError) throw creatorsError;

    return [
      ...staticEntries,
      ...(apps ?? []).map((app) => ({
        url: `https://dx3xb.com/u/${encodeURIComponent(app.slug)}`,
        lastModified: new Date(app.updated_at ?? app.created_at ?? now),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...(creators ?? []).flatMap((creator) => creator.handle ? [{
        url: `https://dx3xb.com/p/${encodeURIComponent(creator.handle)}`,
        lastModified: new Date(creator.created_at ?? now),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }] : []),
    ];
  } catch (error) {
    console.error("sitemap read failed", error);
    return staticEntries;
  }
}
