import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./theme.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap" });
const vt = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://dont-click-wrong.dx3xb.com"),
  title: "不要点错 Don't Tap Wrong — dx3xb",
  description: "60 秒反应控制挑战：看清颜色和形状，点对加分，点错扣时。支持同题挑战。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "不要点错 Don't Tap Wrong — dx3xb",
    description: "60 秒反应控制挑战。看清指令，别让手比脑子快。",
    url: "/",
    siteName: "dx3xb",
    type: "website",
    images: ["https://dx3xb.com/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "不要点错 Don't Tap Wrong — dx3xb",
    description: "60 秒反应控制挑战。看清指令，别让手比脑子快。",
    images: ["https://dx3xb.com/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6e6",
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
