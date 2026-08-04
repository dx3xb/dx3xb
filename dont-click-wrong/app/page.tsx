"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { TrioFooter, ensureSession, getProfileHandle } from "./dx3xb-trio";

type Shape = "circle" | "square" | "triangle";
type ColorCode = "#e74c3c" | "#3498db" | "#2ecc71" | "#f1c40f";
type Language = "zh" | "en";

interface ShapeData {
  shape: Shape;
  colorCode: ColorCode;
  colorNameZh: string;
  colorNameEn: string;
}

const COLORS: { zh: string; en: string; code: ColorCode }[] = [
  { zh: "红", en: "red", code: "#e74c3c" },
  { zh: "蓝", en: "blue", code: "#3498db" },
  { zh: "绿", en: "green", code: "#2ecc71" },
  { zh: "黄", en: "yellow", code: "#f1c40f" },
];

const SHAPES: { type: Shape; zh: string; en: string }[] = [
  { type: "circle", zh: "圆形", en: "circle" },
  { type: "square", zh: "方形", en: "square" },
  { type: "triangle", zh: "三角形", en: "triangle" },
];

const DICTIONARY = {
  zh: {
    langBtn: "EN",
    back: "← dx3xb",
    title: "不要点错",
    readyKicker: "dx3xb lab / 反应控制测试",
    readyTitle: "不要点错",
    readyDesc: "根据指令快速点击目标！点对加分，点错扣1秒时间，看你能坚持多久？",
    challengeNotice: (name: string, s: number) =>
      name ? `${name} 甩来一张 ${s} 分的同题战书，敢不敢应战？` : `有人留下了 ${s} 分的同题挑战，超过他！`,
    rules: {
      time: "限时",
      penalty: "点错",
      target: "目标"
    },
    start: "开始挑战",
    tagline: "60 秒手眼反应力极限挑战",
    howTitle: "怎么玩",
    demoInstruction: "点击红色的圆形",
    demoHint: "指令千变万化，看清颜色和形状再下手——点错倒扣时间！",
    issuedTo: "签发给",
    rankLabel: "称号",
    beatCaption: "本局估算超过的玩家比例",
    percentileNote: "娱乐性估算，不代表真实玩家分布，也不用于评价个人能力。",
    choiceGroup: "图形选项",
    correctFeedback: "点对了，下一题。",
    wrongFeedback: "点错了，扣一秒。",
    perSec: "每秒命中",
    qrCta: "扫码应战，看朋友能不能超过你",
    time: "时间",
    score: "得分",
    gameOver: "游戏结束",
    generating: "生成大脑报告",
    namingHint: "输入你的代号，生成这局的趣味反应报告",
    namingPlaceholder: "例如：无敌暴龙神",
    viewReport: "查看战报",
    anonPlayer: "匿名玩家",
    reportKicker: "dx3xb brain report",
    beatPct1: "玩家",
    beatPct2: "的反应力击败了",
    beatPct3: "的人类",
    reportFinalScore: "最终得分",
    reportTimeLeft: "剩余时间",
    reportGame: "测试项目",
    qrScan: "扫码挑战我",
    saving: "保存中...",
    saveBtn: "下载战报长图",
    shareBtn: "分享给朋友",
    copied: "已复制！",
    copyBtn: "复制战报文字",
    retry: "再玩一次",
    home: "返回主页"
  },
  en: {
    langBtn: "中",
    back: "← dx3xb",
    title: "Don't Tap Wrong",
    readyKicker: "dx3xb lab / Reaction Control Test",
    readyTitle: "Don't Tap Wrong",
    readyDesc: "Tap the correct shape fast! +1 point per hit, -1s per mistake.",
    challengeNotice: (name: string, s: number) =>
      name ? `${name} left a ${s}-point same-puzzle challenge. Beat it!` : `Someone left a ${s}-point same-puzzle challenge. Beat it!`,
    rules: {
      time: "Time Limit",
      penalty: "Mistake",
      target: "Goal"
    },
    start: "START",
    tagline: "A 60-second hand-eye reaction challenge",
    howTitle: "HOW IT WORKS",
    demoInstruction: "Tap the red circle",
    demoHint: "Instructions keep flipping — read the color AND shape before you tap. Wrong taps cost time!",
    issuedTo: "ISSUED TO",
    rankLabel: "RANK",
    beatCaption: "estimated player percentile for this run",
    percentileNote: "For entertainment only. This is an estimate, not a real player distribution or an ability assessment.",
    choiceGroup: "Shape choices",
    correctFeedback: "Correct. Next instruction.",
    wrongFeedback: "Wrong choice. One second deducted.",
    perSec: "HITS / SEC",
    qrCta: "Scan to duel — can your friends beat you?",
    time: "Time",
    score: "Score",
    gameOver: "Game Over",
    generating: "Brain Report",
    namingHint: "Enter your codename to generate a playful reaction report",
    namingPlaceholder: "e.g. Invincible T-Rex",
    viewReport: "View Report",
    anonPlayer: "Anonymous",
    reportKicker: "dx3xb brain report",
    beatPct1: "Player",
    beatPct2: "beat",
    beatPct3: "of humanity",
    reportFinalScore: "Final Score",
    reportTimeLeft: "Time Left",
    reportGame: "Test Subject",
    qrScan: "Scan to challenge",
    saving: "Saving...",
    saveBtn: "SAVE REPORT IMAGE",
    shareBtn: "SHARE WITH FRIENDS",
    copied: "COPIED!",
    copyBtn: "COPY RESULT TEXT",
    retry: "PLAY AGAIN",
    home: "BACK TO HOME"
  }
};

