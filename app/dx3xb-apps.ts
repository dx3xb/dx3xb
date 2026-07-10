// ===== dx3xb 微应用（无代码模板工厂）数据层 =====
// 复用 dx3xb-trio 的匿名会话客户端；数据由 RLS 保护。
import { dx3xb, ensureSession, getEmail } from "./dx3xb-trio";
import type { MicroEvent } from "./_mt/micro-meta";
import type { PublicCreator, PublicMicroappSummary } from "./_mt/creator-types";

export type QuizOption = { label: string; scores: Record<string, number> };
export type QuizQuestion = { q: string; options: QuizOption[] };
export type QuizResult = { key: string; emoji: string; title: string; desc: string };
export type QuizConfig = { intro: string; results: QuizResult[]; questions: QuizQuestion[] };
export type MicroStatus = "draft" | "unlisted" | "pending" | "public" | "hidden";
export type Microapp = {
  id: string;
  slug: string;
  title: string;
  template: string;
  config: unknown;
  status: MicroStatus;
  plays: number;
  updated_at?: string;
  creator?: PublicCreator | null;
  moreByCreator?: PublicMicroappSummary[];
};

const txt = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, max);
const keyOf = (v: unknown) =>
  String(v ?? "")
    .replace(/[^a-z0-9_-]/gi, "")
    .slice(0, 24) || "r";

export function emptyQuiz(lang: "zh" | "en" = "zh"): QuizConfig {
  if (lang === "en")
    return {
      intro: "5 questions to reveal your true self (sample — edit it)",
      results: [
        { key: "cat", emoji: "😼", title: "Lazy Cat", desc: "Motto: never sit when you can lie down." },
        { key: "dog", emoji: "🐶", title: "Sunny Dog", desc: "Endlessly curious and full of energy." },
      ],
      questions: [
        { q: "On weekends you'd rather…", options: [{ label: "Sleep till noon", scores: { cat: 2 } }, { label: "Go out all day", scores: { dog: 2 } }] },
        { q: "At a party you're usually…", options: [{ label: "Quietly snacking in a corner", scores: { cat: 2 } }, { label: "The loudest one there", scores: { dog: 2 } }] },
      ],
    };
  return {
    intro: "5 题测出你的本质（这是示例，改成你自己的）",
    results: [
      { key: "cat", emoji: "😼", title: "懒猫", desc: "人生信条：能躺着绝不坐着。" },
      { key: "dog", emoji: "🐶", title: "乐天犬", desc: "对世界永远充满好奇和热情。" },
    ],
    questions: [
      { q: "周末更想…", options: [{ label: "睡到自然醒", scores: { cat: 2 } }, { label: "出门浪一天", scores: { dog: 2 } }] },
      { q: "聚会时你通常…", options: [{ label: "角落里安静吃东西", scores: { cat: 2 } }, { label: "全场最闹的那个", scores: { dog: 2 } }] },
    ],
  };
}

// 把任意输入清洗成安全、规范的 QuizConfig（去 HTML/控制符、限长、限量、去无效 key）
export function validateQuizConfig(input: unknown): QuizConfig {
  const obj = (input ?? {}) as Record<string, unknown>;
  const rawResults = Array.isArray(obj.results) ? obj.results.slice(0, 8) : [];
  const seen = new Set<string>();
  const results: QuizResult[] = [];
  for (const r of rawResults as Record<string, unknown>[]) {
    const k = keyOf(r?.key);
    if (seen.has(k)) continue;
    seen.add(k);
    results.push({ key: k, emoji: txt(r?.emoji, 6), title: txt(r?.title, 40), desc: txt(r?.desc, 200) });
  }
  const validKeys = new Set(results.map((r) => r.key));
  const rawQ = Array.isArray(obj.questions) ? obj.questions.slice(0, 12) : [];
  const questions: QuizQuestion[] = (rawQ as Record<string, unknown>[]).map((qq) => {
    const opts = (Array.isArray(qq?.options) ? qq.options.slice(0, 6) : []) as Record<string, unknown>[];
    return {
      q: txt(qq?.q, 120),
      options: opts.map((o) => {
        const scores: Record<string, number> = {};
        const so = o?.scores;
        if (so && typeof so === "object") {
          for (const k of Object.keys(so as Record<string, unknown>)) {
            const kk = keyOf(k);
            if (validKeys.has(kk)) scores[kk] = Math.max(0, Math.min(5, Number((so as Record<string, unknown>)[k]) || 0));
          }
        }
        return { label: txt(o?.label, 60), scores };
      }),
    };
  });
  return { intro: txt(obj.intro, 200), results, questions };
}

export function quizIsPublishable(c: QuizConfig): boolean {
  return (
    c.results.length >= 2 &&
    c.results.every((r) => r.title.trim()) &&
    c.questions.length >= 1 &&
    c.questions.every((q) => q.q.trim() && q.options.length >= 2 && q.options.every((o) => o.label.trim()))
  );
}

// 计分：累加各 result key，最高者为结果
export function scoreQuiz(config: QuizConfig, picks: number[]): QuizResult | null {
  if (config.results.length === 0) return null;
  const tally: Record<string, number> = {};
  for (const r of config.results) tally[r.key] = 0;
  config.questions.forEach((q, i) => {
    const o = q.options[picks[i]];
    if (!o) return;
    for (const k of Object.keys(o.scores)) tally[k] = (tally[k] ?? 0) + o.scores[k];
  });
  let best = config.results[0];
  for (const r of config.results) if ((tally[r.key] ?? 0) > (tally[best.key] ?? 0)) best = r;
  return best;
}

