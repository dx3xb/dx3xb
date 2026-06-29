import type { Metadata } from "next";
import { TrioClient } from "./TrioClient";

function clip(v: string | string[] | undefined, max: number) {
  return String(Array.isArray(v) ? v[0] : v ?? "").replace(/[<>]/g, "").slice(0, max);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const from = clip(sp.from, 24);
  const score = Number(Array.isArray(sp.score) ? sp.score[0] : sp.score) || 0;
  const title = "感官与脑力三件套 · dx3xb";
  const desc =
    from && score > 0
      ? `${from} 的三件套综合分 ${score}%，敢不敢超过 ta？三关测你的感官·反应·记忆 —— dx3xb`
      : "三关测你的感官辨别、反应控制、短时记忆，集齐解锁综合脑力报告 —— dx3xb";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, url: "https://dx3xb.com/trio", siteName: "dx3xb", type: "website", images: ["https://dx3xb.com/opengraph-image"] },
    twitter: { card: "summary_large_image", title, description: desc, images: ["https://dx3xb.com/opengraph-image"] },
  };
}

export default function Page() {
  return <TrioClient />;
}
