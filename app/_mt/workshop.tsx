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
    share: "分享游戏",
    copied: "链接已复制",
    replay: "重玩",
    aiTitle: "AI Canvas 对话",
    aiSub: "用大白话描述你想要的效果",
    ph: "说清楚要改什么，比如：改成横版躲避游戏，玩家用方向键移动，碰到金币加分，画面用霓虹配色",
    send: "让 AI 修改",
    busy: "AI 生成中…",
    thinking: "AI 正在为你重画这个游戏…",
    hint: "⌘/Ctrl + Enter 发送",
    left: (n: number) => `剩余 ${n} 次修改`,
    maxed: "这个项目的 10 次 AI 修改已用完，可另建新项目继续创作。",
    you: "你",
    ai: "AI",
    emptyChat: "还没有对话。在下面描述你想要的游戏，AI 会直接改给你看。",
  },
  en: {
    empty: "This Canvas game is not ready yet.",
    preview: "Game Preview",
    share: "Share game",
    copied: "Link copied",
    replay: "Replay",
    aiTitle: "AI Canvas Dialog",
    aiSub: "Describe the result you want in plain words",
    ph: "Describe the change, e.g. make it a side-scroller where arrow keys move, coins add score, neon palette",
    send: "Ask AI",
    busy: "AI generating…",
    thinking: "AI is redrawing your game…",
    hint: "⌘/Ctrl + Enter to send",
    left: (n: number) => `${n} edits left`,
    maxed: "This project has used all 10 AI edits. Start a new project to keep creating.",
    you: "You",
    ai: "AI",
    emptyChat: "No conversation yet. Describe the game you want below and AI will build it live.",
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
  const [nonce, setNonce] = useState(0);
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
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!wsPublishable(cfg)) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  return (
    <div className="ws">
      <style dangerouslySetInnerHTML={{ __html: WS_STYLE }} />
      <div className="ws-stage play">
        <iframe key={nonce} ref={frameRef} className="ws-frame" title={title || "dx3xb canvas game"} sandbox="allow-scripts" srcDoc={srcDoc} />
      </div>
      {!preview && (
        <div className="ws-playbar">
          <button className="ws-btn" onClick={() => setNonce((n) => n + 1)}>↻ {t.replay}</button>
          <button className="ws-btn teal" onClick={share}>{copied ? t.copied : t.share}</button>
        </div>
      )}
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
  const [err, setErr] = useState("");
  const [nonce, setNonce] = useState(0);
  const srcDoc = useMemo(() => buildWorkshopSrcDoc(cfg), [cfg]);
  const left = Math.max(0, LIMIT - cfg.turnsUsed);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 新消息或生成态变化时自动滚到底
    const node = msgRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [cfg.messages.length, busy]);

  async function askAi() {
    if (!appId || !prompt.trim() || busy || left <= 0) return;
    setBusy(true);
    setErr("");
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
        setNonce((n) => n + 1);
      } else {
        setErr(lang === "zh" ? "这次没生成成功，换个说法再试一次。" : "Generation failed, try rephrasing.");
      }
    } catch {
      setErr(lang === "zh" ? "网络异常，请稍后重试。" : "Network error, please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ws-edit">
      <style dangerouslySetInnerHTML={{ __html: WS_STYLE }} />
      <div className="ws-canvas">
        <section className="ws-preview">
          <div className="ws-head">
            <b>▸ {t.preview}</b>
            <button className="ws-mini" onClick={() => setNonce((n) => n + 1)} title={t.replay}>↻</button>
          </div>
          <div className="ws-stage edit">
            <iframe key={nonce} className="ws-frame" title="workshop preview" sandbox="allow-scripts" srcDoc={srcDoc} />
          </div>
        </section>

        <section className="ws-chat">
          <div className="ws-chat-head">
            <h3>{t.aiTitle}</h3>
            <span>{t.aiSub}</span>
          </div>

          <div className="ws-messages" ref={msgRef}>
            {cfg.messages.length === 0 ? (
              <p className="ws-msg-empty">{t.emptyChat}</p>
            ) : (
              cfg.messages.map((m, i) => (
                <div key={i} className={`ws-msg ${m.role}`}>
                  <span className="ws-msg-who">{m.role === "user" ? t.you : t.ai}</span>
                  <p>{m.text}</p>
                </div>
              ))
            )}
            {busy && (
              <div className="ws-msg ai pending">
                <span className="ws-msg-who">{t.ai}</span>
                <p>{t.thinking}<i className="ws-dots"><b /><b /><b /></i></p>
              </div>
            )}
          </div>

          <div className="ws-compose">
            <textarea
              className="ws-input"
              rows={3}
              value={prompt}
              maxLength={600}
              disabled={left <= 0}
              placeholder={left > 0 ? t.ph : t.maxed}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void askAi();
                }
              }}
            />
            {err && <p className="ws-err">{err}</p>}
            <div className="ws-row">
              <span className={left <= 2 ? "ws-left low" : "ws-left"}>{t.left(left)} · {t.hint}</span>
              <button className="ebig teal" disabled={busy || !prompt.trim() || left <= 0} onClick={askAi}>
                {busy ? t.busy : t.send}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const WS_STYLE = `
.ws, .ws-edit { font-family: var(--font-vt323), monospace; display: grid; gap: 14px; }

/* —— 游戏画框：稳定高度 + iframe 绝对填充，任何游戏都完整显示、不裁切 —— */
.ws-stage { position: relative; width: 100%; overflow: hidden; border: 4px solid var(--ink); box-shadow: 8px 8px 0 var(--ink);
  background: repeating-conic-gradient(#0d1220 0% 25%, #121a2e 0% 50%) 50% / 22px 22px; }
.ws-stage.play { height: clamp(440px, 76vh, 760px); }
.ws-stage.edit { height: clamp(400px, 62vh, 640px); box-shadow: 4px 4px 0 var(--ink); }
.ws-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }

.ws-playbar { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.ws-btn { font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: 3px 3px 0 var(--ink); padding: 11px 15px; background: #fff; color: var(--ink); transition: transform .06s, box-shadow .06s; }
.ws-btn:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--ink); }
.ws-btn:active { transform: translate(3px,3px); box-shadow: none; }
.ws-btn.teal { background: var(--teal); color: #fff; }
.ws-mini { font-family: var(--font-vt323), monospace; font-size: 18px; line-height: 1; cursor: pointer; border: 2px solid var(--line);
  background: #fff; color: var(--ink); width: 30px; height: 30px; }
.ws-mini:hover { background: var(--cream); }

/* —— 编辑器双栏：预览 + 对话 —— */
.ws-canvas { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, .6fr); gap: 14px; align-items: stretch; }
.ws-preview { display: grid; grid-template-rows: auto 1fr; gap: 8px; min-width: 0; }
.ws-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.ws-head b { font-family: var(--font-press), monospace; font-size: 10px; }

/* —— 对话区：聊天式，输入锁定不可拉出界 —— */
.ws-chat { background: var(--cream); border: 3px solid var(--line); box-shadow: 4px 4px 0 var(--ink);
  display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.ws-chat-head { border-bottom: 3px solid var(--line); padding: 11px 13px; background: var(--ink); color: var(--cream); }
.ws-chat-head h3 { font-family: var(--font-press), monospace; font-size: 11px; margin: 0; }
.ws-chat-head span { font-size: 14px; color: rgba(255,253,248,.7); }
.ws-messages { flex: 1; min-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 9px; padding: 12px; }
.ws-msg-empty { margin: auto 0; color: var(--ink-soft); font-size: 16px; line-height: 1.5; text-align: center; }
.ws-msg { display: grid; gap: 3px; max-width: 88%; }
.ws-msg.user { justify-self: end; text-align: right; }
.ws-msg.ai { justify-self: start; }
.ws-msg-who { font-family: var(--font-press), monospace; font-size: 8px; color: var(--ink-soft); padding: 0 2px; }
.ws-msg p { margin: 0; padding: 9px 11px; border: 2px solid var(--line); font-size: 16px; line-height: 1.45; word-break: break-word; }
.ws-msg.user p { background: var(--teal); color: #fff; border-color: var(--ink); }
.ws-msg.ai p { background: #fff; color: var(--ink); }
.ws-msg.pending p { background: #fff7db; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; }
.ws-dots { display: inline-flex; gap: 3px; }
.ws-dots b { width: 5px; height: 5px; background: var(--ink-soft); display: inline-block; animation: wsblink 1s infinite; }
.ws-dots b:nth-child(2) { animation-delay: .2s; } .ws-dots b:nth-child(3) { animation-delay: .4s; }
@keyframes wsblink { 0%,60%,100% { opacity: .25; } 30% { opacity: 1; } }

.ws-compose { border-top: 3px solid var(--line); padding: 11px; display: grid; gap: 8px; background: var(--cream); }
.ws-input { font-family: var(--font-vt323), monospace; font-size: 17px; line-height: 1.4; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: inset 2px 2px 0 rgba(43,34,51,.08); padding: 9px 11px; width: 100%;
  box-sizing: border-box; resize: none; outline: none; }
.ws-input:focus { box-shadow: var(--shadow); }
.ws-input:disabled { background: #f3f0ea; color: var(--ink-soft); }
.ws-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.ws-left { font-family: var(--font-press), monospace; font-size: 8px; color: var(--ink-soft); }
.ws-left.low { color: var(--coral); }
.ws-err { margin: 0; font-size: 14px; color: var(--coral); }

@media (max-width: 820px) {
  .ws-canvas { grid-template-columns: 1fr; }
  .ws-stage.edit { height: clamp(360px, 56vh, 520px); }
  .ws-chat { height: clamp(420px, 60vh, 560px); }
}
@media (max-width: 480px) {
  .ws-stage.play { height: clamp(420px, 72vh, 600px); }
  .ws-msg { max-width: 94%; }
}
`;
