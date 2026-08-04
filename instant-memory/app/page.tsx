"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { TrioFooter, ensureSession, getTrioProfile } from "./dx3xb-trio";

type Phase = "ready" | "preview" | "input" | "naming" | "finished";
type Lang = "zh" | "en";
type Tile = {
  icon: string;
  color: string;
};
type TapFeedback = {
  kind: "correct" | "wrong";
  index: number;
  expected?: number;
  done?: boolean;
};

const TOTAL_TIME = 60;
const NAME_MAX = 24;
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

const COPY = {
  zh: {
    readyTitle: "瞬间记忆",
    readyKicker: "instant memory / dx3xb lab toy",
    readyDesc: "屏幕会按顺序闪现一串符号。记住它们，再按同样顺序点回来。越往后序列越长。",
    start: "开始测试",
    sameSeed: "同题复战",
    newSeed: "换一套题",
    share: "发起挑战",
    copy: "复制战报",
    copied: "已复制",
    download: "下载报告图片",
    back: "← dx3xb",
    langBtn: "EN",
    disclaimer: "娱乐短时记忆测试，不作为医学或心理诊断。",
    fineprintTail: "当前百分位为第一版估算，后续接入真实玩家分布。",
    challengeNotice: (name: string, s: number) =>
      name
        ? `${name} 留下了 ${s} 分的同题挑战，超过 ta 战报会更好看。`
        : `有人留下了 ${s} 分的同题挑战。超过他，战报会更好看。`,
    rules: { time: "限时", seq: "序列递增", seed: "同题挑战" },
    seqLabel: (n: number) => `${n} 位序列`,
    previewHint: "记住闪现顺序",
    inputHint: (i: number, n: number) => `输入 ${i}/${n}`,
    feedback: {
      correct: "对了",
      roundClear: "本轮通过",
      wrong: "错了",
      expected: (n: number) => `正确是第 ${n} 格`,
    },
    namingTitle: "给自己起个称呼",
    namingHint: "这个称呼会印在战报上，也会进挑战链接，朋友知道是谁发起的。",
    namingPlaceholder: "你的称呼",
    generate: "生成战报",
    anon: "匿名玩家",
    reportKicker: "dx3xb 短时记忆报告",
    verdictLead: (name: string, pct: number) =>
      pct >= 62 ? `「${name}」的脑内硬盘，堪比` : `「${name}」的记忆力，鉴定为`,
    beat: (p: number) => `你打败了 ${p}% 的玩家`,
    challengeRow: "同题挑战：",
    challengeWin: "已超过对方",
    challengeLose: (d: number) => `还差 ${d} 分`,
    grid: {
      total: "总分",
      passed: "通过关卡",
      longest: "最长序列",
      accuracy: "准确率",
      avg: "平均复原",
      mistakes: "失误",
    },
    shareTitle: "扫码接受挑战",
    qrCaption: "用手机扫码，挑战同一套题。",
    qrAlt: "同题挑战二维码",
    nativeShareTitle: "瞬间记忆挑战",
    titles: ["缓存过载", "普通人类", "记忆雷达", "脑内硬盘", "瞬记怪物"],
    reportText: (name: string, score: number, title: string, pct: number, longest: number, url: string) =>
      `我「${name}」在 dx3xb 瞬间记忆拿到 ${score} 分，${title}，打败了 ${pct}% 的玩家，最长记住 ${longest} 位序列。来挑战同一套题：${url}`,
  },
  en: {
    readyTitle: "instant memory",
    readyKicker: "instant memory / dx3xb lab toy",
    readyDesc:
      "Symbols flash on the board in order. Memorize them, then tap them back in the exact same order — the sequence keeps growing.",
    start: "START TEST",
    sameSeed: "REPLAY SAME",
    newSeed: "NEW PUZZLE",
    share: "CHALLENGE",
    copy: "COPY REPORT",
    copied: "COPIED",
    download: "SAVE IMAGE",
    back: "← dx3xb",
    langBtn: "中",
    disclaimer: "A fun short-term-memory test, not a medical or psychological diagnosis.",
    fineprintTail: "This percentile is a first-pass estimate; real player distribution coming soon.",
    challengeNotice: (name: string, s: number) =>
      name
        ? `${name} left a ${s}-point challenge on this puzzle. Beat them for a better report.`
        : `Someone left a ${s}-point challenge on this puzzle. Beat it for a better report.`,
    rules: { time: "TIME LIMIT", seq: "LONGER SEQ", seed: "SAME PUZZLE" },
    seqLabel: (n: number) => `${n}-symbol sequence`,
    previewHint: "memorize the flashes",
    inputHint: (i: number, n: number) => `tap ${i}/${n}`,
    feedback: {
      correct: "nice",
      roundClear: "round clear",
      wrong: "miss",
      expected: (n: number) => `tile ${n} was next`,
    },
    namingTitle: "NAME YOUR RUN",
    namingHint: "This name is printed on your report and baked into the challenge link so friends know who dared them.",
    namingPlaceholder: "your name",
    generate: "GENERATE REPORT",
    anon: "anon player",
    reportKicker: "dx3xb memory report",
    verdictLead: (name: string, pct: number) =>
      pct >= 62 ? `${name}'s mental hard drive rivals the` : `${name}'s memory is rated as the`,
    beat: (p: number) => `You beat ${p}% of players`,
    challengeRow: "Same-puzzle duel: ",
    challengeWin: "you took the lead",
    challengeLose: (d: number) => `${d} points to go`,
    grid: {
      total: "SCORE",
      passed: "ROUNDS",
      longest: "LONGEST SEQ",
      accuracy: "ACCURACY",
      avg: "AVG RECALL",
      mistakes: "MISSES",
    },
    shareTitle: "SCAN TO CHALLENGE",
    qrCaption: "Scan with a phone to take the same puzzle.",
    qrAlt: "Same-puzzle challenge QR code",
    nativeShareTitle: "instant memory challenge",
    titles: ["Cache Overload", "Average Human", "Memory Radar", "Brain SSD", "Memory Monster"],
    reportText: (name: string, score: number, title: string, pct: number, longest: number, url: string) =>
      `${name} scored ${score} in dx3xb instant memory — ${title}, beating ${pct}% of players, recalling a ${longest}-symbol sequence. Take the same puzzle: ${url}`,
  },
} satisfies Record<Lang, Record<string, unknown>>;

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
  const stored = window.localStorage.getItem("dx3xb_lang");
  if (stored === "zh" || stored === "en") return stored;
  return "zh";
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

