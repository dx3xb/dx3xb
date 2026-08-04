import type { Metadata } from "next";
import "./theme.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://data-monster.dx3xb.com"),
  title: "数据怪兽训练营 | dx3xb",
  description: "给像素怪兽贴标签，亲手训练并测试一个分类器。",
  alternates: { canonical: "/" },
  openGraph: { title: "数据怪兽训练营 | dx3xb", description: "给像素怪兽贴标签，亲手训练并测试一个分类器。", url: "/", siteName: "dx3xb", locale: "zh_CN", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "数据怪兽训练营" }] },
  twitter: { card: "summary_large_image", title: "数据怪兽训练营 | dx3xb", description: "给像素怪兽贴标签，亲手训练并测试一个分类器。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh"><body>{children}</body></html>;
}

