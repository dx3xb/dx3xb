import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCreatorPage } from "@/lib/public-creators";
import { CreatorProfileClient } from "./CreatorProfileClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function load(handle: string) {
  try {
    return await getPublicCreatorPage(handle);
  } catch (error) {
    console.error("creator page read failed", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const data = await load(handle);
  if (!data) return { title: "Creator · dx3xb", robots: { index: false, follow: false } };
  const title = `@${data.creator.handle} · dx3xb`;
  const description = `${data.apps.length} games · ${data.totalPlays} plays on dx3xb`;
  return {
    title,
    description,
    openGraph: { title, description, siteName: "dx3xb", type: "profile", images: ["https://dx3xb.com/opengraph-image"] },
    twitter: { card: "summary", title, description, images: ["https://dx3xb.com/opengraph-image"] },
  };
}

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ handle }, query] = await Promise.all([params, searchParams]);
  const data = await load(handle);
  if (!data) notFound();
  return <CreatorProfileClient data={data} lang={query.lang === "zh" ? "zh" : "en"} />;
}
