"use client";
// 模板：懂我测试 —— 作者出关于自己的题并标正确答案，朋友来测“有多懂你”，出懂你指数
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { clean, type Lang } from "./types";

export type KmQuestion = { q: string; options: string[]; correct: number };
export type KmConfig = { intro: string; questions: KmQuestion[] };

export function kmEmpty(lang: Lang = "zh"): KmConfig {
  if (lang === "en")
    return {
      intro: "How well do you know me? (sample — make it about you)",
      questions: [
        { q: "My favorite food is?", options: ["Hotpot", "Sushi", "Salad"], correct: 0 },
        { q: "On weekends I'm probably…", options: ["Sleeping", "Gaming", "Shopping"], correct: 1 },
        { q: "I can't stand?", options: ["Cockroaches", "Overtime", "No wifi"], correct: 2 },
      ],
    };
  return {
    intro: "测测你有多懂我（这是示例，改成关于你自己的）",
    questions: [
      { q: "我最爱的食物是？", options: ["火锅", "寿司", "沙拉"], correct: 0 },
      { q: "我周末更可能在…", options: ["睡觉", "打游戏", "逛街"], correct: 1 },
      { q: "我最受不了的是？", options: ["蟑螂", "加班", "没网"], correct: 2 },
    ],
  };
}
export function kmValidate(input: unknown): KmConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const qs = (Array.isArray(o.questions) ? o.questions.slice(0, 12) : []) as Record<string, unknown>[];
  return {
    intro: clean(o.intro, 200),
    questions: qs.map((q) => {
      const options = (Array.isArray(q?.options) ? q.options.slice(0, 6) : []).map((x) => clean(x, 60));
      let correct = Number(q?.correct) || 0;
      if (correct < 0 || correct >= options.length) correct = 0;
      return { q: clean(q?.q, 120), options, correct };
    }),
  };
}
export function kmPublishable(c: KmConfig): boolean {
  return (
    c.questions.length >= 3 &&
    c.questions.every((q) => q.q.trim() && q.options.filter((o) => o.trim()).length >= 2)
  );
}

const TIERS: { min: number; zh: string; en: string }[] = [
  { min: 95, zh: "灵魂伴侣", en: "Soulmate" },
  { min: 80, zh: "头号铁粉", en: "Ride or Die" },
  { min: 60, zh: "懂行的朋友", en: "Close Friend" },
  { min: 40, zh: "点头之交", en: "Acquaintance" },
  { min: 20, zh: "塑料朋友", en: "Plastic Pal" },
  { min: 0, zh: "最熟悉的陌生人", en: "Familiar Stranger" },
];
function tierFor(pct: number, lang: Lang) {
  const tr = TIERS.find((x) => pct >= x.min) ?? TIERS[TIERS.length - 1];
  return lang === "zh" ? tr.zh : tr.en;
}

const T = {
  zh: {
    start: "开始测试",
    of: (i: number, n: number) => `第 ${i} / ${n} 题`,
    youKnow: "你的懂你指数",
    replay: "再测一次",
    share: "分享结果",
    copy: "复制",
    copied: "已复制",
    download: "下载结果图",
    qrCta: "扫码看你比我更懂 ta 吗",
    by: "懂我测试",
    made: "用 dx3xb 微应用工厂制作",
    shareText: (title: string, pct: number, tier: string, url: string) => `我做了「${title}」，懂你指数 ${pct}%（${tier}）！你比我更懂 ta 吗：${url}`,
    empty: "这个测试还没做完。",
  },
  en: {
    start: "START",
    of: (i: number, n: number) => `Q ${i} / ${n}`,
    youKnow: "YOUR KNOW-ME SCORE",
    replay: "RETAKE",
    share: "SHARE",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan — do you know them better?",
    by: "KNOW-ME",
    made: "Made with dx3xb micro-app studio",
    shareText: (title: string, pct: number, tier: string, url: string) => `I took "${title}" and scored ${pct}% (${tier})! Do you know them better? ${url}`,
    empty: "This test isn't finished yet.",
  },
} as const;