const SEL = "id,slug,title,template,config,status,plays,updated_at";

export const TEMPLATE_META: { id: string; emoji: string; name: Record<"zh" | "en", string>; tagline: Record<"zh" | "en", string> }[] = [
  { id: "quiz", emoji: "🐱", name: { zh: "小测验 / 人格测试", en: "Quiz / Personality" }, tagline: { zh: "答题出称号，看你是哪种", en: "Answer questions → a personality result" } },
  { id: "knowme", emoji: "💘", name: { zh: "懂我测试", en: "Know-Me Quiz" }, tagline: { zh: "出关于自己的题，看朋友有多懂你", en: "Quiz about you — how well do friends know you?" } },
  { id: "thisorthat", emoji: "⚔️", name: { zh: "二选一", en: "This-or-That" }, tagline: { zh: "一串 A vs B，看你和作者多合拍", en: "A vs B — how much do you match the creator?" } },
  { id: "higherlower", emoji: "📈", name: { zh: "猜价闯关", en: "Higher-Lower" }, tagline: { zh: "猜下一个更高还是更低，冲连胜", en: "Guess higher or lower — chase a streak" } },
  { id: "madlibs", emoji: "📖", name: { zh: "故事填词", en: "Mad Libs" }, tagline: { zh: "写带空的故事，朋友乱填出爆笑剧情", en: "Write a story with blanks — friends fill the funny" } },
  { id: "escape", emoji: "🔐", name: { zh: "解谜闯关", en: "Riddle Escape" }, tagline: { zh: "出一串谜题，朋友逐关解锁比用时", en: "Chain of riddles — escape and beat the clock" } },
  { id: "workshop", emoji: "🕹️", name: { zh: "AI 游戏工坊", en: "AI Game Workshop" }, tagline: { zh: "注册后用 AI 生成受控互动小游戏", en: "Registered users generate controlled mini games" } },
];

export async function createMicroapp(template: string, config: unknown): Promise<{ id: string; slug: string } | null> {
  const c = dx3xb();
  const id = await ensureSession();
  if (!id) return null;
  if (template === "workshop" && !(await getEmail())) return null;
  for (let i = 0; i < 5; i += 1) {
    const slug = "q" + Math.random().toString(36).slice(2, 8);
    const { data, error } = await c
      .from("dx3xb_microapps")
      .insert({ owner_id: id, slug, template, title: "", config, status: "draft" })
      .select("id,slug")
      .single();
    if (!error && data) return { id: data.id as string, slug: data.slug as string };
    if (error && !String(error.message).toLowerCase().includes("duplicate")) return null;
  }
  return null;
}

export async function updateMicroapp(
  id: string,
  patch: { title?: string; config?: unknown; status?: MicroStatus },
): Promise<boolean> {
  const c = dx3xb();
  await ensureSession();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) row.title = txt(patch.title, 60);
  if (patch.config !== undefined) row.config = patch.config; // 各模板自行 validate 后再传入
  if (patch.status !== undefined) row.status = patch.status;
  const { error } = await c.from("dx3xb_microapps").update(row).eq("id", id);
  return !error;
}

export async function deleteMicroapp(id: string): Promise<boolean> {
  const c = dx3xb();
  await ensureSession();
  const { error } = await c.from("dx3xb_microapps").delete().eq("id", id);
  return !error;
}

export async function getMyMicroapps(): Promise<Microapp[]> {
  try {
    const c = dx3xb();
    const id = await ensureSession();
    if (!id) return [];
    const { data } = await c.from("dx3xb_microapps").select(SEL).eq("owner_id", id).order("updated_at", { ascending: false });
    return (data ?? []) as Microapp[];
  } catch {
    return [];
  }
}

export async function getMicroapp(id: string): Promise<Microapp | null> {
  try {
    const c = dx3xb();
    await ensureSession();
    const { data } = await c.from("dx3xb_microapps").select(SEL).eq("id", id).maybeSingle();
    return (data as Microapp) ?? null;
  } catch {
    return null;
  }
}

export async function getMicroappBySlug(slug: string): Promise<Microapp | null> {
  try {
    const res = await fetch(`/api/microapps/${encodeURIComponent(slug)}`, { cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.app) return null;
    return body.app as Microapp;
  } catch {
    return null;
  }
}

export async function listPublicMicroapps(limit = 24): Promise<Microapp[]> {
  try {
    const c = dx3xb();
    await ensureSession();
    const { data } = await c
      .from("dx3xb_microapps")
      .select(SEL)
      .eq("status", "public")
      .order("plays", { ascending: false })
      .limit(limit);
    return (data ?? []) as Microapp[];
  } catch {
    return [];
  }
}

export async function bumpPlay(slug: string) {
  try {
    await dx3xb().rpc("dx3xb_bump_play", { app_slug: slug });
  } catch {
    /* ignore */
  }
}

export async function reportMicroapp(id: string, reason: string) {
  try {
    await dx3xb().from("dx3xb_microapp_reports").insert({ microapp_id: id, reason: reason.slice(0, 200) });
  } catch {
    /* ignore */
  }
}

export async function trackMicroappEvent(slug: string, event: MicroEvent) {
  try {
    await fetch(`/api/microapps/${encodeURIComponent(slug)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true,
    });
  } catch {
    /* analytics failure must not affect play */
  }
}
