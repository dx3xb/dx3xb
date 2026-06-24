import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const press = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press",
  display: "swap",
});

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dx3xb — 网络趣味工具铺 / a shop of web curiosities",
  description:
    "后 Web3 · AI 时代的网络趣味玩具铺。dx3xb 是一张噘嘴的小脸 (d ears, x eyes, 3 mouth)。A toy shop of fun web tools for the post-Web3 / AI age.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='24'>😗</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6e6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${press.variable} ${vt.variable}`}>{children}</body>
    </html>
  );
}