const getRank = (pct: number, lang: Language) => {
  if (pct >= 95) return {
    title: lang === "zh" ? "神经元霸主" : "Neuron Overlord",
    desc: lang === "zh" ? "大脑运算速度已超越人类极限。" : "Brain processing speed beyond human limits."
  };
  if (pct >= 90) return {
    title: lang === "zh" ? "闪电侠本侠" : "Lightning Incarnate",
    desc: lang === "zh" ? "你的手速让光都显得迟钝。" : "Your hand speed makes light look slow."
  };
  if (pct >= 85) return {
    title: lang === "zh" ? "人形节拍器" : "Human Metronome",
    desc: lang === "zh" ? "精准得像一块瑞士机械表。" : "As precise as a Swiss mechanical watch."
  };
  if (pct >= 80) return {
    title: lang === "zh" ? "绝地特工" : "Secret Agent",
    desc: lang === "zh" ? "建议立刻去申请成为超级英雄。" : "Apply to be a superhero immediately."
  };
  if (pct >= 75) return {
    title: lang === "zh" ? "无情点按机" : "Ruthless Tapper",
    desc: lang === "zh" ? "大脑与手指之间实现了零延迟通讯。" : "Zero-latency comms between brain and fingers."
  };
  if (pct >= 70) return {
    title: lang === "zh" ? "职业预备役" : "Pro Reserve",
    desc: lang === "zh" ? "手眼协调能力令人瞩目，建议去打电竞。" : "Impressive hand-eye coordination. Go pro."
  };
  if (pct >= 65) return {
    title: lang === "zh" ? "敏捷的猎豹" : "Agile Cheetah",
    desc: lang === "zh" ? "反射神经远超平均水平。" : "Reflexes far above average."
  };
  if (pct >= 60) return {
    title: lang === "zh" ? "专注力达人" : "Focus Master",
    desc: lang === "zh" ? "在错乱中依然能保持清醒。" : "Stays awake even in chaos."
  };
  if (pct >= 55) return {
    title: lang === "zh" ? "普通人类巅峰" : "Peak Human",
    desc: lang === "zh" ? "你的反应力达到了人类的平均水准上限。" : "Reached the upper limit of average humans."
  };
  if (pct >= 50) return {
    title: lang === "zh" ? "凡骨" : "Mortal Bone",
    desc: lang === "zh" ? "普普通通，毫无波澜，你是个标准的正常人。" : "Perfectly average. You are a standard normal person."
  };
  if (pct >= 45) return {
    title: lang === "zh" ? "延迟生物" : "High Ping Being",
    desc: lang === "zh" ? "你的神经电信号可能在半路迷路了。" : "Your nerve signals might have gotten lost."
  };
  if (pct >= 40) return {
    title: lang === "zh" ? "树懒亲戚" : "Sloth Relative",
    desc: lang === "zh" ? "反射弧绕地球一圈，建议喝杯咖啡。" : "Reflex arc circled the earth. Have some coffee."
  };
  if (pct >= 35) return {
    title: lang === "zh" ? "手忙脚乱" : "Button Juggler",
    desc: lang === "zh" ? "颜色和形状同时排队，大脑临时堵车。" : "Colors and shapes queued up at the same time."
  };
  if (pct >= 30) return {
    title: lang === "zh" ? "懵逼果实" : "Confused Fruit",
    desc: lang === "zh" ? "你的眼睛看到了，但你的手表示“我没看到”。" : "Eyes saw it, hands said 'nope'."
  };
  if (pct >= 25) return {
    title: lang === "zh" ? "注意力出走" : "Focus Wanderer",
    desc: lang === "zh" ? "注意力刚刚去外太空兜了一圈。" : "Your focus took a quick trip to outer space."
  };
  if (pct >= 20) return {
    title: lang === "zh" ? "慢半拍选手" : "One Beat Behind",
    desc: lang === "zh" ? "答案到了，手指还在路上。" : "The answer arrived before your finger did."
  };
  if (pct >= 15) return {
    title: lang === "zh" ? "方向感离线" : "Compass Offline",
    desc: lang === "zh" ? "每个选项看起来都像正确答案。" : "Every option briefly looked like the right one."
  };
  if (pct >= 10) return {
    title: lang === "zh" ? "加载中玩家" : "Still Loading",
    desc: lang === "zh" ? "反应模块正在缓慢启动，请稍候。" : "Reaction module is booting. Please wait."
  };
  if (pct >= 5) return {
    title: lang === "zh" ? "史莱姆转世" : "Slime Reborn",
    desc: lang === "zh" ? "你的思考速度堪比一坨史莱姆。" : "Thinking speed of a blob of slime."
  };
  return {
    title: lang === "zh" ? "量子犹豫者" : "Quantum Hesitator",
    desc: lang === "zh" ? "每次决定都在平行宇宙里绕了个弯。" : "Every decision took a detour through a parallel universe."
  };
};

