"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { scoreQuiz, validateQuizConfig, type QuizConfig } from "./dx3xb-apps";

type Lang = "zh" | "en";

const T = {
  zh: {
    start: "开始测试",
    q: (i: number, n: number) => `第 ${i} / ${n} 题`,
    yourResult: "你的结果",
    by: "测验",
    replay: "再测一次",
    share: "分享结果",
    copy: "复制结果",
    copied: "已复制",
    download: "下载结果图",
    qrCta: "扫码也来测测你是哪种",
    madeWith: "用 dx3xb 微应用工厂制作",
    shareText: (title: string, res: string, url: string) => `我在「${title}」测出是「${res}」！来 dx3xb 测测你是哪种：${url}`,
    empty: "这个测验还没做完。",
  },
  en: {
    start: "START",
    q: (i: number, n: number) => `Q ${i} / ${n}`,
    yourResult: "YOUR RESULT",
    by: "QUIZ",
    replay: "RETAKE",
    share: "SHARE RESULT",
    copy: "COPY",
    copied: "COPIED",
    download: "SAVE IMAGE",
    qrCta: "Scan to find out what you are",
    madeWith: "Made with dx3xb micro-app studio",
    shareText: (title: string, res: string, url: string) => `I got "${res}" on "${title}"! Find out what you are on dx3xb: ${url}`,
    empty: "This quiz isn't finished yet.",
  },
} as const;

