"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "ready" | "preview" | "input" | "naming" | "finished";
type Tile = {
  icon: string;
  color: string;
};

const TOTAL_TIME = 60;
const NAME_MAX = 16;
const TILES: Tile[] = [
  { icon: "◆", color: "#ff5f57" },
  { icon: "●", color: "#12b7a6" },
  { icon: "▲", color: "#ffd044" },
  { icon: "■", color: "#4564ff" },
  { icon: "✦", color: "#61c96f" },
  { icon: "✚", color: "#ff8ab3" },
  { icon: "⬟", color: "#8d6cff" },
  { icon: "✹", color: "#ff9f1c" },
  { icon: "◇", color: "#58c7ff" },
  { icon: "⬢", color: "#9bd84c" },
  { icon: "✕", color: "#f97068" },
  { icon: "◉", color: "#2ec4b6" },
  { icon: "▰", color: "#f6c85f" },
  { icon: "✧", color: "#7a9cff" },
  { icon: "⬥", color: "#d86cff" },
  { icon: "★", color: "#ffc857" },
];

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

function makeSeed() {
  return `mem-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function getSeedFromUrl() {
  if (typeof window === "undefined") return "dx3xb-memory";
  const seed = new URLSearchParams(window.location.search).get("seed");
  return seed && seed.length < 80 ? seed : makeSeed();
}

function sanitizeName(input: string) {
  return input.replace(/[\u0000-\u001f<>]/g, "").slice(0, NAME_MAX);
}

function makeSequence(seed: string, level: number) {
  const rand = mulberry32(hashString(`${seed}:instant-memory:${level}`));
  const length = clamp(3 + Math.floor((level - 1) / 2), 3, 14);
  const boardSize = level >= 12 ? 16 : level >= 6 ? 12 : 9;
  const sequence: number[] = [];

  for (let i = 0; i < length; i += 1) {
    let next = Math.floor(rand() * boardSize);
    if (sequence.length > 0 && next === sequence[sequence.length - 1]) {
      next = (next + 1 + Math.floor(rand() * (boardSize - 1))) % boardSize;
    }
    sequence.push(next);
  }

  return { boardSize, length, sequence };
}

function percentile(score: number, longest: number, accuracy: number, mistakes: number) {
  const raw = 18 + score / 115 + longest * 4.6 + accuracy * 21 - mistakes * 3.2;
  return Math.round(clamp(raw, 7, 99));
}

function titleFor(pct: number) {
  if (pct >= 97) return "瞬记怪物";
  if (pct >= 85) return "脑内硬盘";
  if (pct >= 62) return "记忆雷达";
  if (pct >= 32) return "普通人类";
  return "缓存过载";
}

function formatMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function InstantMemory() {
  const [seed, setSeed] = useState("dx3xb-memory");
  const [phase, setPhase] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [longest, setLongest] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [roundStartedAt, setRoundStartedAt] = useState(Date.now());
  const [solveTimes, setSolveTimes] = useState<number[]>([]);
  const [challengeScore, setChallengeScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const round = useMemo(() => makeSequence(seed, level), [seed, level]);
  const accuracy = rounds > 0 ? correctRounds / rounds : 0;
  const pct = percentile(score, longest, accuracy, mistakes);
  const title = titleFor(pct);
  const avgSolve =
    solveTimes.length > 0 ? solveTimes.reduce((sum, item) => sum + item, 0) / solveTimes.length : 0;

  useEffect(() => {
    setSeed(getSeedFromUrl());
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
    const storedName = window.localStorage.getItem("dx3xb_name");
    if (storedName) {
      const clean = sanitizeName(storedName);
      setNameDraft(clean);
      setPlayerName(clean);
    }
  }, []);

  useEffect(() => {
    if (phase !== "preview" && phase !== "input") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setPhase("naming");
          setActiveIndex(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "preview") return;
    let cancelled = false;
    setInput([]);
    setActiveIndex(null);

    const runPreview = async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      for (const index of round.sequence) {
        if (cancelled) return;
        setActiveIndex(index);
        await new Promise((resolve) => window.setTimeout(resolve, 430));
        setActiveIndex(null);
        await new Promise((resolve) => window.setTimeout(resolve, 145));
      }
      if (!cancelled) {
        setRoundStartedAt(Date.now());
        setPhase("input");
      }
    };

    runPreview();
    return () => {
      cancelled = true;
    };
  }, [phase, round.sequence]);

  function start(nextSeed = seed) {
    setSeed(nextSeed);
    setPhase("preview");
    setLevel(1);
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setMistakes(0);
    setRounds(0);
    setCorrectRounds(0);
    setLongest(0);
    setActiveIndex(null);
    setInput([]);
    setSolveTimes([]);
    setCopied(false);
  }

  function newGame() {
    const next = makeSeed();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${window.location.pathname}?seed=${encodeURIComponent(next)}`);
    }
    start(next);
  }

  function finishRound(success: boolean) {
    setRounds((prev) => prev + 1);
    if (success) {
      const solvedMs = Date.now() - roundStartedAt;
      const nextCombo = combo + 1;
      const speedBonus = clamp(260 - solvedMs / 18, 35, 260);
      const roundScore = Math.round(90 + round.length * 32 + speedBonus + nextCombo * 22);
      setScore((prev) => prev + roundScore);
      setCorrectRounds((prev) => prev + 1);
      setCombo(nextCombo);
      setBestCombo((prev) => Math.max(prev, nextCombo));
      setLongest((prev) => Math.max(prev, round.length));
      setSolveTimes((prev) => [...prev, solvedMs]);
    } else {
      setMistakes((prev) => prev + 1);
      setCombo(0);
      setScore((prev) => Math.max(0, prev - 45));
      setTimeLeft((prev) => Math.max(0, prev - 3));
    }

    setInput([]);
    setActiveIndex(null);
    setLevel((prev) => prev + 1);
    window.setTimeout(() => {
      setPhase((current) => (current === "naming" || timeLeft <= 0 ? current : "preview"));
    }, 260);
  }

  function choose(index: number) {
    if (phase !== "input") return;
    const expected = round.sequence[input.length];
    if (index !== expected) {
      finishRound(false);
      return;
    }
    const nextInput = [...input, index];
    setInput(nextInput);
    if (nextInput.length === round.sequence.length) {
      finishRound(true);
    }
  }

  function saveName() {
    const clean = sanitizeName(nameDraft).trim() || "匿名玩家";
    setPlayerName(clean);
    try {
      window.localStorage.setItem("dx3xb_name", clean);
    } catch {
      /* ignore */
    }
    setPhase("finished");
  }

  function challengeUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("score", String(score));
    url.searchParams.set("from", playerName || "匿名玩家");
    return url.toString();
  }

  function reportText() {
    const name = playerName || "匿名玩家";
    return `我「${name}」在 dx3xb 瞬间记忆拿到 ${score} 分，${title}，打败了 ${pct}% 的玩家，最长记住 ${longest} 位序列。来挑战同一套题：${challengeUrl()}`;
  }

  async function shareResult() {
    const text = reportText();
    try {
      if (navigator.share) {
        await navigator.share({ title: "瞬间记忆挑战", text, url: challengeUrl() });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* user cancelled */
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

  const boardCols = round.boardSize === 9 ? 3 : 4;

  return (
    <main className="wrap">
      <div className="backbar">
        <a className="backbtn" href="https://dx3xb.com">
          ← dx3xb
        </a>
      </div>

      <section className="heroLab">
        <div>
          <p className="labKicker">instant memory / dx3xb lab toy</p>
          <h1 className="pixel title">瞬间记忆</h1>
        </div>
        <div className="memoryIcon" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      {phase === "ready" && (
        <section className="panel introPanel">
          <p className="introText">屏幕会按顺序闪现一串符号。记住它们，再按同样顺序点回来。</p>
          {challengeScore > 0 && (
            <div className="challengeNotice">有人留下了 {challengeScore} 分的同题挑战。超过 ta，战报更好看。</div>
          )}
          <div className="rules">
            <div>
              <b>60s</b>
              <span>限时</span>
            </div>
            <div>
              <b>SEQ</b>
              <span>序列递增</span>
            </div>
            <div>
              <b>Seed</b>
              <span>同题挑战</span>
            </div>
          </div>
          <div className="actions">
            <button className="btn coral" onClick={() => start(seed)}>
              开始测试
            </button>
            <button className="btn ghost" onClick={newGame}>
              换一套题
            </button>
          </div>
        </section>
      )}

      {(phase === "preview" || phase === "input") && (
        <>
          <section className="hud" aria-label="game status">
            <div>
              <span>LEVEL</span>
              <b>{level}</b>
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
              <span>{round.length} 位序列</span>
              <span>{phase === "preview" ? "记住闪现顺序" : `输入 ${input.length}/${round.length}`}</span>
            </div>
            <div className="progressDots" aria-label="input progress">
              {round.sequence.map((_, index) => (
                <span key={index} className={index < input.length ? "done" : ""} />
              ))}
            </div>
            <div className="memoryGrid" style={{ gridTemplateColumns: `repeat(${boardCols}, minmax(0, 1fr))` }}>
              {Array.from({ length: round.boardSize }).map((_, index) => {
                const tile = TILES[index % TILES.length];
                const isActive = activeIndex === index;
                const wasPressed = input.includes(index);
                return (
                  <button
                    key={`${level}-${index}`}
                    className={`memoryTile ${isActive ? "active" : ""} ${wasPressed ? "pressed" : ""}`}
                    style={{ "--tile-color": tile.color } as React.CSSProperties}
                    aria-label={`memory tile ${index + 1}`}
                    disabled={phase !== "input"}
                    onClick={() => choose(index)}
                  >
                    <span>{tile.icon}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {phase === "naming" && (
        <section className="panel introPanel">
          <p className="labKicker">dx3xb memory report</p>
          <h2 className="pixel smallTitle">给战报署名</h2>
          <p className="introText">这个名字会出现在挑战链接里，朋友知道是谁发起的。</p>
          <input
            className="nameInput"
            maxLength={NAME_MAX}
            value={nameDraft}
            placeholder="你的称呼"
            onChange={(event) => setNameDraft(sanitizeName(event.target.value))}
          />
          <div className="actions">
            <button className="btn teal" onClick={saveName}>
              生成战报
            </button>
          </div>
        </section>
      )}

      {phase === "finished" && (
        <section className="resultShell">
          <div className="reportCard">
            <p className="labKicker">dx3xb 短时记忆报告</p>
            <h2 className="pixel resultTitle">{title}</h2>
            <div className="percent">{pct}%</div>
            <p className="beat">你打败了 {pct}% 的玩家</p>
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
                <span>通过关卡</span>
                <b>{correctRounds}</b>
              </div>
              <div>
                <span>最长序列</span>
                <b>{longest}</b>
              </div>
              <div>
                <span>准确率</span>
                <b>{Math.round(accuracy * 100)}%</b>
              </div>
              <div>
                <span>平均复原</span>
                <b>{formatMs(avgSolve)}</b>
              </div>
              <div>
                <span>失误</span>
                <b>{mistakes}</b>
              </div>
            </div>
            <p className="fineprint">娱乐短时记忆测试，不作为医学或心理诊断。当前百分位为第一版估算。</p>
          </div>

          <div className="actions resultActions">
            <button className="btn coral" onClick={shareResult}>
              发起挑战
            </button>
            <button className="btn teal" onClick={copyResult}>
              {copied ? "已复制" : "复制战报"}
            </button>
            <button className="btn ghost" onClick={() => start(seed)}>
              同题复战
            </button>
            <button className="btn ghost" onClick={newGame}>
              换一套题
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
