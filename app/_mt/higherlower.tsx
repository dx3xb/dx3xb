"use client";
// 模板：猜价闯关 Higher-Lower —— 作者给一组“东西+数值”，玩家猜下一个更高/更低，连对冲连胜
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { clean, type Lang } from "./types";

export type HlItem = { label: string; value: number };
export type HlConfig = { intro: string; unit: string; items: HlItem[] };

export function hlEmpty(lang: Lang = "zh"): HlConfig {
  if (lang === "en")
    return {
      intro: "Guess which costs more (sample — edit it)",
      unit: "$",
      items: [
        { label: "A bubble tea", value: 5 },
        { label: "A movie ticket", value: 14 },
        { label: "A pair of sneakers", value: 90 },
        { label: "A phone", value: 799 },
        { label: "A laptop", value: 1299 },
      ],
    };
  return {
    intro: "猜猜哪个更贵（这是示例，改成你自己的）",
    unit: "元",
    items: [
      { label: "一杯奶茶", value: 18 },
      { label: "一张电影票", value: 45 },
      { label: "一双球鞋", value: 599 },
      { label: "一部手机", value: 4999 },
      { label: "一台笔记本", value: 8999 },
    ],
  };
}
export function hlValidate(input: unknown): HlConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const items = (Array.isArray(o.items) ? o.items.slice(0, 30) : []) as Record<string, unknown>[];
  return {
    intro: clean(o.intro, 200),
    unit: clean(o.unit, 12),
    items: items.map((it) => ({ label: clean(it?.label, 40), value: Number.isFinite(Number(it?.value)) ? Number(it?.value) : 0 })),
  };
}
export function hlPublishable(c: HlConfig): boolean {
  return c.items.filter((i) => i.label.trim()).length >= 4;
}

const T = {
  zh: {
    start: "开始挑战",
    higher: "更高 ▲",
    lower: "更低 ▼",
    vs: "比",
    streak: "连胜",
    cur: "已知",
    next: "猜它",
    result: "你连对了",
    items2: "至少要 4 个有效条目。",
    replay: "再来一次",
    share: "分享战绩",
    copy: "复制",
    copied: "已复制",
    download: "下载结果图",
    qrCta: "扫码挑战这个连胜",
    by: "猜价闯关",
    made: "用 dx3xb 微应用工厂制作",
    correct: "答对！",
    wrong: "答错了",
    shareText: (title: string, n: number, url: string) => `我在「${title}」连对了 ${n} 个！你能超过我吗：${url}`,
  },
  en: {
    start: "START",
    higher: "HIGHER ▲",
    lower: "LOWER ▼",
    vs: "vs",
    streak: "STREAK",
    cur: "KNOWN",
    next: "GUESS",
    result: "YOUR STREAK",
    items2: "Needs at least 4 valid items.",
    replay: "PLAY AGAIN",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan to beat this streak",
    by: "HIGHER-LOWER",
    made: "Made with dx3xb micro-app studio",
    correct: "CORRECT!",
    wrong: "WRONG",
    shareText: (title: string, n: number, url: string) => `I hit a ${n} streak on "${title}"! Can you beat it? ${url}`,
  },
} as const;

function randExcept(n: number, except: number) {
  if (n <= 1) return 0;
  let i = except;
  while (i === except) i = Math.floor(Math.random() * n);
  return i;
}

