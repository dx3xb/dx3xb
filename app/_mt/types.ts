// 微应用模板注册表 · 类型
import type { ReactNode } from "react";

export type Lang = "zh" | "en";

// 每个模板自定义自己的 config 形状；Player/Editor 都按该形状工作。
export type TemplateDef<C = unknown> = {
  id: string;
  emoji: string;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  empty: () => C;
  validate: (c: unknown) => C; // 读取/保存前清洗：去 HTML/控制符、限长限量
  publishable: (c: C) => boolean;
  Player: (p: { config: C; title: string; slug?: string; lang: Lang; preview?: boolean }) => ReactNode;
  Editor: (p: { config: C; onChange: (c: C) => void; lang: Lang }) => ReactNode;
};

// 文本清洗：去控制符（含 NULL）与尖括号，限长（保留数字/空格/标点）
export const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .slice(0, max);
