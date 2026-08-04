import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-court.dx3xb.com"),
  title: "AI 法庭 | dx3xb",
  description: "在准确与公平之间审理算法案件，理解阈值、影响和责任。",
  alternates: { canonical: "/" },
  openGraph: { title: "AI 法庭 | dx3xb", description: "在准确与公平之间审理算法案件，理解阈值、影响和责任。", url: "/", siteName: "dx3xb", locale: "zh_CN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "AI 法庭" }] },
  twitter: { card: "summary_large_image", title: "AI 法庭 | dx3xb", description: "在准确与公平之间审理算法案件，理解阈值、影响和责任。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh"><body>{children}</body></html>;
}

