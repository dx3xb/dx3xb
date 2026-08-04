"use client";

import { useEffect, useRef, useState } from "react";
import { trioBridgeCall } from "./trio-bridge-client";

export const AI_GAME = "data-monster" as const;

export type AiRunPayload = {
  score: number;
  pct: number;
  title: string;
  lang: string;
  handle?: string;
  stats?: Record<string, unknown>;
};

type AiQuestProgress = {
  done: number;
  total: number;
  best: Partial<Record<string, { score: number; pct: number; title: string }>>;
  nextGame: string | null;
  daily: { date: string; game: string; completed: boolean; streak: number };
  isAnonymous: boolean;
};

export type AiGameStats = { plays: number; averageMastery: number; dailyCompletions: number };
export type AiProfile = { handle: string | null; email: string | null; isAnonymous: boolean };

export async function recordAiRun(run: AiRunPayload) {
  return trioBridgeCall<{ ok: boolean }>("recordAiRun", { run });
}

export async function getAiProgress() {
  return trioBridgeCall<AiQuestProgress>("aiProgress");
}

export async function getAiGameStats() {
  return trioBridgeCall<AiGameStats>("aiGameStats");
}

export async function getAiProfile() {
  return trioBridgeCall<AiProfile>("profile");
}

const COPY = {
  zh: { label: "AI 探险护照", unlocked: "数据芯片已点亮", progress: (done: number, total: number) => `${done}/${total} 枚芯片`, hint: "你刚刚真的训练并测试了一个分类器。", account: "打开我的空间 →", saving: "正在保存训练记录…" },
  en: { label: "AI ADVENTURE PASSPORT", unlocked: "DATA CHIP UNLOCKED", progress: (done: number, total: number) => `${done}/${total} CHIPS`, hint: "You just trained and tested a real classifier.", account: "OPEN MY SPACE →", saving: "SAVING TRAINING RUN…" },
} as const;

export function AiQuestFooter({ lang, run }: { lang: "zh" | "en"; run: AiRunPayload }) {
  const recorded = useRef(false);
  const [progress, setProgress] = useState<AiQuestProgress | null>(null);
  const t = COPY[lang];

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    (async () => {
      try {
        await recordAiRun(run);
        setProgress(await getAiProgress());
      } catch {
        setProgress({ done: 1, total: 5, best: { [AI_GAME]: { score: run.score, pct: run.pct, title: run.title } }, nextGame: "prompt-commander", daily: { date: "", game: AI_GAME, completed: false, streak: 0 }, isAnonymous: true });
      }
    })();
  }, [run]);

  return (
    <section className="passport" aria-label={t.label}>
      <div className="passportChip" aria-hidden="true">🧬</div>
      <div className="passportBody">
        <p className="passportLabel pixel">{t.label}</p>
        <h3>{progress ? t.unlocked : t.saving}</h3>
        <p>{progress ? `${t.progress(progress.done, progress.total)} · ${t.hint}` : t.saving}</p>
        <a href={`https://dx3xb.com/me?lang=${lang}`}>{t.account}</a>
      </div>
    </section>
  );
}
