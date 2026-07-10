"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang } from "./types";
import { type MicroMeta } from "./micro-meta";

const T = {
  zh: { time: "剩余", timeup: "时间到", again: "再来一次", lives: "生命" },
  en: { time: "TIME", timeup: "TIME UP", again: "TRY AGAIN", lives: "LIVES" },
} as const;

export function MicroThemeShell({
  meta,
  title,
  templateLabel,
  lang,
  onTimeUp,
  stopped = false,
  started = false,
  byline,
  children,
}: {
  meta: MicroMeta;
  title: string;
  templateLabel: string;
  lang: Lang;
  onTimeUp?: () => void;
  /** 游戏已完成/已提交：停止倒计时并不再弹「时间到」层 */
  stopped?: boolean;
  /** 玩家点了「开始」才起跑倒计时；未开始时徽章显示完整限时 */
  started?: boolean;
  byline?: ReactNode;
  children: ReactNode;
}) {
  const t = T[lang];
  const limit = meta.advanced.timeLimitSec;
  const [left, setLeft] = useState(limit);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (stopped) return; // 提交即停表：完成后不再计时，剩余秒数保持冻结
    setLeft(limit);
    setExpired(false);
    if (!limit || !started) return; // 未点「开始」不起跑，徽章静止显示完整限时
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setExpired(true);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [limit, onTimeUp, stopped, started]);

  const style = useMemo(
    () =>
      ({
        "--micro-accent": meta.accent,
      }) as React.CSSProperties,
    [meta.accent],
  );

  return (
    <section className={`mshell theme-${meta.theme} font-${meta.font} card-${meta.card} ${meta.advanced.showProgress ? "" : "hide-progress"}`} style={style}>
      <style dangerouslySetInnerHTML={{ __html: SHELL_STYLE }} />
      <div className="mcover" aria-label={title || templateLabel}>
        <div className="memoji">{meta.coverEmoji}</div>
        <div className="mcoverText">
          <span>{templateLabel}</span>
          <h1>{title || "dx3xb"}</h1>
          {byline && <div className="mcoverByline">{byline}</div>}
        </div>
      </div>
      {(limit > 0 || meta.advanced.lives > 1) && (
        <div className="mstats">
          {limit > 0 && <span>{t.time} {left}s</span>}
          {meta.advanced.lives > 1 && <span>{t.lives} {meta.advanced.lives}</span>}
        </div>
      )}
      <div className="mbody">{children}</div>
      {expired && !stopped && (
        <div className="mtimeout" role="status">
          <b>{t.timeup}</b>
          <button onClick={() => window.location.reload()}>{t.again}</button>
        </div>
      )}
    </section>
  );
}

export function MicroReviewCard({
  meta,
  title,
  template,
  summary,
}: {
  meta: MicroMeta;
  title: string;
  template: string;
  summary: string;
}) {
  return (
    <div className={`mreview theme-${meta.theme}`} style={{ "--micro-accent": meta.accent } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: SHELL_STYLE }} />
      <div className="mrEmoji">{meta.coverEmoji}</div>
      <div>
        <span>{template}</span>
        <b>{title || "(无标题)"}</b>
        <p>{summary}</p>
      </div>
    </div>
  );
}

const SHELL_STYLE = `
.mshell { position: relative; display: grid; gap: 12px; font-family: var(--font-vt323), monospace; }
.mcover { min-height: 108px; display: flex; align-items: center; gap: 14px; border: 3px solid var(--line); box-shadow: 5px 5px 0 var(--ink); padding: 14px; background: #fff; overflow: hidden; }
.memoji { width: 72px; height: 72px; display: grid; place-items: center; border: 3px solid var(--line); background: var(--micro-accent); font-size: 38px; flex: none; }
.mcoverText { min-width: 0; }
.mcoverText span { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink-soft); text-transform: uppercase; }
.mcoverText h1 { margin: 5px 0 0; font-size: 28px; line-height: 1.05; word-break: break-word; }
.mcoverByline { margin-top: 9px; display: flex; }
.mcoverByline .creator-link { border: 0; padding: 0; background: transparent; }
.mcoverByline a.creator-link:hover { background: transparent; transform: translateX(1px); }
.mstats { display: flex; flex-wrap: wrap; gap: 8px; }
.mstats span { font-family: var(--font-press), monospace; font-size: 9px; border: 3px solid var(--line); background: #fff; padding: 7px 9px; box-shadow: 3px 3px 0 var(--ink); }
.mbody { min-width: 0; }
.hide-progress .qp-step, .hide-progress .qp-bar, .hide-progress .km-step, .hide-progress .km-bar, .hide-progress .tot-step, .hide-progress .rd-top { display: none; }
.theme-candy .mcover { background: #fff7fb; }
.theme-candy .memoji { background: #ff8fb8; }
.theme-noir .mcover { background: #111827; color: #fffdf8; }
.theme-noir .mcoverText span { color: #d1d5db; }
.theme-noir .memoji { border-color: #fffdf8; }
.theme-paper .mcover { background: #fffdf8; box-shadow: 0 0 0 3px rgba(43,34,51,.08), 5px 5px 0 var(--ink); }
.font-soft { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.card-ticket .mcover { border-style: dashed; }
.card-shadow .mcover { box-shadow: 8px 8px 0 var(--micro-accent); }
.mtimeout { position: absolute; inset: 126px 0 auto; z-index: 5; border: 4px solid var(--line); box-shadow: 7px 7px 0 var(--ink); background: #fff; padding: 18px; display: grid; justify-items: center; gap: 12px; }
.mtimeout b { font-family: var(--font-press), monospace; font-size: 18px; }
.mtimeout button { font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); background: var(--micro-accent); color: #fff; padding: 10px 12px; }
.mreview { display: flex; gap: 10px; align-items: center; border: 3px solid var(--line); background: #fff; box-shadow: 3px 3px 0 var(--ink); padding: 10px; }
.mreview.theme-noir { background: #111827; color: #fffdf8; }
.mrEmoji { width: 54px; height: 54px; flex: none; display: grid; place-items: center; border: 3px solid var(--line); background: var(--micro-accent); font-size: 30px; }
.mreview span { display: block; font-family: var(--font-press), monospace; font-size: 8px; color: var(--ink-soft); }
.mreview.theme-noir span { color: #d1d5db; }
.mreview b { display: block; font-size: 18px; line-height: 1.1; }
.mreview p { margin: 3px 0 0; font-size: 13px; color: var(--ink-soft); }
.mreview.theme-noir p { color: #d1d5db; }
@media (max-width: 430px) {
  .mcover { min-height: 96px; gap: 10px; padding: 12px; }
  .memoji { width: 58px; height: 58px; font-size: 31px; }
  .mcoverText h1 { font-size: 23px; }
}
`;
