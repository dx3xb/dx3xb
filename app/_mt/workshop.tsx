"use client";
// AI 游戏工坊：用户只看效果并用自然语言修改；代码只在 sandbox iframe 内运行，不在主站上下文展示或执行。
import { useEffect, useMemo, useRef, useState } from "react";
import { dx3xb } from "../dx3xb-trio";
import { buildWorkshopSrcDoc, wsPublishable, wsValidate, type WorkshopConfig } from "./workshop-spec";
import type { Lang, PlayerEvents } from "./types";

const LIMIT = 10;
const T = {
  zh: {
    empty: "这个 Canvas 游戏还没生成好。",
    preview: "游戏效果",
    share: "分享",
    copied: "已复制",
    aiTitle: "AI Canvas 对话",
    ph: "说清楚要改什么，比如：改成横版躲避游戏，玩家用方向键移动，碰到金币加分",
    send: "让 AI 修改",
    busy: "生成中…",
    left: (n: number) => `剩余 ${n} 次`,
    maxed: "这个项目的 10 次 AI 交互已用完。",
  },
  en: {
    empty: "This Canvas game is not ready yet.",
    preview: "Game Preview",
    share: "Share",
    copied: "Copied",
    aiTitle: "AI Canvas Dialog",
    ph: "Describe the change, e.g. make it a side-scroller where arrow keys move and coins add score",
    send: "Ask AI",
    busy: "Generating…",
    left: (n: number) => `${n} turns left`,
    maxed: "This project has used its 10 AI turns.",
  },
} as const;

export { wsEmpty, wsPublishable, wsValidate } from "./workshop-spec";
export type { WorkshopConfig } from "./workshop-spec";

export function WorkshopPlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
  onStart,
  onComplete,
  onShare,
}: {
  config: WorkshopConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
} & PlayerEvents) {
  const t = T[lang];
  const cfg = useMemo(() => wsValidate(config), [config]);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => buildWorkshopSrcDoc(cfg), [cfg]);

  useEffect(() => {
    onStart?.();
  }, [onStart]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      if ((event.data as { type?: string })?.type === "dx3xb-workshop-complete") {
        onComplete?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onComplete]);

  async function share() {
    if (preview) return;
    try {
      onShare?.();
      await navigator.clipboard.writeText(`${title || "dx3xb AI game"}\n${slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com"}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!wsPublishable(cfg)) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  return (
    <div className="ws">
      <style dangerouslySetInnerHTML={{ __html: WS_STYLE }} />
      <iframe ref={frameRef} className="ws-frame play" title={title || "dx3xb canvas game"} sandbox="allow-scripts" srcDoc={srcDoc} />
      {!preview && <button className="ws-btn teal share" onClick={share}>{copied ? t.copied : t.share}</button>}
    </div>
  );
}

export function WorkshopEditor({
  config,
  onChange,
  lang,
  appId,
  title,
  onTitleChange,
}: {
  config: WorkshopConfig;
  onChange: (c: WorkshopConfig) => void;
  lang: Lang;
  appId?: string;
  title?: string;
  onTitleChange?: (title: string) => void;
}) {
  const t = T[lang];
  const cfg = wsValidate(config);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const srcDoc = useMemo(() => buildWorkshopSrcDoc(cfg), [cfg]);
  const left = Math.max(0, LIMIT - cfg.turnsUsed);

  async function askAi() {
    if (!appId || !prompt.trim() || busy || left <= 0) return;
    setBusy(true);
    try {
      const { data } = await dx3xb().auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch(`/api/microapps/${encodeURIComponent(appId)}/workshop`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt, lang, title }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.config) {
        onChange(wsValidate(body.config));
        if (body.title) onTitleChange?.(String(body.title).slice(0, 60));
        setPrompt("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ws-edit">
      <style dangerouslySetInnerHTML={{ __html: WS_STYLE }} />
      <div className="ws-canvas">
        <div className="ws-preview">
          <div className="ws-head"><b>{t.preview}</b></div>
          <iframe className="ws-frame edit" title="workshop preview" sandbox="allow-scripts" srcDoc={srcDoc} />
        </div>
        <div className="ws-chat">
          <h3 className="ehead">{t.aiTitle}</h3>
          <div className="ws-messages">
            {cfg.messages.map((m, i) => <p key={i} className={m.role}>{m.text}</p>)}
            {cfg.messages.length === 0 && <p className="ai">{cfg.intro}</p>}
          </div>
          <textarea className="ein" rows={3} value={prompt} maxLength={600} placeholder={left > 0 ? t.ph : t.maxed} onChange={(e) => setPrompt(e.target.value)} />
          <div className="ws-row">
            <span>{t.left(left)}</span>
            <button className="ebig teal" disabled={busy || !prompt.trim() || left <= 0} onClick={askAi}>{busy ? t.busy : t.send}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const WS_STYLE = `
.ws, .ws-edit { font-family: var(--font-vt323), monospace; display: grid; gap: 12px; }
.ws-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.ws-head b { font-family: var(--font-press), monospace; font-size: 10px; }
.ws-head div, .ws-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.ws-frame { width: 100%; height: min(78vh, 700px); border: 4px solid var(--line); box-shadow: 8px 8px 0 var(--ink); background: #fff; }
.ws-frame.play { min-height: 520px; }
.ws-frame.edit { height: min(64vh, 620px); min-height: 430px; box-shadow: 4px 4px 0 var(--ink); }
.ws-btn { font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 11px; background: #fff; color: var(--ink); }
.ws-btn.teal { background: var(--teal); color: #fff; }
.ws-btn.share { justify-self: center; }
.ws-canvas { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(250px, .65fr); gap: 12px; align-items: stretch; }
.ws-preview { display: grid; gap: 8px; min-width: 0; }
.ws-chat { background: var(--cream); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px; display: grid; gap: 8px; align-content: start; }
.ws-messages { max-height: 210px; overflow: auto; display: grid; gap: 7px; }
.ws-messages p { margin: 0; padding: 8px; border: 2px solid var(--line); background: #fff; font-size: 16px; }
.ws-messages .user { background: #e9fbf8; }
.ws-messages .ai { background: #fff7db; }
.ws-row { justify-content: space-between; }
.ws-row span { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink-soft); }
@media (max-width: 760px) {
  .ws-canvas { grid-template-columns: 1fr; }
  .ws-frame, .ws-frame.edit { height: 520px; min-height: 520px; }
  .ws-frame.play { min-height: 560px; }
}
`;
