import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./theme.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap" });
const vt = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://instant-memory.dx3xb.com"),
  title: "瞬间记忆 Instant Memory — dx3xb",
  description: "60 秒短时记忆挑战，支持同题复战和分享报告。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "瞬间记忆 Instant Memory — dx3xb",
    description: "60 秒序列记忆挑战，看看你的脑内缓存能装多少。",
    url: "/",
    siteName: "dx3xb",
    type: "website",
    images: ["https://dx3xb.com/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "瞬间记忆 Instant Memory — dx3xb",
    description: "60 秒序列记忆挑战，看看你的脑内缓存能装多少。",
    images: ["https://dx3xb.com/opengraph-image"],
  },
};

const languageBootstrap = `(function(){try{var q=new URLSearchParams(location.search).get('lang');var c=document.cookie.match(/(?:^|; )dx3xb_lang=(zh|en)/);var s=localStorage.getItem('dx3xb_lang');document.documentElement.lang=q==='en'||q==='zh'?q:c?c[1]:s==='en'?'en':'zh'}catch(_){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${press.variable} ${vt.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: languageBootstrap }} />
        {children}
      </body>
    </html>
  );
}
