import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./theme.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap" });
const vt = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-detective.dx3xb.com"),
  title: "AI 侦探社：谁在胡说 — dx3xb",
  description: "60–90 秒 AI 幻觉与信息核验挑战，找出最不可靠的那句话。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI 侦探社：谁在胡说 — dx3xb",
    description: "AI 说得这么像真的，你能找出它在胡说的那一句吗？",
    url: "/",
    siteName: "dx3xb",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "AI 侦探社：谁在胡说？" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 侦探社：谁在胡说 — dx3xb",
    description: "AI 说得这么像真的，你能找出它在胡说的那一句吗？",
    images: ["/og.png"],
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
