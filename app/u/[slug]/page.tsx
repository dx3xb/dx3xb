import type { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase";
import { RunnerClient } from "./RunnerClient";

export const runtime = "nodejs";

const NAMES: Record<string, string> = {
  quiz: "小测验",
  knowme: "懂我测试",
  thisorthat: "二选一",
  higherlower: "猜价闯关",
  madlibs: "故事填词",
  escape: "解谜闯关",
};

async function getApp(slug: string) {
  try {
    const s = getServiceClient();
    const { data } = await s
      .from("dx3xb_microapps")
      .select("title, template, status")
      .eq("slug", slug)
      .maybeSingle();
    if (!data || data.status === "draft" || data.status === "hidden") return null;
    return data as { title: string; template: string; status: string };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = await getApp(slug);
  const title = app?.title ? `${app.title} · dx3xb` : "dx3xb 微应用";
  const kind = app ? NAMES[app.template] || "小玩具" : "趣味小工具";
  const desc = app ? `来玩玩这个${kind}，看你的结果 —— dx3xb 微应用工厂` : "dx3xb · 后 Web3 / AI 时代的趣味网络小工具铺";
  const url = `https://dx3xb.com/u/${slug}`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url, siteName: "dx3xb", type: "website", images: ["https://dx3xb.com/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description: desc, images: ["https://dx3xb.com/opengraph-image"] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RunnerClient slug={slug} />;
}
