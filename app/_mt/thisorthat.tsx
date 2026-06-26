"use client";
// 模板：二选一 this-or-that —— 作者出一串 A vs B 并标自己的选择，玩家选完看“和作者多合拍”
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { clean, type Lang } from "./types";

export type TotPair = { a: string; b: string; mine: 0 | 1 };
export type TotConfig = { intro: string; pairs: TotPair[] };

export function totEmpty(): TotConfig {
  return { intro: "", pairs: [{ a: "", b: "", mine: 0 }, { a: "", b: "", mine: 0 }, { a: "", b: "", mine: 0 }] };
}
export function totValidate(input: unknown): TotConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const pairs = (Array.isArray(o.pairs) ? o.pairs.slice(0, 15) : []) as Record<string, unknown>[];
  return {
    intro: clean(o.intro, 200),
    pairs: pairs.map((p) => ({ a: clean(p?.a, 40), b: clean(p?.b, 40), mine: p?.mine === 1 ? 1 : 0 })),
  };
}
export function totPublishable(c: TotConfig): boolean {
  return c.pairs.length >= 3 && c.pairs.every((p) => p.a.trim() && p.b.trim());
}

const T = {
  zh: {
    start: "开始",
    of: (i: number, n: number) => `${i} / ${n}`,
    matched: "和作者合拍",
    yourPicks: "你的选择",
    replay: "再选一次",
    share: "分享结果",
    copy: "复制",
    copied: "已复制",
    download: "下载结果图",
    qrCta: "扫码看你和 ta 合不合",
    by: "二选一",
    made: "用 dx3xb 微应用工厂制作",
    shareText: (title: string, pct: number, url: string) => `我和「${title}」的作者 ${pct}% 合拍！来测测你和 ta 合不合：${url}`,
    empty: "这个二选一还没做完。",
  },
  en: {
    start: "START",
    of: (i: number, n: number) => `${i} / ${n}`,
    matched: "MATCH WITH CREATOR",
    yourPicks: "YOUR PICKS",
    replay: "REDO",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan to see if you two match",
    by: "THIS-OR-THAT",
    made: "Made with dx3xb micro-app studio",
    shareText: (title: string, pct: number, url: string) => `I'm a ${pct}% match with "${title}"! See if you match too: ${url}`,
    empty: "This this-or-that isn't finished yet.",
  },
} as const;

