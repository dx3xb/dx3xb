import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HomeClient } from "./HomeClient";
import { getPublicToys, getPublicWall } from "@/lib/public-home";

export const revalidate = 300;

type HomeSearchParams = Promise<{ lang?: string }>;

function pageLanguage(value: string | undefined) {
  return value === "en" ? "en" as const : "zh" as const;
}

function explicitLanguage(value: string | undefined) {
  return value === "zh" || value === "en" ? value : null;
}

export async function generateMetadata({ searchParams }: { searchParams: HomeSearchParams }): Promise<Metadata> {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const lang = explicitLanguage(query.lang) ?? pageLanguage(cookieStore.get("dx3xb_lang")?.value);
  const title = lang === "zh"
    ? "dx3xb — 网络趣味工具铺"
    : "dx3xb — a shop of web curiosities";
  const description = lang === "zh"
    ? "后 Web3 · AI 时代的网络趣味玩具铺：感官、反应、记忆挑战，以及玩家创作的小游戏。"
    : "A playful web toy shop for the post-Web3, AI age: sense, reaction and memory challenges, plus community-made games.";
  const url = lang === "en" ? "/?lang=en" : "/";

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": "/?lang=zh",
        en: "/?lang=en",
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "dx3xb",
      type: "website",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const [query, cookieStore] = await Promise.all([searchParams, cookies()]);
  const initialLang = explicitLanguage(query.lang) ?? pageLanguage(cookieStore.get("dx3xb_lang")?.value);
  const [initialToys, initialCommunity] = await Promise.all([
    getPublicToys().catch((error) => {
      console.error("home toys read failed", error);
      return [];
    }),
    getPublicWall("latest").catch((error) => {
      console.error("home wall read failed", error);
      return [];
    }),
  ]);

  return (
    <HomeClient
      initialLang={initialLang}
      initialToys={initialToys}
      initialCommunity={initialCommunity}
    />
  );
}
