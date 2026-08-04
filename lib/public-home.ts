import "server-only";
import { unstable_cache } from "next/cache";
import type { PublicMicroappSummary } from "@/app/_mt/creator-types";
import { getPublicCreators } from "./public-creators";
import { getServiceClient } from "./supabase";

export type PublicToy = {
  slug: string;
  title_zh: string;
  title_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  type: string;
  url: string;
  status: string;
};

export type PublicWallSort = "latest" | "popular";

const FALLBACK_TOYS: PublicToy[] = [
  {
    slug: "color-hunter",
    title_zh: "色差猎人",
    title_en: "color hunter",
    desc_zh: "60 秒辨别色差挑战",
    desc_en: "spot the odd color in 60 seconds",
    icon: "🎨",
    type: "internal",
    url: "https://color-hunter.dx3xb.com",
    status: "live",
  },
  {
    slug: "dont-click-wrong",
    title_zh: "不要点错",
    title_en: "Don't Tap Wrong",
    desc_zh: "你的大脑和手，到底谁说了算？",
    desc_en: "Who is the boss, your brain or your hand?",
    icon: "🚫",
    type: "internal",
    url: "https://dont-click-wrong.dx3xb.com",
    status: "live",
  },
  {
    slug: "instant-memory",
    title_zh: "瞬间记忆",
    title_en: "instant memory",
    desc_zh: "60 秒短时记忆挑战",
    desc_en: "flash sequence memory test",
    icon: "🧠",
    type: "internal",
    url: "https://instant-memory.dx3xb.com",
    status: "live",
  },
];

function hasServiceCredentials() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export const getPublicToys = unstable_cache(
  async (): Promise<PublicToy[]> => {
    if (!hasServiceCredentials()) return FALLBACK_TOYS;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_toys")
      .select("slug, title_zh, title_en, desc_zh, desc_en, icon, type, url, status")
      .neq("status", "hidden")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((toy) => ({
      ...toy,
      desc_zh: toy.desc_zh ?? "",
      desc_en: toy.desc_en ?? "",
      icon: toy.icon ?? "🧸",
      url: toy.url ?? "",
    }));
  },
  ["public-toys-v1"],
  { revalidate: 300, tags: ["public-toys"] },
);

export const getPublicWall = unstable_cache(
  async (sort: PublicWallSort): Promise<PublicMicroappSummary[]> => {
    if (!hasServiceCredentials()) return [];
    const supabase = getServiceClient();
    const baseQuery = supabase
      .from("dx3xb_microapps")
      .select("slug,title,template,plays,created_at,owner_id")
      .eq("status", "public");
    const query = sort === "popular"
      ? baseQuery.order("plays", { ascending: false }).order("created_at", { ascending: false })
      : baseQuery.order("created_at", { ascending: false }).order("plays", { ascending: false });
    const { data, error } = await query.limit(24);

    if (error) throw error;
    const creators = await getPublicCreators((data ?? []).map((app) => app.owner_id));
    return (data ?? []).map((app) => ({
      slug: app.slug,
      title: app.title,
      template: app.template,
      plays: app.plays,
      createdAt: app.created_at,
      creator: creators.get(app.owner_id) ?? null,
    }));
  },
  ["public-wall-v1"],
  { revalidate: 60, tags: ["public-wall"] },
);
