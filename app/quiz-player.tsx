"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { scoreQuiz, type QuizConfig } from "./dx3xb-apps";

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
  config,
  title,
  slug,
  lang,
  preview = false,
}: {
  config: QuizConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
}) {
  const t = T[lang];
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
