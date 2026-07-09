import type { Lang } from "./types";

export const META_KEY = "_dx3xb";

export type MicroTheme = "pixel" | "candy" | "noir" | "paper";
export type MicroFont = "pixel" | "soft" | "mono";
export type MicroCard = "solid" | "ticket" | "shadow";
export type MicroEvent = "view" | "start" | "complete" | "share";

export type MicroAdvanced = {
  shuffle: boolean;
  showProgress: boolean;
  timeLimitSec: number;
  lives: number;
};

export type MicroMeta = {
  theme: MicroTheme;
  coverEmoji: string;
  accent: string;
  font: MicroFont;
  card: MicroCard;
  advanced: MicroAdvanced;
  aiPrompt: string;
};

export const DEFAULT_META: MicroMeta = {
  theme: "pixel",
  coverEmoji: "🎮",
  accent: "#ff5f57",
  font: "pixel",
  card: "solid",
  advanced: {
    shuffle: false,
    showProgress: true,
    timeLimitSec: 0,
    lives: 1,
  },
  aiPrompt: "",
};

export const THEME_OPTIONS: { id: MicroTheme; zh: string; en: string }[] = [
  { id: "pixel", zh: "像素", en: "Pixel" },
  { id: "candy", zh: "糖果", en: "Candy" },
  { id: "noir", zh: "夜色", en: "Noir" },
  { id: "paper", zh: "手账", en: "Paper" },
];

export const FONT_OPTIONS: { id: MicroFont; zh: string; en: string }[] = [
  { id: "pixel", zh: "像素", en: "Pixel" },
  { id: "soft", zh: "圆润", en: "Soft" },
  { id: "mono", zh: "等宽", en: "Mono" },
];

export const CARD_OPTIONS: { id: MicroCard; zh: string; en: string }[] = [
  { id: "solid", zh: "硬边", en: "Solid" },
  { id: "ticket", zh: "票根", en: "Ticket" },
  { id: "shadow", zh: "浮起", en: "Shadow" },
];

export const ACCENTS = ["#ff5f57", "#12b7a6", "#4564ff", "#f7c948", "#9b5de5", "#111827"];

const isTheme = (v: unknown): v is MicroTheme => v === "pixel" || v === "candy" || v === "noir" || v === "paper";
const isFont = (v: unknown): v is MicroFont => v === "pixel" || v === "soft" || v === "mono";
const isCard = (v: unknown): v is MicroCard => v === "solid" || v === "ticket" || v === "shadow";
const clean = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .slice(0, max);

export function normalizeMicroMeta(input: unknown): MicroMeta {
  const o = (input ?? {}) as Record<string, unknown>;
  const adv = ((o.advanced ?? {}) as Record<string, unknown>) || {};
  const accent = clean(o.accent, 16);
  const timeLimitSec = Math.max(0, Math.min(900, Math.round(Number(adv.timeLimitSec) || 0)));
  const lives = Math.max(1, Math.min(9, Math.round(Number(adv.lives) || 1)));
  return {
    theme: isTheme(o.theme) ? o.theme : DEFAULT_META.theme,
    coverEmoji: clean(o.coverEmoji, 6) || DEFAULT_META.coverEmoji,
    accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : DEFAULT_META.accent,
    font: isFont(o.font) ? o.font : DEFAULT_META.font,
    card: isCard(o.card) ? o.card : DEFAULT_META.card,
    advanced: {
      shuffle: Boolean(adv.shuffle),
      showProgress: adv.showProgress === false ? false : true,
      timeLimitSec,
      lives,
    },
    aiPrompt: clean(o.aiPrompt, 240),
  };
}

export function extractMicroMeta(config: unknown): MicroMeta {
  const obj = (config ?? {}) as Record<string, unknown>;
  return normalizeMicroMeta(obj[META_KEY]);
}

export function stripMicroMeta<T>(config: T): T {
  if (!config || typeof config !== "object" || Array.isArray(config)) return config;
  const { [META_KEY]: _meta, ...rest } = config as Record<string, unknown>;
  return rest as T;
}

export function attachMicroMeta(config: unknown, meta: MicroMeta): unknown {
  if (!config || typeof config !== "object" || Array.isArray(config)) return config;
  return { ...(config as Record<string, unknown>), [META_KEY]: normalizeMicroMeta(meta) };
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = items.slice();
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = out.length - 1; i > 0; i -= 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function applyAdvancedConfig(config: unknown, template: string, meta: MicroMeta, seed: string): unknown {
  if (!meta.advanced.shuffle || !config || typeof config !== "object" || Array.isArray(config)) return config;
  const c = config as Record<string, unknown>;
  const key =
    template === "quiz" || template === "knowme"
      ? "questions"
      : template === "thisorthat"
        ? "pairs"
        : template === "higherlower"
          ? "items"
          : "";
  if (!key || !Array.isArray(c[key])) return config;
  return { ...c, [key]: seededShuffle(c[key] as unknown[], `${seed}:${template}:${key}`) };
}

export function summarizeMicroConfig(template: string, config: unknown, lang: Lang) {
  const c = stripMicroMeta((config ?? {}) as Record<string, unknown>) as Record<string, unknown>;
  const n = (key: string) => (Array.isArray(c[key]) ? (c[key] as unknown[]).length : 0);
  if (template === "quiz") return lang === "zh" ? `${n("questions")} 题 / ${n("results")} 个结果` : `${n("questions")} questions / ${n("results")} results`;
  if (template === "knowme") return lang === "zh" ? `${n("questions")} 题 / ${n("results")} 档结果` : `${n("questions")} questions / ${n("results")} bands`;
  if (template === "thisorthat") return lang === "zh" ? `${n("pairs")} 组二选一` : `${n("pairs")} pairs`;
  if (template === "higherlower") return lang === "zh" ? `${n("items")} 个条目` : `${n("items")} items`;
  if (template === "madlibs") {
    const story = String(c.story ?? "");
    const blanks = (story.match(/\{[^{}]{1,24}\}/g) ?? []).length;
    return lang === "zh" ? `${blanks} 个填空` : `${blanks} blanks`;
  }
  if (template === "escape") return lang === "zh" ? `${n("riddles")} 关谜题` : `${n("riddles")} rooms`;
  return lang === "zh" ? "自定义内容" : "Custom content";
}