const PixelSquare = ({ color }: { color: string }) => (
  <svg viewBox="0 0 10 10" width="80%" height="80%" style={{ shapeRendering: "crispEdges" }}>
    <rect x="1" y="1" width="8" height="8" fill={color} stroke="#000" strokeWidth="1"/>
  </svg>
);

const PixelCircle = ({ color }: { color: string }) => (
  <svg viewBox="0 0 10 10" width="80%" height="80%" style={{ shapeRendering: "crispEdges" }}>
    <path d="M3,1 H7 V2 H8 V3 H9 V7 H8 V8 H7 V9 H3 V8 H2 V7 H1 V3 H2 V2 H3 Z" fill={color} stroke="#000" strokeWidth="1" strokeLinejoin="miter" />
  </svg>
);

const PixelTriangle = ({ color }: { color: string }) => (
  <svg viewBox="0 0 10 10" width="80%" height="80%" style={{ shapeRendering: "crispEdges" }}>
    <path d="M4,1 H6 V2 H7 V4 H8 V6 H9 V9 H1 V6 H2 V4 H3 V2 H4 Z" fill={color} stroke="#000" strokeWidth="1" strokeLinejoin="miter" />
  </svg>
);

const SITE = "https://dont-click-wrong.dx3xb.com";
const SEED_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function normalizeSeed(value: string | null) {
  return value && SEED_PATTERN.test(value) ? value : "";
}

function createSeed() {
  try {
    const values = new Uint32Array(2);
    window.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(36)).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function createSeededRandom(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)]!;
}

function optionLabel(option: ShapeData, lang: Language, index: number) {
  const shape = SHAPES.find((candidate) => candidate.type === option.shape);
  const color = lang === "zh" ? option.colorNameZh : option.colorNameEn;
  const shapeName = lang === "zh" ? shape?.zh : shape?.en;
  return lang === "zh"
    ? `选项 ${index + 1}：${color}色${shapeName ?? option.shape}`
    : `Option ${index + 1}: ${color} ${shapeName ?? option.shape}`;
}

function getInitialLang(): Language {
  if (typeof window === "undefined") return "zh";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
  const stored = window.localStorage.getItem("dx3xb_lang");
  if (stored === "zh" || stored === "en") return stored;
  return "zh";
}

