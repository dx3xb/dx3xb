"use client";
// 模板：故事填词 Mad Libs —— 作者写带 {提示} 的故事，玩家乱填生成爆笑故事并分享
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { clean, type Lang } from "./types";

export type MlConfig = { intro: string; story: string };

export function mlEmpty(): MlConfig {
  return { intro: "", story: "" };
}
export function mlValidate(input: unknown): MlConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  return { intro: clean(o.intro, 200), story: clean(o.story, 800) };
}

type Part = { t: "text"; s: string } | { t: "blank"; prompt: string; i: number };
export function parseStory(story: string): { parts: Part[]; count: number } {
  const parts: Part[] = [];
  const re = /\{([^{}]{1,24})\}/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(story)) && i < 20) {
    if (m.index > last) parts.push({ t: "text", s: story.slice(last, m.index) });
    parts.push({ t: "blank", prompt: m[1], i });
    i += 1;
    last = m.index + m[0].length;
  }
  if (last < story.length) parts.push({ t: "text", s: story.slice(last) });
  return { parts, count: i };
}
export function mlPublishable(c: MlConfig): boolean {
  return parseStory(c.story).count >= 1 && c.story.trim().length >= 6;
}

const T = {
  zh: {
    start: "开始填空",
    fillHint: "凭直觉填空，越离谱越好笑",
    generate: "生成故事",
    yourStory: "你的故事",
    replay: "再填一次",
    share: "分享故事",
    copy: "复制",
    copied: "已复制",
    download: "下载故事图",
    qrCta: "扫码也来填一个",
    by: "故事填词",
    made: "用 dx3xb 微应用工厂制作",
    empty: "这个故事还没写填空。",
    shareText: (title: string, story: string, url: string) => `我用「${title}」填出了：${story}\n你也来填一个：${url}`,
  },
  en: {
    start: "FILL IN",
    fillHint: "Fill on instinct — the wilder the funnier",
    generate: "MAKE STORY",
    yourStory: "YOUR STORY",
    replay: "REFILL",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan to fill your own",
    by: "MAD LIBS",
    made: "Made with dx3xb micro-app studio",
    empty: "This story has no blanks yet.",
    shareText: (title: string, story: string, url: string) => `I filled in "${title}": ${story}\nMake your own: ${url}`,
  },
} as const;