export function QuizPlayer({
  config: rawConfig,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: unknown;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
  const config = useMemo(() => validateQuizConfig(rawConfig), [rawConfig]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qr, setQr] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const ready = config.results.length >= 1 && config.questions.length >= 1;
  const result = useMemo(() => (phase === "result" ? scoreQuiz(config, picks) : null), [phase, config, picks]);
  const shareUrl = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";

  // 切换 config(编辑器预览实时变)时重置
  useEffect(() => {
    setPhase("intro");
    setIdx(0);
    setPicks([]);
  }, [config]);

  useEffect(() => {
    if (phase !== "result" || !result || preview || !slug) {
      setQr("");
      return;
    }
    let on = true;
    QRCode.toDataURL(`${shareUrl}?r=${result.key}`, { margin: 1, width: 300, color: { dark: "#2b2233", light: "#fffdf8" } })
      .then((d) => on && setQr(d))
      .catch(() => on && setQr(""));
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, result, preview, slug]);

  function pick(optIndex: number) {
    const next = [...picks];
    next[idx] = optIndex;
    setPicks(next);
    if (idx + 1 < config.questions.length) setIdx(idx + 1);
    else setPhase("result");
  }

  function restart() {
    setIdx(0);
    setPicks([]);
    setCopied(false);
    setPhase(config.questions.length ? "play" : "intro");
  }

  async function share() {
    if (!result) return;
    const text = t.shareText(title || "dx3xb quiz", result.title, `${shareUrl}?r=${result.key}`);
    try {
      if (navigator.share) await navigator.share({ title: title || "dx3xb", text, url: `${shareUrl}?r=${result.key}` });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* cancelled */
    }
  }
  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(t.shareText(title || "dx3xb quiz", result.title, `${shareUrl}?r=${result.key}`));
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
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const a = document.createElement("a");
      a.download = `dx3xb-quiz-${slug || "result"}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className="qp"><style dangerouslySetInnerHTML={{ __html: QP_STYLE }} /><p className="qp-empty">{t.empty}</p></div>;

  return (
    <div className="qp">
      <style dangerouslySetInnerHTML={{ __html: QP_STYLE }} />

      {phase === "intro" && (
        <div className="qp-card qp-intro">
          <h2 className="pixel qp-title">{title || "dx3xb quiz"}</h2>
          {config.intro && <p className="qp-introtext">{config.intro}</p>}
          <button className="qp-btn coral" onClick={() => setPhase("play")}>{t.start}</button>
        </div>
      )}

      {phase === "play" && config.questions[idx] && (
        <div className="qp-card">
          <p className="qp-step">{t.q(idx + 1, config.questions.length)}</p>
          <div className="qp-bar"><i style={{ width: `${(idx / config.questions.length) * 100}%` }} /></div>
          <h3 className="qp-q">{config.questions[idx].q}</h3>
          <div className="qp-opts">
            {config.questions[idx].options.map((o, i) => (
              <button key={i} className="qp-opt" onClick={() => pick(i)}>{o.label || "—"}</button>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && result && (
        <div className="qp-result">
          <div className="qp-poster" ref={reportRef}>
            <div className="qp-phead">
              <span className="qp-pby">{t.by}</span>
              <span className="qp-pname">{title || "dx3xb quiz"}</span>
            </div>
            <div className="qp-pbody">
              <p className="qp-yr">{t.yourResult}</p>
              <div className="qp-emoji">{result.emoji || "✨"}</div>
              <h2 className="pixel qp-rtitle">{result.title}</h2>
              {result.desc && <p className="qp-rdesc">{result.desc}</p>}
              {!preview && slug && (
                <div className="qp-qr">
                  <div className="qp-qrframe">
                    {qr ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qr} alt="qr" width={84} height={84} style={{ display: "block", imageRendering: "pixelated" }} />
                    ) : (
                      <div style={{ width: 84, height: 84 }} />
                    )}
                  </div>
                  <div className="qp-qrtext">
                    <p className="qp-qrcta">{t.qrCta}</p>
                    <p className="qp-qrurl">dx3xb.com/u/{slug}</p>
                  </div>
                </div>
              )}
              <p className="qp-made">{t.madeWith}</p>
            </div>
          </div>

          {!preview && (
            <div className="qp-actions">
              <button className="qp-btn coral" onClick={download}>{saving ? "…" : t.download}</button>
              <button className="qp-btn teal" onClick={share}>{t.share}</button>
              <button className="qp-btn ghost" onClick={copy}>{copied ? t.copied : t.copy}</button>
              <button className="qp-btn ghost" onClick={restart}>{t.replay}</button>
            </div>
          )}
          {preview && (
            <div className="qp-actions">
              <button className="qp-btn ghost" onClick={restart}>{t.replay}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const QP_STYLE = `
.qp { font-family: var(--font-vt323), monospace; }
.qp-empty { color: var(--ink-soft); }
.qp-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; }
.qp-intro { text-align: center; }
.qp-title { margin: 0 0 12px; font-size: clamp(22px, 6vw, 34px); }
.qp-introtext { font-size: 19px; color: var(--ink-soft); margin: 0 0 20px; }
.qp-step { font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft); margin: 0 0 8px; }
.qp-bar { height: 12px; border: 3px solid var(--line); background: var(--cream); overflow: hidden; margin-bottom: 16px; }
.qp-bar i { display: block; height: 100%; background: var(--teal); transition: width .2s; }
.qp-q { font-size: 23px; margin: 0 0 16px; line-height: 1.3; }
.qp-opts { display: grid; gap: 10px; }
.qp-opt { text-align: left; font-family: inherit; font-size: 20px; background: var(--cream); color: var(--ink);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px 14px; cursor: pointer; transition: transform .06s, box-shadow .06s, background .1s; }
.qp-opt:hover { background: #fff; transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--ink); }
.qp-opt:active { transform: translate(3px,3px); box-shadow: none; }
.qp-result { display: grid; gap: 16px; }
.qp-poster { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; }
.qp-phead { background: var(--ink); color: var(--cream); display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.qp-pby { font-family: var(--font-press), monospace; font-size: 9px; background: var(--coral); color: #fff; padding: 4px 7px; }
.qp-pname { font-size: 18px; }
.qp-pbody { padding: 22px 20px; text-align: center; }
.qp-yr { font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 0; }
.qp-emoji { font-size: 64px; line-height: 1; margin: 8px 0; }
.qp-rtitle { font-size: clamp(24px, 8vw, 40px); color: var(--coral); margin: 4px 0 10px; }
.qp-rdesc { font-size: 19px; color: var(--ink-soft); margin: 0 0 16px; }
.qp-qr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,.35); padding-top: 14px; text-align: left; }
.qp-qrframe { border: 4px solid var(--line); background: #fff; padding: 4px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.qp-qrcta { font-size: 16px; color: var(--ink-soft); margin: 0; }
.qp-qrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 4px 0 0; }
.qp-made { font-size: 13px; color: var(--ink-soft); margin: 14px 0 0; }
.qp-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.qp-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.qp-btn.teal { background: var(--teal); }
.qp-btn.ghost { background: #fff; color: var(--ink); }
.qp-btn:active { transform: translate(4px,4px); box-shadow: none; }
`;

// ===== 编辑器（在 /studio/[id] 宿主里渲染，复用其 .eform/.ein 等样式）=====
const QE = {
  zh: { introPh: "一句话介绍（可选）", results: "结果（2–8 个）", addResult: "+ 加一个结果", emojiPh: "😺",
    resTitlePh: "结果名（如：懒猫）", resDescPh: "结果描述（可选）", questions: "题目（1–12 题）", addQuestion: "+ 加一题",
    qPh: "题目（如：周末你更想…）", optPh: "选项", addOption: "+ 选项", scoreHint: "点结果表情给该选项加权（0→1→2）：" },
  en: { introPh: "One-line intro (optional)", results: "Results (2–8)", addResult: "+ Add result", emojiPh: "😺",
    resTitlePh: "Result name (e.g. Lazy Cat)", resDescPh: "Result description (optional)", questions: "Questions (1–12)", addQuestion: "+ Add question",
    qPh: "Question (e.g. On weekends you'd rather…)", optPh: "Option", addOption: "+ Option", scoreHint: "Tap a result emoji to weight this option (0→1→2):" },
} as const;

export function QuizEditor({ config, onChange, lang }: { config: QuizConfig; onChange: (c: QuizConfig) => void; lang: Lang }) {
  const t = QE[lang];
  const c = config;
  const setResult = (i: number, p: Partial<{ emoji: string; title: string; desc: string }>) =>
    onChange({ ...c, results: c.results.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const setQ = (i: number, q: string) => onChange({ ...c, questions: c.questions.map((x, j) => (j === i ? { ...x, q } : x)) });
  const setOpt = (qi: number, oi: number, label: string) =>
    onChange({ ...c, questions: c.questions.map((x, j) => (j === qi ? { ...x, options: x.options.map((o, k) => (k === oi ? { ...o, label } : o)) } : x)) });
  const cycleScore = (qi: number, oi: number, key: string) =>
    onChange({
      ...c,
      questions: c.questions.map((x, j) =>
        j !== qi ? x : { ...x, options: x.options.map((o, k) => {
          if (k !== oi) return o;
          const cur = o.scores[key] ?? 0; const next = cur >= 2 ? 0 : cur + 1; const scores = { ...o.scores };
          if (next === 0) delete scores[key]; else scores[key] = next; return { ...o, scores };
        }) },
      ),
    });
  return (
    <div className="eform">
      <input className="ein" placeholder={t.introPh} value={c.intro} maxLength={200} onChange={(e) => onChange({ ...c, intro: e.target.value })} />
      <h3 className="ehead">{t.results}</h3>
      {c.results.map((r, i) => (
        <div key={i} className="ecard">
          <div className="erow">
            <input className="ein emoji" value={r.emoji} maxLength={6} placeholder={t.emojiPh} onChange={(e) => setResult(i, { emoji: e.target.value })} />
            <input className="ein grow" value={r.title} maxLength={40} placeholder={t.resTitlePh} onChange={(e) => setResult(i, { title: e.target.value })} />
            <button className="ex" onClick={() => onChange({ ...c, results: c.results.filter((_, j) => j !== i) })} disabled={c.results.length <= 1}>✕</button>
          </div>
          <input className="ein" value={r.desc} maxLength={200} placeholder={t.resDescPh} onChange={(e) => setResult(i, { desc: e.target.value })} />
        </div>
      ))}
      {c.results.length < 8 && (
        <button className="eadd" onClick={() => onChange({ ...c, results: [...c.results, { key: "r" + Math.random().toString(36).slice(2, 5), emoji: "✨", title: "", desc: "" }] })}>{t.addResult}</button>
      )}
      <h3 className="ehead">{t.questions}</h3>
      {c.questions.map((q, qi) => (
        <div key={qi} className="ecard">
          <div className="erow">
            <input className="ein grow" value={q.q} maxLength={120} placeholder={t.qPh} onChange={(e) => setQ(qi, e.target.value)} />
            <button className="ex" onClick={() => onChange({ ...c, questions: c.questions.filter((_, j) => j !== qi) })} disabled={c.questions.length <= 1}>✕</button>
          </div>
          {q.options.map((o, oi) => (
            <div key={oi} className="eopt">
              <div className="erow">
                <input className="ein grow" value={o.label} maxLength={60} placeholder={`${t.optPh} ${oi + 1}`} onChange={(e) => setOpt(qi, oi, e.target.value)} />
                <button className="ex" onClick={() => onChange({ ...c, questions: c.questions.map((x, j) => (j === qi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x)) })} disabled={q.options.length <= 2}>✕</button>
              </div>
              <div className="escore">
                <span className="ehint">{t.scoreHint}</span>
                {c.results.map((r) => {
                  const w = o.scores[r.key] ?? 0;
                  return <button key={r.key} className={`echip w${w}`} onClick={() => cycleScore(qi, oi, r.key)} title={r.title}>{r.emoji || "?"}{w > 0 ? `+${w}` : ""}</button>;
                })}
              </div>
            </div>
          ))}
          {q.options.length < 6 && (
            <button className="eadd small" onClick={() => onChange({ ...c, questions: c.questions.map((x, j) => (j === qi ? { ...x, options: [...x.options, { label: "", scores: {} }] } : x)) })}>{t.addOption}</button>
          )}
        </div>
      ))}
      {c.questions.length < 12 && (
        <button className="eadd" onClick={() => onChange({ ...c, questions: [...c.questions, { q: "", options: [{ label: "", scores: {} }, { label: "", scores: {} }] }] })}>{t.addQuestion}</button>
      )}
    </div>
  );
}
