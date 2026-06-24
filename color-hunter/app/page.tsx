"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "ready" | "playing" | "finished";
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
  disclaimer: "娱乐视觉测试，不作为医学色觉诊断。",
};

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

function titleFor(pct: number) {
  if (pct >= 97) return "印刷厂老板";
  if (pct >= 85) return "鹰眼玩家";
  if (pct >= 60) return "设计师眼睛";
  if (pct >= 30) return "正常观察者";
  return "色弱警报";
}

function formatTime(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function ColorHunter() {
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

  useEffect(() => {
    setSeed(getSeedFromUrl());
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
  }, []);

  const round = useMemo(() => makeRound(seed, level), [seed, level]);
  const currentPct = percentile(score, Math.max(level - 1, 1), minDelta, mistakes);
  const resultTitle = titleFor(currentPct);
  const averageMs =
    reactionTimes.length > 0 ? reactionTimes.reduce((sum, item) => sum + item, 0) / reactionTimes.length : 0;

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
      window.history.replaceState(null, "", `${window.location.pathname}?seed=${encodeURIComponent(nextSeed)}`);
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

  function challengeUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("score", String(score));
    url.searchParams.set("pct", String(currentPct));
    return url.toString();
  }

  function reportText() {
    return `我在 dx3xb 色差猎人拿到 ${score} 分，${resultTitle}，打败了 ${currentPct}% 的玩家。最小识别色差 ΔE ${minDelta.toFixed(
      1,
    )}。来挑战同一套题：${challengeUrl()}`;
  }

  async function shareResult() {
    const text = reportText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "色差猎人挑战", text, url: challengeUrl() });
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
          {COPY.back}
        </a>
      </div>

      <section className="heroLab">
        <div>
          <p className="labKicker">{COPY.readyKicker}</p>
          <h1 className="pixel title">{COPY.readyTitle}</h1>
        </div>
        <div className="scope" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      {phase === "ready" && (
        <section className="panel introPanel">
          <p className="introText">{COPY.readyDesc}</p>
          {challengeScore > 0 && (
            <div className="challengeNotice">
              有人留下了 {challengeScore} 分的同题挑战。超过他，战报会更好看。
            </div>
          )}
          <div className="rules">
            <div>
              <b>60s</b>
              <span>限时</span>
            </div>
            <div>
              <b>ΔE</b>
              <span>色差递减</span>
            </div>
            <div>
              <b>Seed</b>
              <span>同题挑战</span>
            </div>
          </div>
          <div className="actions">
            <button className="btn coral" onClick={() => start(seed)}>
              {COPY.start}
            </button>
            <button className="btn ghost" onClick={nextRandomGame}>
              {COPY.newSeed}
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
              <span>{round.mode}</span>
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
            <p className="labKicker">DX3XB VISION REPORT</p>
            <h2 className="pixel resultTitle">{resultTitle}</h2>
            <div className="percent">{currentPct}%</div>
            <p className="beat">你打败了 {currentPct}% 的玩家</p>
            {challengeScore > 0 && (
              <p className={score >= challengeScore ? "challengeWin" : "challengeLose"}>
                同题挑战：{score >= challengeScore ? "已超过对方" : `还差 ${challengeScore - score} 分`}
              </p>
            )}

            <div className="reportGrid">
              <div>
                <span>总分</span>
                <b>{score}</b>
              </div>
              <div>
                <span>到达关卡</span>
                <b>{Math.max(level - 1, 0)}</b>
              </div>
              <div>
                <span>最小色差</span>
                <b>ΔE {minDelta.toFixed(1)}</b>
              </div>
              <div>
                <span>平均反应</span>
                <b>{averageMs ? formatTime(averageMs) : "--"}</b>
              </div>
              <div>
                <span>最高连击</span>
                <b>{bestCombo}</b>
              </div>
              <div>
                <span>失误</span>
                <b>{mistakes}</b>
              </div>
            </div>

            <p className="fineprint">{COPY.disclaimer} 当前百分位为第一版估算，后续接入真实玩家分布。</p>
          </div>

          <div className="actions resultActions">
            <button className="btn coral" onClick={shareResult}>
              {COPY.share}
            </button>
            <button className="btn teal" onClick={copyResult}>
              {copied ? COPY.copied : COPY.copy}
            </button>
            <button className="btn ghost" onClick={() => start(seed)}>
              {COPY.sameSeed}
            </button>
            <button className="btn ghost" onClick={nextRandomGame}>
              {COPY.newSeed}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
