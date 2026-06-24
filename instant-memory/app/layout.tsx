import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./theme.css";

const press = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press", display: "swap" });
const vt = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  title: "瞬间记忆 Instant Memory — dx3xb",
  description: "A 60-second sequence memory challenge from dx3xb.com.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${press.variable} ${vt.variable}`}>{children}</body>
    </html>
  );
}
