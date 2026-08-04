"use client";

import { useEffect, useRef, useState } from "react";
import { trioBridgeCall } from "./trio-bridge-client";

export const AI_GAME = "ai-truth-detective" as const;

export type AiRunPayload = {
  score: number;
  pct: number;
  title: string;
  lang: string;
  handle?: string;
  stats?: Record<string, unknown>;
};

export type AiQuestProgress = {
  done: number;
  total: number;
  best: { score: number; pct: number; title: string } | null;
  isAnonymous: boolean;
};

export type AiProfile = { handle: string | null; email: string | null; isAnonymous: boolean };

export async function recordAiRun(run: AiRunPayload) {
  return trioBridgeCall<{ ok: boolean }>("recordAiRun", { run });
}

export async function getAiProgress() {
  return trioBridgeCall<AiQuestProgress>("aiProgress");
}

export async function getAiProfile() {
  return trioBridgeCall<AiProfile>("profile");
}

const COPY = {
  zh: {
    label: "AI 探险护照",
    unlocked: "证据芯片已点亮",
    progress: (done: number, total: number) => `${done}/${total} 枚芯片`,
    hint: "第一关完成。战报已经存进你的成长空间。",
    account: "查看我的空间 →",
    saving: "正在保存本局记录…",
  },
  en: {
    label: "AI ADVENTURE PASSPORT",
    unlocked: "EVIDENCE CHIP UNLOCKED",
    progress: (done: number, total: number) => `${done}/${total} CHIPS`,
    hint: "Mission one complete. This run is saved to your space.",
    account: "OPEN MY SPACE →",
    saving: "SAVING THIS RUN…",
  },
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
        setProgress({ done: 1, total: 5, best: { score: run.score, pct: run.pct, title: run.title }, isAnonymous: true });
      }
    })();
  }, [run]);

  return (
    <section className="passport" aria-label={t.label}>
      <div className="passportChip" aria-hidden="true">🔎</div>
      <div className="passportBody">
        <p className="passportLabel pixel">{t.label}</p>
        <h3>{progress ? t.unlocked : t.saving}</h3>
        <p>{progress ? `${t.progress(progress.done, progress.total)} · ${t.hint}` : t.saving}</p>
        <a href={`https://dx3xb.com/me?lang=${lang}`}>{t.account}</a>
      </div>
    </section>
  );
}