export function KnowMePlayer({
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: KmConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const cfg = useMemo(() => kmValidate(config), [config]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
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

  const pct = useMemo(() => {
    if (phase !== "result" || cfg.questions.length === 0) return 0;
    let m = 0;
    cfg.questions.forEach((q, i) => {
      if (picks[i] === q.correct) m += 1;
    });
    return Math.round((m / cfg.questions.length) * 100);
  }, [phase, picks, cfg]);
  const tier = tierFor(pct, lang);

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

  if (cfg.questions.length === 0) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  function pick(o: number) {
    const next = [...picks];
    next[idx] = o;
    setPicks(next);
    if (idx + 1 < cfg.questions.length) setIdx(idx + 1);
    else setPhase("result");
  }
  async function share() {
    const text = t.shareText(title || "dx3xb", pct, tier, shareUrl);
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
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb", pct, tier, shareUrl));
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
      a.download = `dx3xb-knowme-${slug || "result"}.png`;
      a.href = u;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="km">
      <style dangerouslySetInnerHTML={{ __html: KM_STYLE }} />
      {phase === "intro" && (
        <div className="km-card km-intro">
          <h2 className="pixel km-title">{title || "dx3xb"}</h2>
          {cfg.intro && <p className="km-introtext">{cfg.intro}</p>}
          <button className="km-btn coral" onClick={() => setPhase("play")}>{t.start}</button>
        </div>
      )}
      {phase === "play" && cfg.questions[idx] && (
        <div className="km-card">
          <p className="km-step">{t.of(idx + 1, cfg.questions.length)}</p>
          <div className="km-bar"><i style={{ width: `${(idx / cfg.questions.length) * 100}%` }} /></div>
          <h3 className="km-q">{cfg.questions[idx].q}</h3>
          <div className="km-opts">
            {cfg.questions[idx].options.map((o, i) => (
              <button key={i} className="km-opt" onClick={() => pick(i)}>{o || "—"}</button>
            ))}
          </div>
        </div>
      )}
      {phase === "result" && (
        <div className="km-result">
          <div className="km-poster" ref={reportRef}>
            <div className="km-phead">
              <span className="km-pby">{t.by}</span>
              <span className="km-pname">{title || "dx3xb"}</span>
            </div>
            <div className="km-pbody">
              <p className="km-yr">{t.youKnow}</p>
              <div className="km-pct">{pct}<span>%</span></div>
              <h2 className="pixel km-tier">{tier}</h2>
              {!preview && slug && (
                <div className="km-qr">
                  <div className="km-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={84} height={84} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 84, height: 84 }} />
                    )}
                  </div>
                  <div>
                    <p className="km-qrcta">{t.qrCta}</p>
                    <p className="km-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="km-made">{t.made}</p>
            </div>
          </div>
          <div className="km-actions">
            {!preview && <button className="km-btn coral" onClick={download}>{saving ? "…" : t.download}</button>}
            {!preview && <button className="km-btn teal" onClick={share}>{t.share}</button>}
            {!preview && <button className="km-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>}
            <button className="km-btn ghost" onClick={() => { setIdx(0); setPicks([]); setPhase("play"); }}>{t.replay}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function KnowMeEditor({ config, onChange, lang }: { config: KmConfig; onChange: (c: KmConfig) => void; lang: Lang }) {
  const c = config;
  const t =
    lang === "zh"
      ? { intro: "一句话介绍（如：你真的懂我吗？）", qs: "题目（关于你自己，3–12 题）", qPh: "题目（如：我最爱的食物是？）", opt: "选项", correct: "标为正确答案", add: "+ 加一题", addOpt: "+ 选项", hint: "每题点一个选项右边的 ✓ 设为关于你的正确答案" }
      : { intro: "Intro (e.g. Do you really know me?)", qs: "Questions about you (3–12)", qPh: "Question (e.g. My favorite food is?)", opt: "Option", correct: "mark correct", add: "+ Add question", addOpt: "+ Option", hint: "Tap the ✓ next to the true answer about you" };
  const setQ = (i: number, p: Partial<KmQuestion>) => onChange({ ...c, questions: c.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) });
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <h3 className="ehead">{t.qs}</h3>
      <p className="ewarn" style={{ marginTop: 0 }}>{t.hint}</p>
      {c.questions.map((q, qi) => (
        <div key={qi} className="ecard">
          <div className="erow">
            <input className="ein grow" placeholder={t.qPh} value={q.q} maxLength={120} onChange={(e) => setQ(qi, { q: e.target.value })} />
            <button className="ex" onClick={() => onChange({ ...c, questions: c.questions.filter((_, j) => j !== qi) })} disabled={c.questions.length <= 1}>✕</button>
          </div>
          {q.options.map((o, oi) => (
            <div key={oi} className="erow">
              <input className="ein grow" placeholder={`${t.opt} ${oi + 1}`} value={o} maxLength={60} onChange={(e) => setQ(qi, { options: q.options.map((x, k) => (k === oi ? e.target.value : x)) })} />
              <button className={`echip ${q.correct === oi ? "w2" : ""}`} title={t.correct} onClick={() => setQ(qi, { correct: oi })}>✓</button>
              {q.options.length > 2 && (
                <button className="ex" onClick={() => setQ(qi, { options: q.options.filter((_, k) => k !== oi), correct: q.correct >= oi && q.correct > 0 ? q.correct - 1 : q.correct })}>−</button>
              )}
            </div>
          ))}
          {q.options.length < 6 && <button className="eadd small" onClick={() => setQ(qi, { options: [...q.options, ""] })}>{t.addOpt}</button>}
        </div>
      ))}
      {c.questions.length < 12 && <button className="eadd" onClick={() => onChange({ ...c, questions: [...c.questions, { q: "", options: ["", ""], correct: 0 }] })}>{t.add}</button>}
    </div>
  );
}

const KM_STYLE = `
.km { font-family: var(--font-vt323), monospace; }
.km-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.km-intro { text-align: center; }
.km-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.km-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.km-step { font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft); margin: 0 0 8px; }
.km-bar { height: 12px; border: 3px solid var(--line); background: var(--cream); overflow: hidden; margin-bottom: 16px; }
.km-bar i { display: block; height: 100%; background: var(--pink, #ff8fab); transition: width .2s; }
.km-q { font-size: 23px; margin: 0 0 16px; line-height: 1.3; }
.km-opts { display: grid; gap: 10px; }
.km-opt { text-align: left; font-family: inherit; font-size: 20px; background: var(--cream); color: var(--ink);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px 14px; cursor: pointer; transition: transform .06s, box-shadow .06s, background .1s; }
.km-opt:hover { background: #fff; transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--ink); }
.km-opt:active { transform: translate(3px,3px); box-shadow: none; }
.km-result { display: grid; gap: 16px; }
.km-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.km-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.km-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--pink, #ff8fab); color: #fff; padding: 4px 7px; }
.km-pname { font-size: 18px; }
.km-pbody { padding: 22px 20px; text-align: center; }
.km-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0; }
.km-pct { font-family: var(--font-press), monospace; font-size: clamp(40px, 16vw, 66px); line-height: 1; margin: 6px 0 4px; }
.km-pct span { color: var(--coral); }
.km-tier { font-size: clamp(22px, 7vw, 36px); color: var(--coral); margin: 4px 0 14px; }
.km-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; text-align: left; }
.km-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.km-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.km-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.km-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.km-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.km-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.km-btn.teal { background: var(--teal); }
.km-btn.ghost { background: #fff; color: var(--ink); }
.km-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;
