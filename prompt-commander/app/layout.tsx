import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-commander.dx3xb.com"),
  title: "提示词指挥官 | dx3xb",
  description: "把模糊要求拆成清楚指令，指挥机器人完成地图任务。",
  alternates: { canonical: "/" },
  openGraph: { title: "提示词指挥官 | dx3xb", description: "把模糊要求拆成清楚指令，指挥机器人完成地图任务。", url: "/", siteName: "dx3xb", locale: "zh_CN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "提示词指挥官" }] },
  twitter: { card: "summary_large_image", title: "提示词指挥官 | dx3xb", description: "把模糊要求拆成清楚指令，指挥机器人完成地图任务。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh"><body>{children}</body></html>;
}

