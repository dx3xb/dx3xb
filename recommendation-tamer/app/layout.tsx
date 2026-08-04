import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://recommendation-tamer.dx3xb.com"),
  title: "推荐算法驯兽师 | dx3xb",
  description: "观察推荐器如何被你的每次选择驯化，再主动打破信息茧房。",
  alternates: { canonical: "/" },
  openGraph: { title: "推荐算法驯兽师 | dx3xb", description: "观察推荐器如何被你的每次选择驯化，再主动打破信息茧房。", url: "/", siteName: "dx3xb", locale: "zh_CN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "推荐算法驯兽师" }] },
  twitter: { card: "summary_large_image", title: "推荐算法驯兽师 | dx3xb", description: "观察推荐器如何被你的每次选择驯化，再主动打破信息茧房。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh"><body>{children}</body></html>;
}

