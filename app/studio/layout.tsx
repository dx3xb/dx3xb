import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "创建玩具 Studio — dx3xb",
  description: "用模板或 AI Workshop 做一个可以直接分享的网页小游戏。",
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "创建玩具 Studio — dx3xb",
    description: "做一个可以直接分享的网页小游戏。",
    url: "/studio",
    siteName: "dx3xb",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