export function HigherLowerPlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: HlConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const cfg = useMemo(() => hlValidate(config), [config]);
  const items = useMemo(() => cfg.items.filter((i) => i.label.trim()), [cfg]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [curIdx, setCurIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  const [streak, setStreak] = useState(0);
  const [reveal, setReveal] = useState<null | boolean>(null); // null=未翻, true/false=对错
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const shareUrl = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";

  useEffect(() => {
    setPhase("intro");
    setStreak(0);
    setReveal(null);
  }, [config]);

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

  function begin() {
    const a = Math.floor(Math.random() * items.length);
    setCurIdx(a);
    setNextIdx(randExcept(items.length, a));
    setStreak(0);
    setReveal(null);
    lock.current = false;
    setPhase("play");
  }
  function guess(higher: boolean) {
    if (lock.current || reveal !== null) return;
    lock.current = true;
    const cur = items[curIdx].value;
    const nxt = items[nextIdx].value;
    const ok = nxt === cur ? true : higher ? nxt > cur : nxt < cur;
    setReveal(ok);
    window.setTimeout(() => {
      if (ok) {
        setStreak((s) => s + 1);
        setCurIdx(nextIdx);
        setNextIdx(randExcept(items.length, nextIdx));
        setReveal(null);
        lock.current = false;
      } else {
        setPhase("result");
      }
    }, 950);
  }

  async function share() {
    const text = t.shareText(title || "dx3xb", streak, shareUrl);
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
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb", streak, shareUrl));
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
      a.download = `dx3xb-hl-${slug || "result"}.png`;
      a.href = u;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  if (items.length < 2) return <p style={{ color: "var(--ink-soft)" }}>{t.items2}</p>;

  return (
    <div className="hl">
      <style dangerouslySetInnerHTML={{ __html: HL_STYLE }} />
      {phase === "intro" && (
        <div className="hl-card hl-intro">
          <h2 className="pixel hl-title">{title || "dx3xb"}</h2>
          {cfg.intro && <p className="hl-introtext">{cfg.intro}</p>}
          <button className="hl-btn coral" onClick={begin}>{t.start}</button>
        </div>
      )}
      {phase === "play" && (
        <div className="hl-card">
          <p className="hl-streak">{t.streak} <b>{streak}</b></p>
          <div className="hl-arena">
            <div className="hl-item">
              <span className="hl-tag">{t.cur}</span>
              <b className="hl-label">{items[curIdx].label}</b>
              <span className="hl-val">{items[curIdx].value}{cfg.unit}</span>
            </div>
            <div className="hl-or">{t.vs}</div>
            <div className={`hl-item next ${reveal !== null ? (reveal ? "ok" : "no") : ""}`}>
              <span className="hl-tag">{t.next}</span>
              <b className="hl-label">{items[nextIdx].label}</b>
              <span className="hl-val">{reveal !== null ? `${items[nextIdx].value}${cfg.unit}` : "???"}</span>
            </div>
          </div>
          {reveal === null ? (
            <div className="hl-guess">
              <button className="hl-btn teal" onClick={() => guess(true)}>{t.higher}</button>
              <button className="hl-btn coral" onClick={() => guess(false)}>{t.lower}</button>
            </div>
          ) : (
            <p className={`hl-fb ${reveal ? "ok" : "no"}`}>{reveal ? t.correct : t.wrong}</p>
          )}
        </div>
      )}
      {phase === "result" && (
        <div className="hl-result">
          <div className="hl-poster" ref={reportRef}>
            <div className="hl-phead">
              <span className="hl-pby">{t.by}</span>
              <span className="hl-pname">{title || "dx3xb"}</span>
            </div>
            <div className="hl-pbody">
              <p className="hl-yr">{t.result}</p>
              <div className="hl-big">{streak}</div>
              {!preview && slug && (
                <div className="hl-qr">
                  <div className="hl-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={84} height={84} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 84, height: 84 }} />
                    )}
                  </div>
                  <div>
                    <p className="hl-qrcta">{t.qrCta}</p>
                    <p className="hl-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="hl-made">{t.made}</p>
            </div>
          </div>
          <div className="hl-actions">
            {!preview && <button className="hl-btn coral" onClick={download}>{saving ? "…" : t.download}</button>}
            {!preview && <button className="hl-btn teal" onClick={share}>{t.share}</button>}
            {!preview && <button className="hl-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>}
            <button className="hl-btn ghost" onClick={begin}>{t.replay}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function HigherLowerEditor({ config, onChange, lang }: { config: HlConfig; onChange: (c: HlConfig) => void; lang: Lang }) {
  const c = config;
  const t =
    lang === "zh"
      ? { intro: "一句话介绍（如：猜猜哪个更贵）", unit: "单位（如：元，可空）", items: "条目（≥4，给名称+数值）", label: "名称（如：iPhone）", value: "数值", add: "+ 加一个", hint: "玩家会被随机两两对比，猜下一个数值更高还是更低" }
      : { intro: "Intro (e.g. Guess which costs more)", unit: "Unit (e.g. $, optional)", items: "Items (≥4: name + number)", label: "Name (e.g. iPhone)", value: "Value", add: "+ Add item", hint: "Players compare random pairs, guessing higher or lower" };
  const setItem = (i: number, p: Partial<HlItem>) => onChange({ ...c, items: c.items.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <input className="ein" placeholder={t.unit} value={c.unit} maxLength={12} onChange={(e) => onChange({ ...c, unit: e.target.value })} />
      <h3 className="ehead">{t.items}</h3>
      <p className="ewarn" style={{ marginTop: 0 }}>{t.hint}</p>
      {c.items.map((it, i) => (
        <div key={i} className="erow">
          <input className="ein grow" placeholder={t.label} value={it.label} maxLength={40} onChange={(e) => setItem(i, { label: e.target.value })} />
          <input className="ein" style={{ width: 96, flex: "none" }} type="number" placeholder={t.value} value={Number.isFinite(it.value) ? it.value : 0} onChange={(e) => setItem(i, { value: Number(e.target.value) })} />
          <button className="ex" onClick={() => onChange({ ...c, items: c.items.filter((_, j) => j !== i) })} disabled={c.items.length <= 2}>✕</button>
        </div>
      ))}
      {c.items.length < 30 && <button className="eadd" onClick={() => onChange({ ...c, items: [...c.items, { label: "", value: 0 }] })}>{t.add}</button>}
    </div>
  );
}

const HL_STYLE = `
.hl { font-family: var(--font-vt323), monospace; }
.hl-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.hl-intro { text-align: center; }
.hl-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.hl-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.hl-streak { text-align: center; font-family: var(--font-press), monospace; font-size: 11px; color: var(--ink-soft); margin: 0 0 14px; }
.hl-streak b { font-size: 18px; color: var(--coral); }
.hl-arena { display: grid; grid-template-columns: 1fr auto 1fr; align-items: stretch; gap: 10px; margin-bottom: 16px; }
.hl-item { background: var(--cream); border: 3px solid var(--line); box-shadow: 4px 4px 0 var(--ink); padding: 14px 10px; text-align: center;
  display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 130px; }
.hl-item.next { background: #eaf6ff; }
.hl-item.next.ok { background: #e8f8f1; }
.hl-item.next.no { background: #ffeaea; }
.hl-tag { font-family: var(--font-press), monospace; font-size: 8px; color: var(--ink-soft); }
.hl-label { font-size: 21px; line-height: 1.2; word-break: break-word; }
.hl-val { font-family: var(--font-press), monospace; font-size: 17px; }
@media (max-width: 430px) {
  .hl-arena { gap: 6px; }
  .hl-item { min-height: 108px; padding: 10px 6px; }
  .hl-label { font-size: 17px; }
}
.hl-or { align-self: center; font-family: var(--font-press), monospace; font-size: 11px; color: var(--coral); }
.hl-guess { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.hl-fb { text-align: center; font-family: var(--font-press), monospace; font-size: 16px; margin: 8px 0 0; }
.hl-fb.ok { color: var(--teal); }
.hl-fb.no { color: var(--coral); }
.hl-result { display: grid; gap: 16px; }
.hl-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.hl-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.hl-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--yellow); color: var(--ink); padding: 4px 7px; }
.hl-pname { font-size: 18px; }
.hl-pbody { padding: 22px 20px; text-align: center; }
.hl-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0; }
.hl-big { font-family: var(--font-press), monospace; font-size: clamp(52px, 22vw, 96px); line-height: 1; color: var(--coral); margin: 8px 0 14px; }
.hl-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; text-align: left; }
.hl-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.hl-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.hl-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.hl-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.hl-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.hl-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.hl-btn.teal { background: var(--teal); }
.hl-btn.ghost { background: #fff; color: var(--ink); }
.hl-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;
