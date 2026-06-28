"use client";
// 模板：解谜闯关 Riddle Escape —— 作者出一串谜题+答案，玩家逐关解锁通关，比用时
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { clean, type Lang } from "./types";

export type Riddle = { q: string; answer: string; hint: string };
export type RdConfig = { intro: string; riddles: Riddle[] };

export function rdEmpty(): RdConfig {
  return { intro: "", riddles: [{ q: "", answer: "", hint: "" }, { q: "", answer: "", hint: "" }] };
}
export function rdValidate(input: unknown): RdConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const rs = (Array.isArray(o.riddles) ? o.riddles.slice(0, 12) : []) as Record<string, unknown>[];
  return {
    intro: clean(o.intro, 200),
    riddles: rs.map((r) => ({ q: clean(r?.q, 200), answer: clean(r?.answer, 60), hint: clean(r?.hint, 80) })),
  };
}
export function rdPublishable(c: RdConfig): boolean {
  return c.riddles.length >= 2 && c.riddles.every((r) => r.q.trim() && r.answer.trim());
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
function matches(answer: string, guess: string) {
  const opts = answer.split("|").map(norm).filter(Boolean);
  const g = norm(guess);
  return g.length > 0 && opts.includes(g);
}

const T = {
  zh: {
    start: "进入密室",
    of: (i: number, n: number) => `第 ${i} / ${n} 关`,
    ph: "输入答案",
    submit: "解锁",
    wrong: "不对，再想想…",
    showHint: "提示",
    escaped: "你逃出来了！",
    time: "用时",
    replay: "再来一次",
    share: "分享战绩",
    copy: "复制",
    copied: "已复制",
    download: "下载结果图",
    qrCta: "扫码挑战这间密室",
    by: "解谜闯关",
    made: "用 dx3xb 微应用工厂制作",
    empty: "这个密室还没出题。",
    shareText: (title: string, secs: string, url: string) => `我用 ${secs} 逃出了「${title}」！你能更快吗：${url}`,
  },
  en: {
    start: "ENTER",
    of: (i: number, n: number) => `Room ${i} / ${n}`,
    ph: "Type your answer",
    submit: "UNLOCK",
    wrong: "Nope, try again…",
    showHint: "Hint",
    escaped: "YOU ESCAPED!",
    time: "TIME",
    replay: "PLAY AGAIN",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan to escape this room",
    by: "RIDDLE ESCAPE",
    made: "Made with dx3xb micro-app studio",
    empty: "This room has no riddles yet.",
    shareText: (title: string, secs: string, url: string) => `I escaped "${title}" in ${secs}! Can you go faster? ${url}`,
  },
} as const;

export function RiddleEscapePlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: RdConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const cfg = useMemo(() => rdValidate(config), [config]);
  const riddles = useMemo(() => cfg.riddles.filter((r) => r.q.trim() && r.answer.trim()), [cfg]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const shareUrl = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";

  useEffect(() => {
    setPhase("intro");
    setIdx(0);
    setGuess("");
  }, [config]);

  useEffect(() => {
    if (phase !== "play") return;
    const id = window.setInterval(() => setElapsed((Date.now() - startAt) / 1000), 100);
    return () => window.clearInterval(id);
  }, [phase, startAt]);

  const secsStr = `${elapsed.toFixed(1)}s`;

  useEffect(() => {
    if (phase !== "result" || preview || !slug) {
      setQr("");
      return;
    }
    let on = true;
    QRCode.toDataURL(shareUrl, { margin: 1, width: 300, color: { dark: "#2b2233", light: "#fffdf8" } })
      .then((d) => on && setQr(d))
      .catch(() => on && setQr(""));
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, preview, slug]);

  if (riddles.length < 1) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  function begin() {
    setIdx(0);
    setGuess("");
    setWrong(false);
    setShowHint(false);
    setStartAt(Date.now());
    setElapsed(0);
    setPhase("play");
  }
  function submit() {
    if (matches(riddles[idx].answer, guess)) {
      setGuess("");
      setWrong(false);
      setShowHint(false);
      if (idx + 1 < riddles.length) setIdx(idx + 1);
      else {
        setElapsed((Date.now() - startAt) / 1000);
        setPhase("result");
      }
    } else {
      setWrong(true);
    }
  }

  async function share() {
    const text = t.shareText(title || "dx3xb", secsStr, shareUrl);
    try {
      if (navigator.share) await navigator.share({ title: title || "dx3xb", text, url: shareUrl });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* cancelled */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb", secsStr, shareUrl));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  async function download() {
    const node = reportRef.current;
    if (!node || saving) return;
    setSaving(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const u = await toPng(node, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const a = document.createElement("a");
      a.download = `dx3xb-escape-${slug || "result"}.png`;
      a.href = u;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rd">
      <style dangerouslySetInnerHTML={{ __html: RD_STYLE }} />
      {phase === "intro" && (
        <div className="rd-card rd-intro">
          <h2 className="pixel rd-title">{title || "dx3xb"}</h2>
          {cfg.intro && <p className="rd-introtext">{cfg.intro}</p>}
          <button className="rd-btn coral" onClick={begin}>{t.start}</button>
        </div>
      )}
      {phase === "play" && riddles[idx] && (
        <div className="rd-card">
          <div className="rd-top">
            <span className="rd-room">{t.of(idx + 1, riddles.length)}</span>
            <span className="rd-timer">{secsStr}</span>
          </div>
          <h3 className="rd-q">{riddles[idx].q}</h3>
          <input
            className={`rd-input ${wrong ? "wrong" : ""}`}
            value={guess}
            maxLength={60}
            placeholder={t.ph}
            onChange={(e) => { setGuess(e.target.value); setWrong(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          {wrong && <p className="rd-wrong">{t.wrong}</p>}
          <div className="rd-row">
            <button className="rd-btn coral" onClick={submit}>{t.submit}</button>
            {riddles[idx].hint && !showHint && <button className="rd-btn ghost" onClick={() => setShowHint(true)}>{t.showHint}</button>}
          </div>
          {showHint && riddles[idx].hint && <p className="rd-hint">💡 {riddles[idx].hint}</p>}
        </div>
      )}
      {phase === "result" && (
        <div className="rd-result">
          <div className="rd-poster" ref={reportRef}>
            <div className="rd-phead">
              <span className="rd-pby">{t.by}</span>
              <span className="rd-pname">{title || "dx3xb"}</span>
            </div>
            <div className="rd-pbody">
              <div className="rd-emoji">🔓</div>
              <h2 className="pixel rd-esc">{t.escaped}</h2>
              <p className="rd-yr">{t.time}</p>
              <div className="rd-big">{secsStr}</div>
              {!preview && slug && (
                <div className="rd-qr">
                  <div className="rd-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={80} height={80} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 80, height: 80 }} />
                    )}
                  </div>
                  <div>
                    <p className="rd-qrcta">{t.qrCta}</p>
                    <p className="rd-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="rd-made">{t.made}</p>
            </div>
          </div>
          <div className="rd-actions">
            {!preview && <button className="rd-btn coral" onClick={download}>{saving ? "…" : t.download}</button>}
            {!preview && <button className="rd-btn teal" onClick={share}>{t.share}</button>}
            {!preview && <button className="rd-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>}
            <button className="rd-btn ghost" onClick={begin}>{t.replay}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiddleEscapeEditor({ config, onChange, lang }: { config: RdConfig; onChange: (c: RdConfig) => void; lang: Lang }) {
  const c = config;
  const t =
    lang === "zh"
      ? { intro: "一句话介绍（如：能逃出我的脑洞吗）", riddles: "谜题（按顺序，≥2 关）", q: "谜面（如：什么东西越洗越脏？）", ans: "答案（多个用 | 分隔，如：水|水呀）", hint: "提示（可选）", add: "+ 加一关", note: "答案不区分大小写、忽略空格；多个正确答案用 | 分隔" }
      : { intro: "Intro (e.g. Can you escape my brain?)", riddles: "Riddles (in order, ≥2)", q: "Riddle (e.g. What gets dirtier as it cleans?)", ans: "Answer (separate alternatives with |)", hint: "Hint (optional)", add: "+ Add room", note: "Answers are case/space-insensitive; separate alternatives with |" };
  const setR = (i: number, p: Partial<Riddle>) => onChange({ ...c, riddles: c.riddles.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <h3 className="ehead">{t.riddles}</h3>
      <p className="ewarn" style={{ marginTop: 0 }}>{t.note}</p>
      {c.riddles.map((r, i) => (
        <div key={i} className="ecard">
          <div className="erow">
            <input className="ein grow" placeholder={`${i + 1}. ${t.q}`} value={r.q} maxLength={200} onChange={(e) => setR(i, { q: e.target.value })} />
            <button className="ex" onClick={() => onChange({ ...c, riddles: c.riddles.filter((_, j) => j !== i) })} disabled={c.riddles.length <= 1}>✕</button>
          </div>
          <input className="ein" placeholder={t.ans} value={r.answer} maxLength={60} onChange={(e) => setR(i, { answer: e.target.value })} />
          <input className="ein" placeholder={t.hint} value={r.hint} maxLength={80} onChange={(e) => setR(i, { hint: e.target.value })} />
        </div>
      ))}
      {c.riddles.length < 12 && <button className="eadd" onClick={() => onChange({ ...c, riddles: [...c.riddles, { q: "", answer: "", hint: "" }] })}>{t.add}</button>}
    </div>
  );
}

const RD_STYLE = `
.rd { font-family: var(--font-vt323), monospace; }
.rd-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.rd-intro { text-align: center; }
.rd-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.rd-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.rd-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.rd-room { font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft); }
.rd-timer { font-family: var(--font-press), monospace; font-size: 14px; color: var(--coral); }
.rd-q { font-size: 23px; margin: 0 0 16px; line-height: 1.35; }
.rd-input { width: 100%; font-family: inherit; font-size: 21px; background: var(--cream); color: var(--ink); border: 3px solid var(--line);
  box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 12px 14px; outline: none; }
.rd-input:focus { box-shadow: var(--shadow); background: #fff; }
.rd-input.wrong { border-color: var(--coral); background: #ffeaea; }
.rd-wrong { color: var(--coral); font-size: 16px; margin: 8px 0 0; }
.rd-row { display: flex; gap: 10px; margin-top: 14px; }
.rd-hint { font-size: 17px; color: var(--ink-soft); margin: 12px 0 0; background: var(--cream); border: 3px dashed var(--line); padding: 10px 12px; }
.rd-result { display: grid; gap: 16px; }
.rd-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.rd-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.rd-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--blue, #4d79ff); color: #fff; padding: 4px 7px; }
.rd-pname { font-size: 18px; }
.rd-pbody { padding: 22px 20px; text-align: center; }
.rd-emoji { font-size: 56px; line-height: 1; }
.rd-esc { font-size: clamp(22px, 7vw, 36px); color: var(--teal); margin: 6px 0 10px; }
.rd-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0; }
.rd-big { font-family: var(--font-press), monospace; font-size: clamp(40px, 17vw, 70px); line-height: 1; color: var(--coral); margin: 6px 0 14px; }
.rd-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; text-align: left; }
.rd-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.rd-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.rd-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.rd-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.rd-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.rd-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.rd-btn.teal { background: var(--teal); }
.rd-btn.ghost { background: #fff; color: var(--ink); }
.rd-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;