export function ThisOrThatPlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: TotConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const cfg = useMemo(() => totValidate(config), [config]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(0 | 1)[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const shareUrl = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";

  useEffect(() => {
    setPhase("intro");
    setIdx(0);
    setPicks([]);
  }, [config]);

  const matchPct = useMemo(() => {
    if (phase !== "result" || cfg.pairs.length === 0) return 0;
    let m = 0;
    cfg.pairs.forEach((p, i) => {
      if (picks[i] === p.mine) m += 1;
    });
    return Math.round((m / cfg.pairs.length) * 100);
  }, [phase, picks, cfg]);

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

  if (cfg.pairs.length === 0) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  function pick(side: 0 | 1) {
    const next = [...picks];
    next[idx] = side;
    setPicks(next);
    if (idx + 1 < cfg.pairs.length) setIdx(idx + 1);
    else setPhase("result");
  }

  async function share() {
    const text = t.shareText(title || "dx3xb", matchPct, shareUrl);
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
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb", matchPct, shareUrl));
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
      const url = await toPng(node, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const a = document.createElement("a");
      a.download = `dx3xb-tot-${slug || "result"}.png`;
      a.href = url;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tot">
      <style dangerouslySetInnerHTML={{ __html: TOT_STYLE }} />
      {phase === "intro" && (
        <div className="tot-card tot-intro">
          <h2 className="pixel tot-title">{title || "dx3xb"}</h2>
          {cfg.intro && <p className="tot-introtext">{cfg.intro}</p>}
          <button className="tot-btn coral" onClick={() => setPhase("play")}>{t.start}</button>
        </div>
      )}
      {phase === "play" && cfg.pairs[idx] && (
        <div className="tot-card">
          <p className="tot-step">{t.of(idx + 1, cfg.pairs.length)}</p>
          <div className="tot-vs">
            <button className="tot-side" onClick={() => pick(0)}>{cfg.pairs[idx].a || "A"}</button>
            <span className="tot-or">VS</span>
            <button className="tot-side b" onClick={() => pick(1)}>{cfg.pairs[idx].b || "B"}</button>
          </div>
        </div>
      )}
      {phase === "result" && (
        <div className="tot-result">
          <div className="tot-poster" ref={reportRef}>
            <div className="tot-phead">
              <span className="tot-pby">{t.by}</span>
              <span className="tot-pname">{title || "dx3xb"}</span>
            </div>
            <div className="tot-pbody">
              <p className="tot-yr">{t.matched}</p>
              <div className="tot-pct">{matchPct}<span>%</span></div>
              <div className="tot-picks">
                <p className="tot-pickhead">{t.yourPicks}</p>
                {cfg.pairs.map((p, i) => (
                  <div key={i} className={`tot-pickrow ${picks[i] === p.mine ? "same" : ""}`}>
                    <span className={picks[i] === 0 ? "on" : ""}>{p.a}</span>
                    <em>/</em>
                    <span className={picks[i] === 1 ? "on" : ""}>{p.b}</span>
                  </div>
                ))}
              </div>
              {!preview && slug && (
                <div className="tot-qr">
                  <div className="tot-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={80} height={80} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 80, height: 80 }} />
                    )}
                  </div>
                  <div>
                    <p className="tot-qrcta">{t.qrCta}</p>
                    <p className="tot-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="tot-made">{t.made}</p>
            </div>
          </div>
          <div className="tot-actions">
            {!preview && <button className="tot-btn coral" onClick={download}>{saving ? "…" : t.download}</button>}
            {!preview && <button className="tot-btn teal" onClick={share}>{t.share}</button>}
            {!preview && <button className="tot-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>}
            <button className="tot-btn ghost" onClick={() => { setIdx(0); setPicks([]); setPhase("play"); }}>{t.replay}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ThisOrThatEditor({ config, onChange, lang }: { config: TotConfig; onChange: (c: TotConfig) => void; lang: Lang }) {
  const c = config;
  const t =
    lang === "zh"
      ? { intro: "一句话介绍（可选）", pairs: "选项对（3–15 组）", a: "左边（如：咖啡）", b: "右边（如：奶茶）", mine: "我选这个", add: "+ 加一组", hint: "点「我选」标出你自己的选择，玩家会看到和你合拍多少" }
      : { intro: "One-line intro (optional)", pairs: "Pairs (3–15)", a: "Left (e.g. coffee)", b: "Right (e.g. tea)", mine: "my pick", add: "+ Add pair", hint: "Mark your own pick — players see how much they match you" };
  function setPair(i: number, p: Partial<TotPair>) {
    onChange({ ...c, pairs: c.pairs.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  }
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <h3 className="ehead">{t.pairs}</h3>
      <p className="ewarn" style={{ marginTop: 0 }}>{t.hint}</p>
      {c.pairs.map((p, i) => (
        <div key={i} className="ecard">
          <div className="erow">
            <input className="ein grow" placeholder={t.a} value={p.a} maxLength={40} onChange={(e) => setPair(i, { a: e.target.value })} />
            <button className={`echip ${p.mine === 0 ? "w2" : ""}`} onClick={() => setPair(i, { mine: 0 })} title={t.mine}>✓</button>
          </div>
          <div className="erow">
            <input className="ein grow" placeholder={t.b} value={p.b} maxLength={40} onChange={(e) => setPair(i, { b: e.target.value })} />
            <button className={`echip ${p.mine === 1 ? "w2" : ""}`} onClick={() => setPair(i, { mine: 1 })} title={t.mine}>✓</button>
          </div>
          {c.pairs.length > 3 && (
            <button className="eadd small" onClick={() => onChange({ ...c, pairs: c.pairs.filter((_, j) => j !== i) })}>✕</button>
          )}
        </div>
      ))}
      {c.pairs.length < 15 && (
        <button className="eadd" onClick={() => onChange({ ...c, pairs: [...c.pairs, { a: "", b: "", mine: 0 }] })}>{t.add}</button>
      )}
    </div>
  );
}

const TOT_STYLE = `
.tot { font-family: var(--font-vt323), monospace; }
.tot-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.tot-intro { text-align: center; }
.tot-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.tot-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.tot-step { font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft); margin: 0 0 14px; text-align: center; }
.tot-vs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; }
.tot-side { font-family: inherit; font-size: 22px; min-height: 110px; background: var(--cream); color: var(--ink); border: 3px solid var(--line);
  box-shadow: 4px 4px 0 var(--ink); cursor: pointer; padding: 12px; transition: transform .06s, box-shadow .06s, background .1s; }
.tot-side.b { background: #eaf6ff; }
.tot-side:hover { transform: translate(-1px,-1px); box-shadow: 6px 6px 0 var(--ink); }
.tot-side:active { transform: translate(3px,3px); box-shadow: none; }
.tot-or { font-family: var(--font-press), monospace; font-size: 12px; color: var(--coral); }
.tot-result { display: grid; gap: 16px; }
.tot-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.tot-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.tot-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--teal); color: #fff; padding: 4px 7px; }
.tot-pname { font-size: 18px; }
.tot-pbody { padding: 22px 20px; text-align: center; }
.tot-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0; }
.tot-pct { font-family: var(--font-press), monospace; font-size: clamp(40px, 16vw, 66px); line-height: 1; margin: 6px 0 12px; }
.tot-pct span { color: var(--coral); }
.tot-picks { text-align: left; }
.tot-pickhead { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink-soft); margin: 0 0 6px; }
.tot-pickrow { display: flex; align-items: center; gap: 8px; font-size: 17px; border-bottom: 2px dashed rgba(43,34,51,.16); padding: 5px 0; }
.tot-pickrow span { color: var(--ink-soft); }
.tot-pickrow span.on { color: var(--ink); font-weight: bold; }
.tot-pickrow em { color: var(--ink-soft); font-style: normal; }
.tot-pickrow.same { background: rgba(46,196,182,.12); }
.tot-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; margin-top: 14px; text-align: left; }
.tot-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.tot-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.tot-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.tot-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.tot-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.tot-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.tot-btn.teal { background: var(--teal); }
.tot-btn.ghost { background: #fff; color: var(--ink); }
.tot-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;
