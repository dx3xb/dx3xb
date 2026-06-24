"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Phase = "ready" | "playing" | "finished";
type Lang = "zh" | "en";
type Round = {
  level: number;
  size: number;
  base: string;
  target: string;
  targetIndex: number;
  delta: number;
  mode: "brightness" | "saturation" | "hue";
};

const TOTAL_TIME = 60;
const MAX_VISIBLE_LEVEL = 20;

const COPY = {
  zh: {
    readyTitle: "色差猎人",
    readyKicker: "Color Hunter / dx3xb lab toy",
    readyDesc: "找出那一块颜色略有不同的色块。越往后色差越小，速度、连击和失误都会影响最终报告。",
    start: "开始测试",
    sameSeed: "同题复战",
    newSeed: "换一套题",
    share: "发起挑战",
    copy: "复制战报",
    copied: "已复制",
    back: "← dx3xb",
    langBtn: "EN",
    disclaimer: "娱乐视觉测试，不作为医学色觉诊断。",
    challengeNotice: (s: number) => `有人留下了 ${s} 分的同题挑战。超过他，战报会更好看。`,
    rules: { time: "限时", delta: "色差递减", seed: "同题挑战" },
    modes: { brightness: "明度", saturation: "饱和", hue: "色相" } as Record<Round["mode"], string>,
    reportKicker: "DX3XB 视觉报告",
    beat: (p: number) => `你打败了 ${p}% 的玩家`,
    challengeRow: "同题挑战：",
    challengeWin: "已超过对方",
    challengeLose: (d: number) => `还差 ${d} 分`,
    grid: {
      total: "总分",
      reached: "到达关卡",
      minDelta: "最小色差",
      avg: "平均反应",
      bestCombo: "最高连击",
      mistakes: "失误",
    },
    fineprintTail: "当前百分位为第一版估算，后续接入真实玩家分布。",
    shareTitle: "扫码接受挑战",
    shareHint: "用手机扫码，或把链接转发给朋友，一起挑战同一套题。",
    qrAlt: "同题挑战二维码",
    nativeShareTitle: "色差猎人挑战",
    titles: ["色弱警报", "正常观察者", "设计师眼睛", "鹰眼玩家", "印刷厂老板"],
    reportText: (score: number, title: string, pct: number, minDelta: string, url: string) =>
      `我在 dx3xb 色差猎人拿到 ${score} 分，${title}，打败了 ${pct}% 的玩家。最小识别色差 ΔE ${minDelta}。来挑战同一套题：${url}`,
  },
  en: {
    readyTitle: "Color Hunter",
    readyKicker: "Color Hunter / dx3xb lab toy",
    readyDesc:
      "Spot the single tile whose color is slightly off. The gap shrinks every level — speed, combos and misses all shape your final report.",
    start: "START TEST",
    sameSeed: "REPLAY SAME",
    newSeed: "NEW PUZZLE",
    share: "CHALLENGE",
    copy: "COPY REPORT",
    copied: "COPIED",
    back: "← dx3xb",
    langBtn: "中",
    disclaimer: "A fun vision test, not a medical color-vision diagnosis.",
    challengeNotice: (s: number) => `Someone left a ${s}-point challenge on this puzzle. Beat it for a better report.`,
    rules: { time: "TIME LIMIT", delta: "SHRINKING ΔE", seed: "SAME PUZZLE" },
    modes: { brightness: "brightness", saturation: "saturation", hue: "hue" } as Record<Round["mode"], string>,
    reportKicker: "DX3XB VISION REPORT",
    beat: (p: number) => `You beat ${p}% of players`,
    challengeRow: "Same-puzzle duel: ",
    challengeWin: "you took the lead",
    challengeLose: (d: number) => `${d} points to go`,
    grid: {
      total: "SCORE",
      reached: "LEVEL REACHED",
      minDelta: "MIN ΔE",
      avg: "AVG REACTION",
      bestCombo: "BEST COMBO",
      mistakes: "MISSES",
    },
    fineprintTail: "This percentile is a first-pass estimate; real player distribution coming soon.",
    shareTitle: "SCAN TO CHALLENGE",
    shareHint: "Scan with a phone or forward the link to dare a friend on the exact same puzzle.",
    qrAlt: "Same-puzzle challenge QR code",
    nativeShareTitle: "Color Hunter challenge",
    titles: ["Color Alert", "Normal Observer", "Designer's Eye", "Eagle Eye", "Print-Shop Boss"],
    reportText: (score: number, title: string, pct: number, minDelta: string, url: string) =>
      `I scored ${score} in dx3xb Color Hunter — ${title}, beating ${pct}% of players. Smallest gap I caught: ΔE ${minDelta}. Take the same puzzle: ${url}`,
  },
} satisfies Record<Lang, Record<string, unknown>>;

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
  const stored = window.localStorage.getItem("dx3xb_lang");
  if (stored === "zh" || stored === "en") return stored;
  return "en";
}

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function signed(rand: () => number, amount: number, current: number, min: number, max: number) {
  const direction = current + amount > max ? -1 : current - amount < min ? 1 : rand() > 0.5 ? 1 : -1;
  return clamp(current + direction * amount, min, max);
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function makeSeed() {
  return `dx3xb-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function getSeedFromUrl() {
  if (typeof window === "undefined") return "dx3xb-local";
  const seed = new URLSearchParams(window.location.search).get("seed");
  return seed && seed.length < 80 ? seed : makeSeed();
}

function makeRound(seed: string, level: number): Round {
  const rand = mulberry32(hashString(`${seed}:${level}`));
  const size = clamp(3 + Math.floor((level - 1) / 5), 3, 7);
  const count = size * size;
  const delta = Math.max(2.2, 18 - (level - 1) * 0.72);
  const hue = Math.floor(rand() * 360);
  const saturation = 42 + rand() * 32;
  const lightness = 43 + rand() * 24;
  const modeRoll = rand();
  const mode: Round["mode"] = modeRoll < 0.46 ? "brightness" : modeRoll < 0.78 ? "saturation" : "hue";

  let targetHue = hue;
  let targetSaturation = saturation;
  let targetLightness = lightness;

  if (mode === "brightness") {
    targetLightness = signed(rand, delta * 0.72, lightness, 28, 78);
  } else if (mode === "saturation") {
    targetSaturation = signed(rand, delta * 0.95, saturation, 22, 88);
  } else {
    targetHue = (hue + (rand() > 0.5 ? 1 : -1) * delta * 1.85 + 360) % 360;
  }

  return {
    level,
    size,
    base: hsl(hue, saturation, lightness),
    target: hsl(targetHue, targetSaturation, targetLightness),
    targetIndex: Math.floor(rand() * count),
    delta: Number(delta.toFixed(1)),
    mode,
  };
}

function percentile(score: number, level: number, minDelta: number, mistakes: number) {
  const raw = 24 + score / 90 + level * 1.45 + Math.max(0, 9 - minDelta) * 4.2 - mistakes * 2.6;
  return Math.round(clamp(raw, 8, 99));
}

function titleFor(pct: number, titles: readonly string[]) {
  if (pct >= 97) return titles[4];
  if (pct >= 85) return titles[3];
  if (pct >= 60) return titles[2];
  if (pct >= 30) return titles[1];
  return titles[0];
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function ColorHunter() {
  const [lang, setLang] = useState<Lang>("en");
  const [seed, setSeed] = useState("dx3xb-local");
  const [phase, setPhase] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [levelStartedAt, setLevelStartedAt] = useState(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [minDelta, setMinDelta] = useState(18);
  const [copied, setCopied] = useState(false);
  const [challengeScore, setChallengeScore] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const t = COPY[lang];

  useEffect(() => {
    setLang(getInitialLang());
    setSeed(getSeedFromUrl());
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
  }, []);

  const round = useMemo(() => makeRound(seed, level), [seed, level]);
  const currentPct = percentile(score, Math.max(level - 1, 1), minDelta, mistakes);
  const resultTitle = titleFor(currentPct, t.titles);
  const averageMs =
    reactionTimes.length > 0 ? reactionTimes.reduce((sum, item) => sum + item, 0) / reactionTimes.length : 0;

  function challengeUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("score", String(score));
    url.searchParams.set("pct", String(currentPct));
    url.searchParams.set("lang", lang);
    return url.toString();
  }

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // 战报页生成真实二维码，指向同题挑战链接，打通"扫码接受挑战"的裂变闭环
  useEffect(() => {
    if (phase !== "finished") {
      setQrDataUrl("");
      return;
    }
    const url = challengeUrl();
    if (!url) return;
    let active = true;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: "#221a2b", light: "#fffdf8" },
      errorCorrectionLevel: "M",
    })
      .then((data) => {
        if (active) setQrDataUrl(data);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, score, seed, currentPct, lang]);

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dx3xb_lang", next);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        window.history.replaceState(null, "", url.toString());
      }
      return next;
    });
  }

  function start(nextSeed = seed) {
    setSeed(nextSeed);
    setPhase("playing");
    setLevel(1);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setMistakes(0);
    setTimeLeft(TOTAL_TIME);
    setReactionTimes([]);
    setMinDelta(18);
    setCopied(false);
    setLevelStartedAt(Date.now());
  }

  function nextRandomGame() {
    const nextSeed = makeSeed();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("seed", nextSeed);
      url.searchParams.delete("score");
      url.searchParams.delete("pct");
      window.history.replaceState(null, "", url.toString());
    }
    start(nextSeed);
  }

  function choose(index: number) {
    if (phase !== "playing") return;
    if (index !== round.targetIndex) {
      setMistakes((prev) => prev + 1);
      setCombo(0);
      setScore((prev) => Math.max(0, prev - 35));
      setTimeLeft((prev) => Math.max(0, prev - 2));
      return;
    }

    const reaction = Date.now() - levelStartedAt;
    const speedBonus = clamp(260 - reaction / 16, 35, 260);
    const nextCombo = combo + 1;
    const levelBonus = 90 + level * 18;
    setScore((prev) => prev + Math.round(levelBonus + speedBonus + nextCombo * 14));
    setReactionTimes((prev) => [...prev, reaction]);
    setMinDelta((prev) => Math.min(prev, round.delta));
    setCombo(nextCombo);
    setBestCombo((prev) => Math.max(prev, nextCombo));
    setLevel((prev) => prev + 1);
    setLevelStartedAt(Date.now());
  }

  function reportText() {
    return t.reportText(score, resultTitle, currentPct, minDelta.toFixed(1), challengeUrl());
  }

  async function shareResult() {
    const text = reportText();
    try {
      if (navigator.share) {
        await navigator.share({ title: t.nativeShareTitle, text, url: challengeUrl() });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* user cancelled share */
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="wrap">
      <div className="backbar">
        <a className="backbtn" href="https://dx3xb.com">
          {t.back}
        </a>
        <button className="langbtn" onClick={toggleLang} aria-label="switch language">
          {t.langBtn}
        </button>
      </div>

      <section className="heroLab">
        <div>
          <p className="labKicker">{t.readyKicker}</p>
          <h1 className="pixel title">{t.readyTitle}</h1>
        </div>
        <div className="scope" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      {phase === "ready" && (
        <section className="panel introPanel">
          <p className="introText">{t.readyDesc}</p>
          {challengeScore > 0 && <div className="challengeNotice">{t.challengeNotice(challengeScore)}</div>}
          <div className="rules">
            <div>
              <b>60s</b>
              <span>{t.rules.time}</span>
            </div>
            <div>
              <b>ΔE</b>
              <span>{t.rules.delta}</span>
            </div>
            <div>
              <b>Seed</b>
              <span>{t.rules.seed}</span>
            </div>
          </div>
          <div className="actions">
            <button className="btn coral" onClick={() => start(seed)}>
              {t.start}
            </button>
            <button className="btn ghost" onClick={nextRandomGame}>
              {t.newSeed}
            </button>
          </div>
        </section>
      )}

      {phase === "playing" && (
        <>
          <section className="hud" aria-label="game status">
            <div>
              <span>LEVEL</span>
              <b>{level > MAX_VISIBLE_LEVEL ? `${MAX_VISIBLE_LEVEL}+` : level}</b>
            </div>
            <div>
              <span>TIME</span>
              <b>{timeLeft}s</b>
            </div>
            <div>
              <span>SCORE</span>
              <b>{score}</b>
            </div>
            <div>
              <span>COMBO</span>
              <b>{combo}</b>
            </div>
          </section>

          <section className="gamePanel">
            <div className="roundMeta">
              <span>{round.size}x{round.size}</span>
              <span>ΔE ≈ {round.delta}</span>
              <span>{t.modes[round.mode]}</span>
            </div>
            <div
              className="swatchGrid"
              style={{ gridTemplateColumns: `repeat(${round.size}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: round.size * round.size }).map((_, index) => (
                <button
                  key={`${level}-${index}`}
                  className="swatch"
                  style={{ background: index === round.targetIndex ? round.target : round.base }}
                  aria-label={`color tile ${index + 1}`}
                  onClick={() => choose(index)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {phase === "finished" && (
        <section className="resultShell">
          <div className="reportCard">
            <p className="labKicker">{t.reportKicker}</p>
            <h2 className="pixel resultTitle">{resultTitle}</h2>
            <div className="percent">{currentPct}%</div>
            <p className="beat">{t.beat(currentPct)}</p>
            {challengeScore > 0 && (
              <p className={score >= challengeScore ? "challengeWin" : "challengeLose"}>
                {t.challengeRow}
                {score >= challengeScore ? t.challengeWin : t.challengeLose(challengeScore - score)}
              </p>
            )}

            <div className="reportGrid">
              <div>
                <span>{t.grid.total}</span>
                <b>{score}</b>
              </div>
              <div>
                <span>{t.grid.reached}</span>
                <b>{Math.max(level - 1, 0)}</b>
              </div>
              <div>
                <span>{t.grid.minDelta}</span>
                <b>ΔE {minDelta.toFixed(1)}</b>
              </div>
              <div>
                <span>{t.grid.avg}</span>
                <b>{averageMs ? formatTime(averageMs) : "--"}</b>
              </div>
              <div>
                <span>{t.grid.bestCombo}</span>
                <b>{bestCombo}</b>
              </div>
              <div>
                <span>{t.grid.mistakes}</span>
                <b>{mistakes}</b>
              </div>
            </div>

            <p className="fineprint">
              {t.disclaimer} {t.fineprintTail}
            </p>
          </div>

          <div className="sharePanel">
            <div className="shareInfo">
              <p className="labKicker">{t.shareTitle}</p>
              <p className="shareHint">{t.shareHint}</p>
              <div className="actions">
                <button className="btn coral" onClick={shareResult}>
                  {t.share}
                </button>
                <button className="btn teal" onClick={copyResult}>
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
            <div className="qrBox">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="qrImg" src={qrDataUrl} alt={t.qrAlt} width={160} height={160} />
              ) : (
                <div className="qrImg qrLoading" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="actions resultActions">
            <button className="btn ghost" onClick={() => start(seed)}>
              {t.sameSeed}
            </button>
            <button className="btn ghost" onClick={nextRandomGame}>
              {t.newSeed}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
