import type { Metadata } from "next";
export const metadata: Metadata = { title: "AI 课堂挑战 | dx3xb", description: "用匿名挑战码带全班完成 AI 素养小游戏，并查看聚合学习反馈。", alternates: { canonical: "/class" } };
export default function ClassroomLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }

