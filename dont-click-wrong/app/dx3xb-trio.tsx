"use client";
// ===== dx3xb 感官与脑力三件套 · 共享 drop-in 组件 =====
// 跨 *.dx3xb.com 共享匿名会话 + 记录战报 + 三件套进度 + 邮箱认领。
// 每个游戏：npm i @supabase/supabase-js，复制本文件，战报页放 <TrioFooter .../> 即可。
// anon key 是公开 key（数据由 RLS 保护）。
import { useEffect, useRef, useState } from "react";
import { trioBridgeCall } from "./trio-bridge-client";

export const TRIO_GAMES = ["color-hunter", "dont-click-wrong", "instant-memory"] as const;
export type TrioGame = (typeof TRIO_GAMES)[number];
type Lang = "zh" | "en";

export const GAME_URL: Record<TrioGame, string> = {
  "color-hunter": "https://color-hunter.dx3xb.com",
  "dont-click-wrong": "https://dont-click-wrong.dx3xb.com",
  "instant-memory": "https://instant-memory.dx3xb.com",
};
export const TRIO_REPORT_URL = "https://dx3xb.com/trio";

const GAME_NAME: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "色差猎人", "dont-click-wrong": "不要点错", "instant-memory": "瞬间记忆" },
  en: { "color-hunter": "color hunter", "dont-click-wrong": "Don't Tap Wrong", "instant-memory": "instant memory" },
};
const GAME_SENSE: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "感官", "dont-click-wrong": "反应", "instant-memory": "记忆" },
  en: { "color-hunter": "SENSE", "dont-click-wrong": "REACT", "instant-memory": "MEMORY" },
};
const GAME_EMOJI: Record<TrioGame, string> = {
  "color-hunter": "👁️",
  "dont-click-wrong": "⚡",
  "instant-memory": "🧠",
};
const GAME_COLOR: Record<TrioGame, string> = {
  "color-hunter": "#ff5f57",
  "dont-click-wrong": "#12b7a6",
  "instant-memory": "#4564ff",
};
const GAME_TEASER: Record<Lang, Record<TrioGame, string>> = {
  zh: {
    "color-hunter": "一眼揪出那块不一样的颜色",
    "dont-click-wrong": "看清指令再下手，手要够快",
    "instant-memory": "记住闪现的序列，再点回来",
  },
  en: {
    "color-hunter": "Spot the one odd color out",
    "dont-click-wrong": "Read fast, tap even faster",
    "instant-memory": "Memorize the flash, tap it back",
  },
};

export async function ensureSession(): Promise<string | null> {
  const result = await trioBridgeCall<{ userId: string | null }>("session");
  return result.userId;
}

export type RunPayload = {
  score: number;
  pct: number;
  title: string;
  lang: string;
  handle?: string;
  stats?: Record<string, unknown>;
};

export async function recordRun(game: TrioGame, p: RunPayload): Promise<void> {
  await trioBridgeCall("recordRun", { game, run: p });
}

export type TrioBest = { score: number; pct: number; title: string };
export type TrioProgress = {
  done: number;
  best: Partial<Record<TrioGame, TrioBest>>;
  nextGame: TrioGame | null;
  isAnonymous: boolean;
  allDone: boolean;
};

export async function getTrioProgress(): Promise<TrioProgress> {
  return trioBridgeCall<TrioProgress>("progress");
}

export type TrioProfile = { handle: string | null; email: string | null; isAnonymous: boolean };
export async function getTrioProfile(): Promise<TrioProfile> {
  return trioBridgeCall<TrioProfile>("profile");
}

export async function getProfileHandle(): Promise<string | null> {
  return (await getTrioProfile()).handle;
}

export type MyRun = { game: TrioGame; score: number; pct: number; title: string; created_at: string };
export async function getMyRuns(): Promise<MyRun[]> {
  return [];
}

export async function getEmail(): Promise<string | null> {
  return (await getTrioProfile()).email;
}

/* ---------- UI 文案 ---------- */
const UI = {
  zh: {
    label: "感官与脑力三件套",
    nextEyebrow: "下一关",
    reportEyebrow: "三件套通关 🎉",
    reportName: "查看综合脑力总报告",
    claimTitle: "已过 2 关！注册正式账号",
    claimHint: "保存全部战报、解锁你的空间，继续第 3 关进度也不会丢。",
    accountCta: "去注册 / 登录",
    saving: "正在保存战报…",
  },
  en: {
    label: "Sensory & Brainpower Trio",
    nextEyebrow: "NEXT UP",
    reportEyebrow: "TRIO COMPLETE 🎉",
    reportName: "See your combined report",
    claimTitle: "2 down! Create an account",
    claimHint: "Save every report, unlock your space — your progress sticks for game 3.",
    accountCta: "Sign up / Sign in",
    saving: "Saving your run…",
  },
} as const;

const STYLE = `
.trio { margin-top: 14px; border: 3px solid var(--line, #221a2b); background: #fffdf8;
  box-shadow: 6px 6px 0 var(--ink, #221a2b); padding: 14px; }
.trio-label { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px;
  color: var(--ink-soft, #5f5368); margin: 0 0 10px; }
.trio-track { display: flex; align-items: stretch; gap: 0; }
.trio-seg { flex: 1; text-align: center; border: 3px solid var(--line, #221a2b); padding: 8px 4px;
  background: #fff; }
.trio-seg + .trio-seg { border-left: none; }
.trio-seg.done { background: var(--coral, #ff5f57); color: #fff; }
.trio-seg.cur { background: var(--yellow, #ffd044); color: var(--ink, #221a2b); }
.trio-seg b { display: block; font-family: var(--font-press), monospace; font-size: 10px; }
.trio-seg span { display: block; font-size: 14px; margin-top: 3px; }
.trio-next { display: flex; align-items: center; gap: 13px; text-decoration: none; cursor: pointer; margin-top: 12px;
  background: #fffdf8; border: 3px solid var(--line, #221a2b); box-shadow: 6px 6px 0 var(--ink, #221a2b);
  padding: 13px; color: var(--ink, #221a2b); position: relative; overflow: hidden;
  transition: transform .07s, box-shadow .07s; }
.trio-next::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%);
  transform: translateX(-120%); animation: trio-shine 2.6s ease-in-out infinite; }
.trio-next.report { background: var(--yellow, #ffd044); }
.trio-next:hover { transform: translate(-2px,-2px); box-shadow: 8px 8px 0 var(--ink, #221a2b); }
.trio-next:active { transform: translate(4px,4px); box-shadow: none; }
.trio-next-icon { flex: none; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
  font-size: 30px; border: 3px solid var(--line, #221a2b); box-shadow: 3px 3px 0 var(--ink, #221a2b);
  animation: trio-bob 1.8s ease-in-out infinite; }
.trio-next-body { flex: 1; min-width: 0; }
.trio-next-label { display: block; font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--coral, #ff5f57); }
.trio-next.report .trio-next-label { color: var(--ink, #221a2b); }
.trio-next-name { display: block; font-size: 23px; line-height: 1.1; margin: 3px 0; }
.trio-next-teaser { display: block; font-size: 15px; color: var(--ink-soft, #5f5368); }
.trio-next-arrow { flex: none; font-family: var(--font-press), monospace; font-size: 16px; color: var(--coral, #ff5f57);
  animation: trio-slide 1s ease-in-out infinite; }
.trio-next.report .trio-next-arrow { color: var(--ink, #221a2b); }
@keyframes trio-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes trio-slide { 0%,100% { transform: translateX(0); } 50% { transform: translateX(5px); } }
@keyframes trio-shine { 0%,55% { transform: translateX(-120%); } 80%,100% { transform: translateX(120%); } }
.trio-claim { margin-top: 12px; border: 3px dashed var(--line, #221a2b); padding: 12px; background: #fff7e7; }
.trio-claim h4 { margin: 0 0 4px; font-family: var(--font-press), monospace; font-size: 12px; }
.trio-claim p { margin: 0 0 10px; font-size: 16px; color: var(--ink-soft, #5f5368); }
.trio-account { display: inline-block; font-family: var(--font-press), monospace; font-size: 11px; text-decoration: none;
  border: 3px solid var(--line, #221a2b); box-shadow: 3px 3px 0 var(--ink, #221a2b);
  background: var(--yellow, #ffd044); color: var(--ink, #221a2b); padding: 10px 12px; }
.trio-account:active { transform: translate(3px,3px); box-shadow: none; }
`;

export function TrioFooter({ game, lang, run }: { game: TrioGame; lang: Lang; run: RunPayload }) {
  const recorded = useRef(false);
  const [progress, setProgress] = useState<TrioProgress | null>(null);
  const u = UI[lang];

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    (async () => {
      await recordRun(game, run);
      setProgress(await getTrioProgress());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const langQ = `?lang=${lang}`;
  return (
    <section className="trio" aria-label="trio progress">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <p className="trio-label">{u.label} · {progress ? `${progress.done}/3` : u.saving}</p>
      <div className="trio-track">
        {TRIO_GAMES.map((g) => {
          const isDone = !!progress?.best[g];
          const isCur = g === game;
          return (
            <div key={g} className={`trio-seg ${isDone ? "done" : ""} ${isCur ? "cur" : ""}`}>
              <b>{GAME_SENSE[lang][g]}</b>
              <span>{GAME_NAME[lang][g]}</span>
            </div>
          );
        })}
      </div>

      {progress &&
        (progress.allDone ? (
          <a className="trio-next report" href={TRIO_REPORT_URL + langQ}>
            <span className="trio-next-icon" style={{ background: "var(--yellow, #ffd044)" }}>🏆</span>
            <span className="trio-next-body">
              <span className="trio-next-label">{u.reportEyebrow}</span>
              <b className="trio-next-name">{u.reportName}</b>
            </span>
            <span className="trio-next-arrow">▶▶</span>
          </a>
        ) : progress.nextGame ? (
          <a className="trio-next" href={GAME_URL[progress.nextGame] + langQ}>
            <span className="trio-next-icon" style={{ background: GAME_COLOR[progress.nextGame] }}>
              {GAME_EMOJI[progress.nextGame]}
            </span>
            <span className="trio-next-body">
              <span className="trio-next-label">
                {u.nextEyebrow} · {GAME_SENSE[lang][progress.nextGame]}
              </span>
              <b className="trio-next-name">{GAME_NAME[lang][progress.nextGame]}</b>
              <span className="trio-next-teaser">{GAME_TEASER[lang][progress.nextGame]}</span>
            </span>
            <span className="trio-next-arrow">▶▶</span>
          </a>
        ) : null)}

      {progress && progress.isAnonymous && progress.done >= 2 && (
        <div className="trio-claim">
          <h4>{u.claimTitle}</h4>
          <p>{u.claimHint}</p>
          <a className="trio-account" href={`https://dx3xb.com/me?lang=${lang}`}>{u.accountCta}</a>
        </div>
      )}
    </section>
  );
}
