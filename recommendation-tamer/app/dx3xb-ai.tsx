"use client";

import { useEffect, useRef, useState } from "react";
import { trioBridgeCall } from "./trio-bridge-client";

export const AI_GAME = "recommendation-tamer" as const;

export type AiRunPayload = { score: number; pct: number; title: string; lang: string; handle?: string; stats?: Record<string, unknown> };
type AiQuestProgress = { done: number; total: number; best: Partial<Record<string, { score: number; pct: number; title: string }>>; nextGame: string | null; daily: { date: string; game: string; completed: boolean; streak: number }; isAnonymous: boolean };
export type AiGameStats = { plays: number; averageMastery: number; dailyCompletions: number };
export type AiProfile = { handle: string | null; email: string | null; isAnonymous: boolean };

export async function recordAiRun(run: AiRunPayload) { return trioBridgeCall<{ ok: boolean }>("recordAiRun", { run }); }
export async function getAiProgress() { return trioBridgeCall<AiQuestProgress>("aiProgress"); }
export async function getAiGameStats() { return trioBridgeCall<AiGameStats>("aiGameStats"); }
export async function getAiProfile() { return trioBridgeCall<AiProfile>("profile"); }

const COPY = {
  zh: { label: "AI 探险护照", unlocked: "多元芯片已点亮", progress: (done: number, total: number) => `${done}/${total} 枚芯片`, hint: "你看见了反馈循环，也学会主动打破信息茧房。", account: "打开我的空间 →", saving: "正在保存驯服记录…" },
  en: { label: "AI ADVENTURE PASSPORT", unlocked: "DIVERSITY CHIP UNLOCKED", progress: (done: number, total: number) => `${done}/${total} CHIPS`, hint: "You saw the feedback loop and learned how to widen a feed.", account: "OPEN MY SPACE →", saving: "SAVING TAMER RUN…" },
} as const;

export function AiQuestFooter({ lang, run }: { lang: "zh" | "en"; run: AiRunPayload }) {
  const recorded = useRef(false);
  const [progress, setProgress] = useState<AiQuestProgress | null>(null);
  const t = COPY[lang];
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    (async () => {
      try { await recordAiRun(run); setProgress(await getAiProgress()); }
      catch { setProgress({ done: 1, total: 5, best: { [AI_GAME]: { score: run.score, pct: run.pct, title: run.title } }, nextGame: "ai-court", daily: { date: "", game: AI_GAME, completed: false, streak: 0 }, isAnonymous: true }); }
    })();
  }, [run]);
  return <section className="passport" aria-label={t.label}><div className="passportChip" aria-hidden="true">🧭</div><div className="passportBody"><p className="passportLabel pixel">{t.label}</p><h3>{progress ? t.unlocked : t.saving}</h3><p>{progress ? `${t.progress(progress.done, progress.total)} · ${t.hint}` : t.saving}</p><a href={`https://dx3xb.com/me?lang=${lang}`}>{t.account}</a></div></section>;
}
