"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import { TrioFooter, ensureSession, getProfileHandle } from "./dx3xb-trio";

type Shape = "circle" | "square" | "triangle";
type ColorCode = "#e74c3c" | "#3498db" | "#2ecc71" | "#f1c40f";

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
      name ? `${name} 甩来一张 ${s} 分的战书，敢不敢应战？` : `有人留下了 ${s} 分的挑战，超过他！`,
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
    beatCaption: "的人类被你的手速击败",
    perSec: "每秒命中",
    qrCta: "扫码应战，看朋友能不能超过你",
    time: "时间",
    score: "得分",
    gameOver: "游戏结束",
    generating: "生成大脑报告",
    namingHint: "输入你的代号，看看你的反应力超越了多少人",
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
      name ? `${name} threw down a ${s}-point gauntlet. Beat it!` : `Someone left a ${s}-point challenge. Beat it!`,
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
    beatCaption: "of humanity, out-tapped",
    perSec: "HITS / SEC",
    qrCta: "Scan to duel — can your friends beat you?",
    time: "Time",
    score: "Score",
    gameOver: "Game Over",
    generating: "Brain Report",
    namingHint: "Enter your codename to see your global rank",
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

const getRank = (pct: number, lang: "zh" | "en") => {
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
    title: lang === "zh" ? "帕金森早期" : "Shaky Hands",
    desc: lang === "zh" ? "建议去医院挂个号检查一下手抖。" : "Might want to check those shaky hands."
  };
  if (pct >= 30) return {
    title: lang === "zh" ? "懵逼果实" : "Confused Fruit",
    desc: lang === "zh" ? "你的眼睛看到了，但你的手表示“我没看到”。" : "Eyes saw it, hands said 'nope'."
  };
  if (pct >= 25) return {
    title: lang === "zh" ? "眼神涣散者" : "Wandering Eyes",
    desc: lang === "zh" ? "你的注意力大概已经飞到了外太空。" : "Your attention flew to outer space."
  };
  if (pct >= 20) return {
    title: lang === "zh" ? "老奶奶过马路" : "Granny Crossing",
    desc: lang === "zh" ? "小心点，别闪了腰。" : "Be careful not to pull a muscle."
  };
  if (pct >= 15) return {
    title: lang === "zh" ? "盲人摸象" : "Blind Guess",
    desc: lang === "zh" ? "你确定你是睁着眼睛在玩吗？" : "Are you playing with your eyes closed?"
  };
  if (pct >= 10) return {
    title: lang === "zh" ? "植物人前兆" : "Flatline",
    desc: lang === "zh" ? "你的脑电波几乎是一条直线。" : "Your brainwaves are basically a flatline."
  };
  if (pct >= 5) return {
    title: lang === "zh" ? "史莱姆转世" : "Slime Reborn",
    desc: lang === "zh" ? "你的思考速度堪比一坨史莱姆。" : "Thinking speed of a blob of slime."
  };
  return {
    title: lang === "zh" ? "薛定谔的玩家" : "Schrödinger's Player",
    desc: lang === "zh" ? "你是在用脚趾头按屏幕吗？" : "Are you tapping the screen with your toes?"
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

function getInitialLang(): "zh" | "en" {
  if (typeof window === "undefined") return "en";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
  const stored = window.localStorage.getItem("dx3xb_lang");
  if (stored === "zh" || stored === "en") return stored;
  return "en";
}

export default function DontClickWrong() {
  const [lang, setLang] = useState<"zh" | "en">("en");
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
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [beatPct, setBeatPct] = useState(0);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengerName, setChallengerName] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const knownNameRef = useRef("");

  useEffect(() => {
    setLang(getInitialLang());
    void ensureSession(); // 首访即建匿名会话（跨子域 cookie）
    getProfileHandle().then((h) => {
      if (h) knownNameRef.current = h.replace(/[ -<>]/g, "").slice(0, 10);
    });
    const params = new URLSearchParams(window.location.search);
    setChallengeScore(Number(params.get("score") || 0));
    setChallengerName((params.get("from") || "").replace(/[ -<>]/g, "").slice(0, 16));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "playing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft <= 0 && phase === "playing") {
      endGame();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timeLeft]);

  const generateRound = () => {
    const r = Math.random();
    let condition: (s: ShapeData) => boolean = () => false;
    let text = "";

    const randColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

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
      const c = COLORS[Math.floor(Math.random() * COLORS.length)];
      const s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const shapeData = { shape: s.type, colorCode: c.code, colorNameZh: c.zh, colorNameEn: c.en };
      newOptions.push(shapeData);
      if (condition(shapeData)) {
        hasCorrect = true;
      }
    }

    if (!hasCorrect) {
      let matchFound = false;
      for(let iter=0; iter<50; iter++) {
        const testColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const testShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        if (condition({shape: testShape.type, colorCode: testColor.code, colorNameZh: testColor.zh, colorNameEn: testColor.en})) {
            newOptions[Math.floor(Math.random() * 4)] = {shape: testShape.type, colorCode: testColor.code, colorNameZh: testColor.zh, colorNameEn: testColor.en};
            matchFound = true;
            break;
        }
      }
      if (!matchFound) {
        text = lang === "zh" ? `点击${COLORS[0].zh}色的${SHAPES[0].zh}` : `Tap the ${COLORS[0].en} ${SHAPES[0].en}`;
        condition = (s) => s.colorCode === COLORS[0].code && s.shape === SHAPES[0].type;
        setInstruction(text);
        setTargetCondition(() => condition);
        newOptions[Math.floor(Math.random() * 4)] = {shape: SHAPES[0].type, colorCode: COLORS[0].code, colorNameZh: COLORS[0].zh, colorNameEn: COLORS[0].en};
      }
    }

    setOptions(newOptions);
  };

  const toggleLang = () => {
    setLang(l => {
      const newLang = l === "zh" ? "en" : "zh";
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dx3xb_lang", newLang);
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
    params.set("lang", lang);
    return `${SITE}/?${params.toString()}`;
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setPhase("playing");
    setPlayerName("");
    setCopied(false);
    generateRound();
  };

  const endGame = () => {
    if (knownNameRef.current) setPlayerName(knownNameRef.current); // 已有称呼则自动预填
    setPhase("naming");
    // 确定性百分位：同样分数永远同样结果，挑战才公平
    const pct = score === 0 ? 3 : Math.min(99, Math.round(12 + score * 1.7));
    setBeatPct(pct);
  };

  const handleShapeClick = (shapeData: ShapeData) => {
    if (phase !== "playing") return;

    if (targetCondition(shapeData)) {
      setScore(s => s + 1);
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
    ? `我「${playerName || t.anonPlayer}」在 dx3xb 不要点错坚持60秒拿了 ${score} 分，反应力击败了 ${beatPct}% 的人，称号「${rankInfo.title}」！来挑战我：${challengeUrl()}`
    : `${playerName || t.anonPlayer} scored ${score} in 60s on dx3xb Don't Tap Wrong — beat ${beatPct}% of players, title "${rankInfo.title}"! Take me on: ${challengeUrl()}`;

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
    <main className={`wrap ${feedback === "wrong" ? "shake-effect" : ""}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .shake-effect { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes radar { 0%, 100% { height: 8px; } 50% { height: 30px; } }
        @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

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
        .shape-btn { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #fff; border: 4px solid var(--line); cursor: pointer; box-shadow: 4px 4px 0 var(--ink); transition: transform 0.08s, box-shadow 0.08s; }
        .shape-btn:hover { transform: translate(-1px,-1px); box-shadow: 5px 5px 0 var(--ink); }
        .shape-btn:active { transform: translate(4px, 4px); box-shadow: none; }

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
      `}} />

      <div className="backbar" style={{ display: phase === "finished" ? "none" : "flex" }}>
        <a className="backbtn" href="https://dx3xb.com">{t.back}</a>
        <button className="langbtn" onClick={toggleLang} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "#666", fontWeight: "bold" }}>
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

          <div className={`panel instrPanel ${feedback === "correct" ? "good" : ""}`}>
            <h2>{instruction}</h2>
          </div>

          <div className="grid-container">
            {options.map((opt, i) => (
              <div key={i} className="shape-btn" onClick={() => handleShapeClick(opt)}>
                {opt.shape === "circle" && <PixelCircle color={opt.colorCode} />}
                {opt.shape === "square" && <PixelSquare color={opt.colorCode} />}
                {opt.shape === "triangle" && <PixelTriangle color={opt.colorCode} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "naming" && (
        <div className="panel introPanel" style={{ textAlign: "center" }}>
          <span className="sectionTag">{t.reportKicker}</span>
          <h2 className="pixel" style={{ fontSize: 24, margin: "8px 0 0" }}>{t.generating}</h2>
          <p style={{ marginTop: 10 }}>{t.namingHint}</p>
          <input
            className="nameInput pixel"
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
                <div className="pctNum">{beatPct}<span>%</span></div>
                <p className="pctCaption">{t.beatCaption}</p>
                <div className="pctBar"><i style={{ width: `${beatPct}%` }} /></div>
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