function titleFor(pct: number, titles: readonly string[]) {
  if (pct >= 97) return titles[4];
  if (pct >= 85) return titles[3];
  if (pct >= 62) return titles[2];
  if (pct >= 32) return titles[1];
  return titles[0];
}

function formatMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function InstantMemory() {
  const [lang, setLang] = useState<Lang>("zh");
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
  const [feedback, setFeedback] = useState<TapFeedback | null>(null);
  const [resolving, setResolving] = useState(false);
  const [roundStartedAt, setRoundStartedAt] = useState(Date.now());
  const [solveTimes, setSolveTimes] = useState<number[]>([]);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengerName, setChallengerName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const t = COPY[lang];

  const round = useMemo(() => makeSequence(seed, level), [seed, level]);
  const accuracy = rounds > 0 ? correctRounds / rounds : 0;
  const pct = percentile(score, longest, accuracy, mistakes);
  const title = titleFor(pct, t.titles);
  const avgSolve =
    solveTimes.length > 0 ? solveTimes.reduce((sum, item) => sum + item, 0) / solveTimes.length : 0;
  const feedbackText = feedback
    ? feedback.kind === "correct"
      ? feedback.done
        ? t.feedback.roundClear
        : t.feedback.correct
      : `${t.feedback.wrong} · ${t.feedback.expected((feedback.expected ?? 0) + 1)}`
    : "";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function clearFeedbackTimer() {
    if (feedbackTimerRef.current === null) return;
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = null;
  }

  function showFeedback(next: TapFeedback, duration = 180) {
    clearFeedbackTimer();
    setFeedback(next);
    if (duration > 0) {
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        feedbackTimerRef.current = null;
      }, duration);
    }
  }

  useEffect(() => {
    const initialLang = getInitialLang();
    setLang(initialLang);
    setSeed(getSeedFromUrl());
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
    setChallengerName(sanitizeName(params.get("from") || ""));
    const storedName = window.localStorage.getItem("dx3xb_name");
    if (storedName) setNameDraft(sanitizeName(storedName));

    (async () => {
      await ensureSession();
      const profile = await getTrioProfile();
      const profileName = sanitizeName(profile.handle ?? "").trim();
      const emailName = sanitizeName(profile.email?.split("@")[0] ?? "").trim();
      const automaticName = profileName || emailName;

      if (automaticName) {
        setNameDraft(automaticName);
        setAccountName(automaticName);
      }
      if (!profile.isAnonymous) {
        setIsRegisteredUser(true);
        setPlayerName(automaticName || COPY[initialLang].anon);
      }
    })();
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => clearFeedbackTimer();
  }, []);

  useEffect(() => {
    if (phase !== "naming" || !isRegisteredUser) return;
    const automaticName = sanitizeName(accountName).trim() || t.anon;
    setPlayerName(automaticName);
    try {
      window.localStorage.setItem("dx3xb_name", automaticName);
    } catch {
      /* ignore */
    }
    setCopied(false);
    setPhase("finished");
  }, [accountName, isRegisteredUser, phase, t.anon]);

  function challengeUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    url.searchParams.set("score", String(score));
    url.searchParams.set("lang", lang);
    const name = playerName || accountName;
    if (name) url.searchParams.set("from", name);
    return url.toString();
  }

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
    setFeedback(null);
    setResolving(false);

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

  // 战报页生成真实二维码，指向同题挑战链接
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
  }, [phase, score, seed, pct, lang, playerName]);

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dx3xb_lang", next);
        document.cookie = `dx3xb_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.dx3xb.com; Secure`;
        const url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        window.history.replaceState(null, "", url.toString());
      }
      return next;
    });
  }

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
    setFeedback(null);
    setResolving(false);
    setSolveTimes([]);
    setCopied(false);
  }

  function newGame() {
    const next = makeSeed();
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("seed", next);
      url.searchParams.delete("score");
      url.searchParams.delete("from");
      window.history.replaceState(null, "", url.toString());
    }
    setChallengeScore(0);
    setChallengerName("");
    start(next);
  }

  function finishRound(success: boolean) {
    clearFeedbackTimer();
    setFeedback(null);
    setResolving(false);
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
    if (phase !== "input" || resolving) return;
    const expected = round.sequence[input.length];
    if (index !== expected) {
      setResolving(true);
      showFeedback({ kind: "wrong", index, expected }, 0);
      window.setTimeout(() => finishRound(false), 420);
      return;
    }
    const nextInput = [...input, index];
    setInput(nextInput);
    if (nextInput.length === round.sequence.length) {
      setResolving(true);
      showFeedback({ kind: "correct", index, done: true }, 0);
      window.setTimeout(() => finishRound(true), 300);
      return;
    }
    showFeedback({ kind: "correct", index }, 150);
  }

  function saveName() {
    const clean = sanitizeName(isRegisteredUser ? accountName : nameDraft).trim() || t.anon;
    setPlayerName(clean);
    try {
      window.localStorage.setItem("dx3xb_name", clean);
    } catch {
      /* ignore */
    }
    setCopied(false);
    setPhase("finished");
  }

  function reportText() {
    return t.reportText(reportName, score, title, pct, longest, challengeUrl());
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

  async function downloadReport() {
    const node = reportRef.current;
    if (!node || saving) return;
    setSaving(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "#fffdf8", cacheBust: true });
      const link = document.createElement("a");
      link.download = `dx3xb-instant-memory-${reportName || "report"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      /* capture failed */
    } finally {
      setSaving(false);
    }
  }

  const boardCols = round.boardSize === 9 ? 3 : 4;
  const reportName = playerName || (isRegisteredUser ? accountName : "") || t.anon;

  return (
    <main className="wrap" data-testid="game-root" data-hydrated={hydrated ? "true" : "false"}>
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
        <div className="memoryIcon" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      {phase === "ready" && (
        <section className="panel introPanel">
          <p className="introText">{t.readyDesc}</p>
          {challengeScore > 0 && (
            <div className="challengeNotice">{t.challengeNotice(challengerName, challengeScore)}</div>
          )}
          <div className="rules">
            <div>
              <b>60s</b>
              <span>{t.rules.time}</span>
            </div>
            <div>
              <b>SEQ</b>
              <span>{t.rules.seq}</span>
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
            <button className="btn ghost" onClick={newGame}>
              {t.newSeed}
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
              <span>{t.seqLabel(round.length)}</span>
              <span>{phase === "preview" ? t.previewHint : t.inputHint(input.length, round.length)}</span>
            </div>
            <div
              className={`feedbackStrip ${feedback ? feedback.kind : ""}`}
              aria-live="polite"
              aria-hidden={!feedback}
            >
              {feedbackText || "\u00a0"}
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
                const isCorrectTap = feedback?.kind === "correct" && feedback.index === index;
                const isWrongTap = feedback?.kind === "wrong" && feedback.index === index;
                const isExpected = feedback?.kind === "wrong" && feedback.expected === index;
                return (
                  <button
                    key={`${level}-${index}`}
                    className={`memoryTile ${isActive ? "active" : ""} ${wasPressed ? "pressed" : ""} ${
                      isCorrectTap ? "correct" : ""
                    } ${isWrongTap ? "wrong" : ""} ${isExpected ? "expected" : ""}`}
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
          <p className="labKicker">{t.reportKicker}</p>
          <h2 className="pixel smallTitle">{t.namingTitle}</h2>
          <p className="introText">{t.namingHint}</p>
          <input
            className="nameInput"
            maxLength={NAME_MAX}
            value={nameDraft}
            placeholder={t.namingPlaceholder}
            onChange={(event) => setNameDraft(sanitizeName(event.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
            }}
            autoFocus
          />
          <div className="actions">
            <button className="btn teal" onClick={saveName}>
              {t.generate}
            </button>
          </div>
        </section>
      )}

      {phase === "finished" && (
        <section className="resultShell">
          <div className="reportCard" ref={reportRef}>
            <p className="labKicker">{t.reportKicker}</p>
            <p className="verdictLead">{t.verdictLead(reportName, pct)}</p>
            <h2 className="pixel resultTitle">{title}</h2>
            <div className="percent">{pct}%</div>
            <p className="beat">{t.beat(pct)}</p>
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
                <span>{t.grid.passed}</span>
                <b>{correctRounds}</b>
              </div>
              <div>
                <span>{t.grid.longest}</span>
                <b>{longest}</b>
              </div>
              <div>
                <span>{t.grid.accuracy}</span>
                <b>{Math.round(accuracy * 100)}%</b>
              </div>
              <div>
                <span>{t.grid.avg}</span>
                <b>{formatMs(avgSolve)}</b>
              </div>
              <div>
                <span>{t.grid.mistakes}</span>
                <b>{mistakes}</b>
              </div>
            </div>

            <div className="reportShare">
              <div className="qrBox">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="qrImg" src={qrDataUrl} alt={t.qrAlt} width={150} height={150} />
                ) : (
                  <div className="qrImg qrLoading" aria-hidden="true" />
                )}
              </div>
              <div className="qrText">
                <p className="qrTitle pixel">{t.shareTitle}</p>
                <p className="qrCaption">{t.qrCaption}</p>
                <p className="qrUrl">instant-memory.dx3xb.com</p>
              </div>
            </div>

            <p className="fineprint">
              {t.disclaimer} {t.fineprintTail}
            </p>
          </div>

          <TrioFooter
            game="instant-memory"
            lang={lang}
            run={{
              score,
              pct,
              title,
              lang,
              handle: reportName,
              stats: {
                longest,
                accuracy: Math.round(accuracy * 100),
                bestCombo,
                mistakes,
                correctRounds,
              },
            }}
          />

          <div className="actions resultActions">
            <button className="btn coral" onClick={downloadReport}>
              {t.download}
            </button>
            <button className="btn teal" onClick={shareResult}>
              {t.share}
            </button>
            <button className="btn ghost" onClick={copyResult}>
              {copied ? t.copied : t.copy}
            </button>
            <button className="btn ghost" onClick={() => start(seed)}>
              {t.sameSeed}
            </button>
            <button className="btn ghost" onClick={newGame}>
              {t.newSeed}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