export function MadLibsPlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: MlConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const cfg = useMemo(() => mlValidate(config), [config]);
  const parsed = useMemo(() => parseStory(cfg.story), [cfg.story]);
  const [phase, setPhase] = useState<"intro" | "fill" | "result">("intro");
  const [fills, setFills] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const shareUrl = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";

  useEffect(() => {
    setPhase("intro");
    setFills([]);
  }, [config]);

  const storyText = useMemo(
    () => parsed.parts.map((p) => (p.t === "text" ? p.s : fills[p.i] || `____`)).join(""),
    [parsed, fills],
  );

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

  if (parsed.count === 0) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  const blanks = parsed.parts.filter((p): p is Extract<Part, { t: "blank" }> => p.t === "blank");

  async function share() {
    const text = t.shareText(title || "dx3xb", storyText, shareUrl);
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
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb", storyText, shareUrl));
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
      a.download = `dx3xb-madlibs-${slug || "story"}.png`;
      a.href = u;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ml">
      <style dangerouslySetInnerHTML={{ __html: ML_STYLE }} />
      {phase === "intro" && (
        <div className="ml-card ml-intro">
          <h2 className="pixel ml-title">{title || "dx3xb"}</h2>
          {cfg.intro && <p className="ml-introtext">{cfg.intro}</p>}
          <button className="ml-btn coral" onClick={() => setPhase("fill")}>{t.start}</button>
        </div>
      )}
      {phase === "fill" && (
        <div className="ml-card">
          <p className="ml-fillhint">{t.fillHint}</p>
          <div className="ml-fields">
            {blanks.map((b) => (
              <div key={b.i} className="ml-field">
                <span className="ml-prompt">{b.prompt}</span>
                <input
                  className="ml-input"
                  value={fills[b.i] || ""}
                  maxLength={40}
                  placeholder={b.prompt}
                  onChange={(e) => setFills((f) => { const n = [...f]; n[b.i] = clean(e.target.value, 40); return n; })}
                />
              </div>
            ))}
          </div>
          <button className="ml-btn coral" onClick={() => setPhase("result")}>{t.generate}</button>
        </div>
      )}
      {phase === "result" && (
        <div className="ml-result">
          <div className="ml-poster" ref={reportRef}>
            <div className="ml-phead">
              <span className="ml-pby">{t.by}</span>
              <span className="ml-pname">{title || "dx3xb"}</span>
            </div>
            <div className="ml-pbody">
              <p className="ml-yr">{t.yourStory}</p>
              <p className="ml-story">
                {parsed.parts.map((p, k) =>
                  p.t === "text" ? <span key={k}>{p.s}</span> : <b key={k} className="ml-fill">{fills[p.i] || "____"}</b>,
                )}
              </p>
              {!preview && slug && (
                <div className="ml-qr">
                  <div className="ml-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={80} height={80} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 80, height: 80 }} />
                    )}
                  </div>
                  <div>
                    <p className="ml-qrcta">{t.qrCta}</p>
                    <p className="ml-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="ml-made">{t.made}</p>
            </div>
          </div>
          <div className="ml-actions">
            {!preview && <button className="ml-btn coral" onClick={download}>{saving ? "…" : t.download}</button>}
            {!preview && <button className="ml-btn teal" onClick={share}>{t.share}</button>}
            {!preview && <button className="ml-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>}
            <button className="ml-btn ghost" onClick={() => { setFills([]); setPhase("fill"); }}>{t.replay}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MadLibsEditor({ config, onChange, lang }: { config: MlConfig; onChange: (c: MlConfig) => void; lang: Lang }) {
  const c = config;
  const count = useMemo(() => parseStory(c.story).count, [c.story]);
  const t =
    lang === "zh"
      ? { intro: "一句话介绍（可选）", story: "故事正文", ph: "用 {提示} 插入填空，例：\n今天我在{地点}遇到一只{形容词}的{动物}，它说「{一句话}」。", hint: (n: number) => `检测到 ${n} 个填空（用大括号 {提示} 标记，最多 20 个）` }
      : { intro: "Intro (optional)", story: "Story", ph: "Use {prompt} for blanks, e.g.\nToday at the {place} I met a {adjective} {animal} who said \"{quote}\".", hint: (n: number) => `${n} blanks detected (mark with {prompt}, up to 20)` };
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <h3 className="ehead">{t.story}</h3>
      <textarea className="ein" rows={7} placeholder={t.ph} value={c.story} maxLength={800} onChange={(e) => onChange({ ...c, story: e.target.value })} style={{ resize: "vertical", lineHeight: 1.5 }} />
      <p className="ewarn" style={{ marginTop: 0 }}>{t.hint(count)}</p>
    </div>
  );
}

const ML_STYLE = `
.ml { font-family: var(--font-vt323), monospace; }
.ml-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.ml-intro { text-align: center; }
.ml-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.ml-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.ml-fillhint { font-size: 17px; color: var(--ink-soft); margin: 0 0 14px; }
.ml-fields { display: grid; gap: 10px; margin-bottom: 16px; }
.ml-field { display: grid; gap: 4px; }
.ml-prompt { font-family: var(--font-press), monospace; font-size: 10px; color: var(--coral); }
.ml-input { font-family: inherit; font-size: 20px; background: var(--cream); color: var(--ink); border: 3px solid var(--line);
  box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 10px 12px; outline: none; }
.ml-input:focus { box-shadow: var(--shadow); background: #fff; }
.ml-result { display: grid; gap: 16px; }
.ml-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.ml-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.ml-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--yellow); color: var(--ink); padding: 4px 7px; }
.ml-pname { font-size: 18px; }
.ml-pbody { padding: 22px 20px; }
.ml-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 10px; }
.ml-story { font-size: 22px; line-height: 1.6; margin: 0; }
.ml-fill { color: var(--coral); border-bottom: 3px solid var(--coral); font-weight: bold; }
.ml-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; margin-top: 16px; }
.ml-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.ml-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.ml-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.ml-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.ml-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ml-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.ml-btn.teal { background: var(--teal); }
.ml-btn.ghost { background: #fff; color: var(--ink); }
.ml-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;
