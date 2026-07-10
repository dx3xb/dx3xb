"use client";
// 应用级分享海报：把"我做的这个微应用"存成一张带二维码的图，发出去别人扫码直接开玩。
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import type { Lang } from "./types";

// 每个模板一句网站嗓音的幽默勾子（zh/en）
const TAGLINE: Record<string, { zh: string; en: string }> = {
  quiz: { zh: "几道题，测出你藏不住的本性", en: "A few taps, and your true self leaks out" },
  thisorthat: { zh: "全是送命题，敢不敢选", en: "Every pick's a trap. Choose anyway." },
  knowme: { zh: "你到底有多懂我？扫码自证清白", en: "How well do you know me? Prove it." },
  higherlower: { zh: "猜价格，看你是不是人间清醒", en: "Guess the price — are you even awake?" },
  madlibs: { zh: "乱填几个词，造个翻车现场", en: "Fill a few blanks, build a beautiful disaster" },
  escape: { zh: "脑洞不够大，可逃不出去", en: "Small brains don't escape" },
};
const META: Record<string, { emoji: string; zh: string; en: string }> = {
  quiz: { emoji: "🎭", zh: "性格测试", en: "QUIZ" },
  thisorthat: { emoji: "⚔️", zh: "二选一", en: "THIS OR THAT" },
  knowme: { emoji: "💘", zh: "懂我测试", en: "KNOW-ME" },
  higherlower: { emoji: "📈", zh: "猜价闯关", en: "HIGHER / LOWER" },
  madlibs: { emoji: "✏️", zh: "故事填词", en: "MAD LIBS" },
  escape: { emoji: "🧩", zh: "解谜闯关", en: "ESCAPE" },
};

const C = {
  zh: {
    gen: "下载分享海报",
    saving: "生成中…",
    scan: "扫码开玩",
    made: "用 dx3xb 微应用工厂做的",
    hint: "存成图片，发群 / 朋友圈 / 小红书，朋友扫码直接开玩，比甩链接好使。",
  },
  en: {
    gen: "Save share poster",
    saving: "Rendering…",
    scan: "SCAN TO PLAY",
    made: "Made in the dx3xb micro-app studio",
    hint: "Save it and post anywhere — friends scan the code and play. Beats pasting a link.",
  },
} as const;

export function SharePoster({
  title,
  template,
  slug,
  lang,
  creatorHandle,
}: {
  title: string;
  template: string;
  slug: string;
  lang: Lang;
  creatorHandle?: string | null;
}) {
  const t = C[lang];
  const meta = META[template] ?? { emoji: "🎲", zh: "微应用", en: "MICRO-APP" };
  const tag = (TAGLINE[template] ?? { zh: "扫码来玩我做的小玩具", en: "Scan to play my little toy" })[lang];
  const label = lang === "zh" ? meta.zh : meta.en;
  const url = `https://dx3xb.com/u/${slug}`;
  const [qr, setQr] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let on = true;
    QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: "#2b2233", light: "#fffdf8" } })
      .then((d) => on && setQr(d))
      .catch(() => on && setQr(""));
    return () => {
      on = false;
    };
  }, [url]);

  async function download() {
    const node = ref.current;
    if (!node || saving) return;
    setSaving(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const u = await toPng(node, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const a = document.createElement("a");
      a.download = `dx3xb-${slug}.png`;
      a.href = u;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sp">
      <style dangerouslySetInnerHTML={{ __html: SP_STYLE }} />
      <div className="sp-poster" ref={ref}>
        <div className="sp-head">
          <span className="sp-badge">dx3xb</span>
          <span className="sp-kind">{meta.emoji} {label}</span>
        </div>
        <div className="sp-body">
          <h2 className="pixel sp-title">{title || "dx3xb"}</h2>
          {creatorHandle && <p className="sp-author">by @{creatorHandle}</p>}
          <p className="sp-tag">{tag}</p>
          <div className="sp-qrframe">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="qr" width={150} height={150} style={{ display: "block", imageRendering: "pixelated" }} />
            ) : (
              <div style={{ width: 150, height: 150 }} />
            )}
          </div>
          <p className="sp-scan">{t.scan}</p>
          <p className="sp-url">dx3xb.com/u/{slug}</p>
          <p className="sp-made">{t.made}</p>
        </div>
      </div>
      <button className="sp-btn" onClick={download}>{saving ? t.saving : t.gen}</button>
      <p className="sp-hint">{t.hint}</p>
    </div>
  );
}

const SP_STYLE = `
.sp { display: grid; gap: 10px; justify-items: start; margin-top: 8px; }
.sp-poster { width: 100%; max-width: 360px; background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; font-family: var(--font-vt323), monospace; }
.sp-head { background: var(--ink); color: var(--cream); display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 16px; }
.sp-badge { font-family: var(--font-press), monospace; font-size: 11px; background: var(--coral); color: #fff; padding: 5px 8px; }
.sp-kind { font-size: 17px; }
.sp-body { padding: 22px 20px 24px; text-align: center; }
.sp-title { font-size: clamp(22px, 7vw, 32px); margin: 0 0 8px; line-height: 1.1; }
.sp-author { display: inline-block; margin: 0 0 12px; padding: 4px 7px; background: var(--yellow); border: 2px solid var(--line);
  font-family: var(--font-press), "FpxCJK", monospace; font-size: 9px; overflow-wrap: anywhere; }
.sp-tag { font-size: 19px; color: var(--ink-soft); margin: 0 0 18px; line-height: 1.3; }
.sp-qrframe { display: inline-block; border: 4px solid var(--line); background: #fff; padding: 8px; box-shadow: var(--shadow); line-height: 0; }
.sp-scan { font-family: var(--font-press), monospace; font-size: 11px; letter-spacing: 1px; color: var(--coral); margin: 14px 0 2px; }
.sp-url { font-family: var(--font-press), monospace; font-size: 10px; margin: 0; }
.sp-made { font-size: 14px; color: var(--ink-soft); margin: 16px 0 0; }
.sp-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--teal); }
.sp-btn:active { transform: translate(4px,4px); box-shadow: none; }
.sp-hint { font-size: 14px; color: var(--ink-soft); margin: 0; }
`;