export default function DontClickWrong() {
  const [lang, setLang] = useState<Language>("zh");
  const t = DICTIONARY[lang];

  const [phase, setPhase] = useState<"idle" | "playing" | "naming" | "finished">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [instruction, setInstruction] = useState("");
  const [options, setOptions] = useState<ShapeData[]>([]);
  const [targetCondition, setTargetCondition] = useState<(s: ShapeData) => boolean>(() => () => false);

  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [playerName, setPlayerName] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [beatPct, setBeatPct] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengerName, setChallengerName] = useState("");
  const [runSeed, setRunSeed] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownNameRef = useRef("");
  const challengeSeedRef = useRef("");
  const scoreRef = useRef(0);
  const randomRef = useRef<() => number>(() => 0.5);

  const finishGame = useCallback(() => {
    if (knownNameRef.current) setPlayerName(knownNameRef.current);
    const finalScore = scoreRef.current;
    setBeatPct(finalScore === 0 ? 3 : Math.min(99, Math.round(12 + finalScore * 1.7)));
    setPhase("naming");
  }, []);

  useEffect(() => {
    setLang(getInitialLang());
    void ensureSession(); // 首访即建匿名会话（跨子域 cookie）
    getProfileHandle().then((h) => {
      if (h) knownNameRef.current = h.replace(/[ -<>]/g, "").slice(0, 10);
    });
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
    setChallengerName((params.get("from") || "").replace(/[\u0000-\u001f<>]/g, "").slice(0, 16));
    challengeSeedRef.current = normalizeSeed(params.get("seed"));
    setHydrated(true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      finishGame();
      return;
    }
    timerRef.current = setTimeout(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [finishGame, phase, timeLeft]);

  const generateRound = () => {
    const random = randomRef.current;
    const r = random();
    let condition: (s: ShapeData) => boolean = () => false;
    let text = "";

    const randColor = pick(COLORS, random);
    const randShape = pick(SHAPES, random);

    if (r < 0.33) {
      text = lang === "zh" ? `点击${randColor.zh}色的${randShape.zh}` : `Tap the ${randColor.en} ${randShape.en}`;
      condition = (s) => s.colorCode === randColor.code && s.shape === randShape.type;
    } else if (r < 0.66) {
      text = lang === "zh" ? `点击不是${randColor.zh}色的${randShape.zh}` : `Tap the ${randShape.en} that is NOT ${randColor.en}`;
      condition = (s) => s.colorCode !== randColor.code && s.shape === randShape.type;
    } else {
      text = lang === "zh" ? `点击${randColor.zh}色，但不是${randShape.zh}的图形` : `Tap the ${randColor.en} shape that is NOT a ${randShape.en}`;
      condition = (s) => s.colorCode === randColor.code && s.shape !== randShape.type;
    }

    setInstruction(text);
    setTargetCondition(() => condition);

    const newOptions: ShapeData[] = [];
    let hasCorrect = false;

    for (let i = 0; i < 4; i++) {
      const c = pick(COLORS, random);
      const s = pick(SHAPES, random);
      const shapeData = { shape: s.type, colorCode: c.code, colorNameZh: c.zh, colorNameEn: c.en };
      newOptions.push(shapeData);
      if (condition(shapeData)) {
        hasCorrect = true;
      }
    }

    if (!hasCorrect) {
      let matchFound = false;
      for(let iter=0; iter<50; iter++) {
        const testColor = pick(COLORS, random);
        const testShape = pick(SHAPES, random);
        if (condition({shape: testShape.type, colorCode: testColor.code, colorNameZh: testColor.zh, colorNameEn: testColor.en})) {
            newOptions[Math.floor(random() * 4)] = {shape: testShape.type, colorCode: testColor.code, colorNameZh: testColor.zh, colorNameEn: testColor.en};
            matchFound = true;
            break;
        }
      }
      if (!matchFound) {
        text = lang === "zh" ? `点击${COLORS[0].zh}色的${SHAPES[0].zh}` : `Tap the ${COLORS[0].en} ${SHAPES[0].en}`;
        condition = (s) => s.colorCode === COLORS[0].code && s.shape === SHAPES[0].type;
        setInstruction(text);
        setTargetCondition(() => condition);
        newOptions[Math.floor(random() * 4)] = {shape: SHAPES[0].type, colorCode: COLORS[0].code, colorNameZh: COLORS[0].zh, colorNameEn: COLORS[0].en};
      }
    }

    setOptions(newOptions);
  };

  const toggleLang = () => {
    setLang(l => {
      const newLang = l === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dx3xb_lang", newLang);
        document.cookie = `dx3xb_lang=${newLang}; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.dx3xb.com; Secure`;
        const url = new URL(window.location.href);
        url.searchParams.set("lang", newLang);
        window.history.replaceState(null, "", url.toString());
      }
      return newLang;
    });
  };

  // 个性化挑战链接：带上分数/称呼/语言，扫码或点开即可应战
  const challengeUrl = () => {
    const params = new URLSearchParams();
    if (score > 0) params.set("score", String(score));
    if (playerName) params.set("from", playerName);
    if (runSeed) params.set("seed", runSeed);
    params.set("lang", lang);
    return `${SITE}/?${params.toString()}`;
  };

  const startGame = () => {
    const nextSeed = challengeSeedRef.current || createSeed();
    randomRef.current = createSeededRandom(nextSeed);
    setRunSeed(nextSeed);
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(60);
    setPhase("playing");
    setPlayerName("");
    setCopied(false);
    generateRound();
  };

  const handleShapeClick = (shapeData: ShapeData) => {
    if (phase !== "playing") return;

    if (targetCondition(shapeData)) {
      setScore((previous) => {
        const next = previous + 1;
        scoreRef.current = next;
        return next;
      });
      setFeedback("correct");
      generateRound();
    } else {
      setTimeLeft(t => Math.max(0, t - 1)); // penalty -1s
      setFeedback("wrong");
    }

    setTimeout(() => setFeedback(null), 300);
  };

  const submitName = () => {
    if (!playerName.trim()) {
      setPlayerName(t.anonPlayer);
    }
    setPhase("finished");
  };

  const rankInfo = getRank(beatPct, lang);

  const shareText = () => lang === "zh"
    ? `我「${playerName || t.anonPlayer}」在 dx3xb 不要点错坚持 60 秒拿了 ${score} 分，本局估算超过 ${beatPct}% 的玩家，称号「${rankInfo.title}」！来挑战同一套题：${challengeUrl()}`
    : `${playerName || t.anonPlayer} scored ${score} in 60s on dx3xb Don't Tap Wrong — an estimated ${beatPct}th percentile for this run, title "${rankInfo.title}"! Take the same puzzle: ${challengeUrl()}`;

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "dx3xb - " + t.title,
          text: shareText(),
          url: challengeUrl()
        });
      } else {
        copyResult();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadReport = async () => {
    if (!reportRef.current || saving) return;
    setSaving(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#fffdf8",
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `dx3xb-dont-click-wrong-${playerName || "report"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className={`wrap ${feedback === "wrong" ? "shake-effect" : ""}`}
      data-testid="game-root"
      data-hydrated={hydrated ? "true" : "false"}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .shake-effect { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes radar { 0%, 100% { height: 8px; } 50% { height: 30px; } }
        @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .srOnly { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

        /* ----- hero ----- */
        .heroLab { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin: 6px 0 22px; }
        .labKicker { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 8px; }
        .heroLab .title { margin: 0; font-size: clamp(30px, 9vw, 58px); line-height: 1.05; color: var(--ink); }
        .tagline { margin: 8px 0 0; font-size: 19px; color: var(--ink-soft); }
        .showcase { display: flex; gap: 8px; flex: none; }
        .showcase .chip { width: 38px; height: 38px; border: 3px solid var(--line); background: #fff; box-shadow: 3px 3px 0 var(--ink); display: flex; align-items: center; justify-content: center; animation: bob 1.8s ease-in-out infinite; }
        .showcase .chip:nth-child(2) { animation-delay: .15s; }
        .showcase .chip:nth-child(3) { animation-delay: .3s; }
        .showcase .chip:nth-child(4) { animation-delay: .45s; }

        /* ----- intro ----- */
        .introPanel { padding: 22px 20px; }
        .introText { font-size: 20px; line-height: 1.45; margin: 0 0 16px; }
        .sectionTag { display: inline-block; font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; background: var(--ink); color: var(--cream); padding: 5px 9px; margin-bottom: 12px; }
        .demoCard { background: var(--cream-2); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 14px; margin-bottom: 18px; }
        .demoInstr { text-align: center; font-size: 20px; margin: 0 0 12px; }
        .demoInstr b { color: var(--coral); }
        .demoShapes { display: flex; gap: 10px; justify-content: center; }
        .demoShape { position: relative; width: 52px; height: 52px; border: 3px solid var(--line); background: #fff; box-shadow: 3px 3px 0 var(--ink); display: flex; align-items: center; justify-content: center; }
        .demoShape.correct { outline: 3px dashed var(--teal); outline-offset: 3px; }
        .demoShape.correct::after { content: "✓"; position: absolute; top: -14px; right: -10px; font-family: var(--font-press), monospace; font-size: 14px; color: var(--teal); }
        .demoHint { font-size: 16px; color: var(--ink-soft); margin: 12px 0 0; }
        .challengeNotice { background: var(--yellow); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 11px 13px; margin-bottom: 18px; font-size: 18px; }

        .rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0 20px; }
        .rules div { background: var(--cream); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 10px; text-align: center; }
        .rules b { display: block; font-family: var(--font-press), monospace; font-size: 17px; color: var(--ink); }
        .rules span { display: block; font-size: 15px; color: var(--ink-soft); margin-top: 4px; }

        /* ----- playing ----- */
        .hudbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .hudbar .hud-chip { font-family: var(--font-press), monospace; font-size: 13px; background: #fff; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 8px 12px; }
        .hudbar .hud-chip.time { background: var(--yellow); }
        .hudbar .hud-chip.score { background: var(--coral); color: #fff; }
        .instrPanel { text-align: center; margin-bottom: 16px; padding: 18px; transition: background .12s; }
        .instrPanel.good { background: #e8f8f1; }
        .instrPanel h2 { margin: 0; font-size: 22px; }
        .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 8px auto 0; max-width: 320px; }
        .shape-btn { appearance: none; width: 100%; aspect-ratio: 1; padding: 0; display: flex; align-items: center; justify-content: center; background: #fff; border: 4px solid var(--line); cursor: pointer; box-shadow: 4px 4px 0 var(--ink); transition: transform 0.08s, box-shadow 0.08s; }
        .shape-btn:hover { transform: translate(-1px,-1px); box-shadow: 5px 5px 0 var(--ink); }
        .shape-btn:active { transform: translate(4px, 4px); box-shadow: none; }
        .shape-btn:focus-visible { outline: 4px solid var(--teal); outline-offset: 5px; }

        /* ----- naming ----- */
        .nameInput { width: 100%; padding: 12px 14px; margin: 16px 0; border: 3px solid var(--line); background: var(--cream); box-shadow: inset 3px 3px 0 rgba(43,34,51,.10); font-family: inherit; font-size: 22px; outline: none; }
        .nameInput:focus { background: #fff; box-shadow: var(--shadow); }

        /* ----- report poster ----- */
        .reportCard { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; margin-bottom: 18px; }
        .posterHead { background: var(--ink); color: var(--cream); display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
        .posterHead .pk { font-family: var(--font-press), monospace; font-size: 11px; letter-spacing: 1px; margin: 0; }
        .posterHead .bolt { font-size: 22px; }
        .posterBody { padding: 22px 20px; text-align: center; position: relative; }
        .posterBody::before, .posterBody::after { content: ""; position: absolute; width: 10px; height: 10px; background: var(--yellow); border: 2px solid var(--line); }
        .posterBody::before { top: 12px; left: 12px; }
        .posterBody::after { top: 12px; right: 12px; background: var(--teal); }
        .issued { font-size: 16px; color: var(--ink-soft); margin: 0 0 4px; }
        .issuedName { font-family: var(--font-press), monospace; font-size: 17px; color: var(--ink); }
        .rankLabel { display: inline-block; font-family: var(--font-press), monospace; font-size: 9px; letter-spacing: 1px; color: var(--ink-soft); margin: 16px 0 0; }
        .rankTitle { font-family: var(--font-press), monospace; font-size: clamp(24px, 8vw, 40px); color: var(--coral); margin: 6px 0 8px; line-height: 1.12; animation: pop .25s ease-out; }
        .rankDesc { font-size: 18px; color: var(--ink-soft); margin: 0 0 18px; }
        .pctWrap { background: var(--cream-2); border: 3px solid var(--line); padding: 14px; margin-bottom: 16px; }
        .pctNum { font-family: var(--font-press), monospace; font-size: clamp(40px, 16vw, 70px); color: var(--ink); line-height: 1; }
        .pctNum span { color: var(--coral); }
        .pctCaption { font-size: 16px; color: var(--ink-soft); margin: 8px 0 12px; }
        .pctBar { height: 18px; border: 3px solid var(--line); background: #fff; overflow: hidden; }
        .pctBar i { display: block; height: 100%; background: repeating-linear-gradient(45deg, var(--coral) 0 8px, #ffa3a3 8px 16px); }
        .percentileNote { font-size: 14px; line-height: 1.35; color: var(--ink-soft); margin: 10px 0 0; }
        .statStrip { display: flex; gap: 10px; margin-bottom: 16px; }
        .statStrip div { flex: 1; background: var(--cream); border: 3px solid var(--line); padding: 9px; }
        .statStrip span { display: block; font-size: 13px; color: var(--ink-soft); text-transform: uppercase; }
        .statStrip b { display: block; font-family: var(--font-press), monospace; font-size: 19px; }
        .qrRow { display: flex; align-items: center; gap: 14px; border-top: 3px dashed rgba(43,34,51,.38); padding-top: 16px; text-align: left; }
        .qrFrame { border: 4px solid var(--line); background: #fff; padding: 5px; box-shadow: var(--shadow); line-height: 0; flex: none; }
        .qrText .pixel { font-size: 12px; margin: 0 0 4px; }
        .qrCta { font-size: 16px; color: var(--ink-soft); margin: 0; }
        .qrUrl { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink); margin: 5px 0 0; }

        .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn.ghost { background: #fff; color: var(--ink); }
        .btn.link { background: transparent; color: var(--ink-soft); border: none; box-shadow: none; text-decoration: underline; }

        @media (prefers-reduced-motion: reduce) {
          .shake-effect, .showcase .chip, .rankTitle { animation: none !important; }
          .shape-btn { transition: none; }
        }
      `}} />

      <div className="backbar" style={{ display: phase === "finished" ? "none" : "flex" }}>
        <a className="backbtn" href="https://dx3xb.com">{t.back}</a>
        <button
          className="langbtn"
          type="button"
          aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
          onClick={toggleLang}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#666", fontWeight: "bold" }}
        >
          [{t.langBtn}]
        </button>
      </div>

      {phase === "idle" && (
        <>
          <section className="heroLab">
            <div>
              <p className="labKicker">{t.readyKicker}</p>
              <h1 className="pixel title">{t.readyTitle}</h1>
              <p className="tagline">{t.tagline}</p>
            </div>
            <div className="showcase" aria-hidden="true">
              <div className="chip"><PixelCircle color="#e74c3c" /></div>
              <div className="chip"><PixelSquare color="#3498db" /></div>
              <div className="chip"><PixelTriangle color="#2ecc71" /></div>
              <div className="chip"><PixelCircle color="#f1c40f" /></div>
            </div>
          </section>

          {challengeScore > 0 && (
            <div className="challengeNotice">{t.challengeNotice(challengerName, challengeScore)}</div>
          )}

          <section className="panel introPanel">
            <p className="introText">{t.readyDesc}</p>

            <span className="sectionTag">{t.howTitle}</span>
            <div className="demoCard">
              <p className="demoInstr" dangerouslySetInnerHTML={{ __html: t.demoInstruction.replace(/(红色的圆形|red circle)/, "<b>$1</b>") }} />
              <div className="demoShapes">
                <div className="demoShape correct"><PixelCircle color="#e74c3c" /></div>
                <div className="demoShape"><PixelSquare color="#3498db" /></div>
                <div className="demoShape"><PixelTriangle color="#2ecc71" /></div>
                <div className="demoShape"><PixelCircle color="#f1c40f" /></div>
              </div>
              <p className="demoHint">{t.demoHint}</p>
            </div>

            <div className="rules">
              <div>
                <b className="pixel">60s</b>
                <span>{t.rules.time}</span>
              </div>
              <div>
                <b className="pixel">-1s</b>
                <span>{t.rules.penalty}</span>
              </div>
              <div>
                <b className="pixel">+1</b>
                <span>{t.rules.target}</span>
              </div>
            </div>
            <div className="actions">
              <button className="btn coral" onClick={startGame} style={{ width: "100%" }}>
                {t.start}
              </button>
            </div>
          </section>
        </>
      )}

      {phase === "playing" && (
        <div>
          <div className="hudbar">
            <div className="hud-chip time pixel">{t.time} {timeLeft}s</div>
            <div className="hud-chip score pixel">{t.score} {score}</div>
          </div>

          <div className={`panel instrPanel ${feedback === "correct" ? "good" : ""}`} aria-live="polite">
            <h2 id="game-instruction">{instruction}</h2>
          </div>
          <p className="srOnly" role="status" aria-live="assertive">
            {feedback === "correct" ? t.correctFeedback : feedback === "wrong" ? t.wrongFeedback : ""}
          </p>

          <div className="grid-container" role="group" aria-label={t.choiceGroup} aria-describedby="game-instruction">
            {options.map((opt, i) => (
              <button
                key={i}
                className="shape-btn"
                type="button"
                aria-label={optionLabel(opt, lang, i)}
                onClick={() => handleShapeClick(opt)}
              >
                {opt.shape === "circle" && <PixelCircle color={opt.colorCode} />}
                {opt.shape === "square" && <PixelSquare color={opt.colorCode} />}
                {opt.shape === "triangle" && <PixelTriangle color={opt.colorCode} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "naming" && (
        <div className="panel introPanel" style={{ textAlign: "center" }}>
          <span className="sectionTag">{t.reportKicker}</span>
          <h2 className="pixel" style={{ fontSize: 24, margin: "8px 0 0" }}>{t.generating}</h2>
          <p id="naming-hint" style={{ marginTop: 10 }}>{t.namingHint}</p>
          <input
            className="nameInput pixel"
            aria-describedby="naming-hint"
            value={playerName}
            maxLength={10}
            placeholder={t.namingPlaceholder}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
            autoFocus
          />
          <div className="actions">
            <button className="btn coral" onClick={submitName} style={{ width: "100%" }}>{t.viewReport}</button>
          </div>
        </div>
      )}

      {phase === "finished" && (
        <div>
          <div className="reportCard" ref={reportRef}>
            <div className="posterHead">
              <p className="pk">{t.reportKicker}</p>
              <span className="bolt" aria-hidden="true">⚡</span>
            </div>
            <div className="posterBody">
              <p className="issued">{t.issuedTo}</p>
              <p className="issuedName">{playerName || t.anonPlayer}</p>

              <p className="rankLabel">{t.rankLabel}</p>
              <h2 className="rankTitle">{rankInfo.title}</h2>
              <p className="rankDesc">&ldquo;{rankInfo.desc}&rdquo;</p>

              <div className="pctWrap">
                <div className="pctNum" aria-label={`${beatPct}%`}>{beatPct}<span>%</span></div>
                <p className="pctCaption">{t.beatCaption}</p>
                <div className="pctBar" aria-hidden="true"><i style={{ width: `${beatPct}%` }} /></div>
                <p className="percentileNote">{t.percentileNote}</p>
              </div>

              <div className="statStrip">
                <div>
                  <span>{t.reportFinalScore}</span>
                  <b className="pixel">{score}</b>
                </div>
                <div>
                  <span>{t.perSec}</span>
                  <b className="pixel">{(score / 60).toFixed(1)}</b>
                </div>
              </div>

              <div className="qrRow">
                <div className="qrFrame">
                  <QRCodeSVG value={challengeUrl()} size={92} fgColor="#2b2233" bgColor="#ffffff" />
                </div>
                <div className="qrText">
                  <p className="pixel">{t.qrScan}</p>
                  <p className="qrCta">{t.qrCta}</p>
                  <p className="qrUrl">dont-click-wrong.dx3xb.com</p>
                </div>
              </div>
            </div>
          </div>

          <TrioFooter
            game="dont-click-wrong"
            lang={lang}
            run={{
              score,
              pct: beatPct,
              title: rankInfo.title,
              lang,
              handle: playerName,
              stats: { perSec: Number((score / 60).toFixed(2)), beatPct },
            }}
          />

          <div className="actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <button className="btn coral" onClick={downloadReport}>{saving ? t.saving : t.saveBtn}</button>
            <button className="btn teal" onClick={shareNative}>{t.shareBtn}</button>
            <button className="btn ghost" onClick={copyResult}>{copied ? t.copied : t.copyBtn}</button>
            <button className="btn link" onClick={startGame}>{t.retry}</button>
            <a href="https://dx3xb.com" style={{ textAlign: "center", color: "var(--ink-soft)", marginTop: 6 }}>{t.home}</a>
          </div>
        </div>
      )}
    </main>
  );
}
