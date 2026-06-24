"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";

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
    rules: {
      time: "限时",
      penalty: "点错",
      target: "目标"
    },
    start: "开始挑战 / START",
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
    saveBtn: "保存战报长图 / SAVE",
    shareBtn: "分享给朋友 / SHARE",
    copied: "已复制！ / COPIED",
    copyBtn: "复制战报文字 / COPY",
    retry: "再玩一次 / RETRY",
    home: "返回主页 / BACK TO HOME"
  },
  en: {
    langBtn: "中",
    back: "← dx3xb",
    title: "Don't Tap Wrong",
    readyKicker: "dx3xb lab / Reaction Control Test",
    readyTitle: "Don't Tap Wrong",
    readyDesc: "Tap the correct shape fast! +1 point per hit, -1s per mistake.",
    rules: {
      time: "Time Limit",
      penalty: "Mistake",
      target: "Goal"
    },
    start: "START",
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
    saveBtn: "SAVE REPORT / SAVE",
    shareBtn: "SHARE WITH FRIENDS / SHARE",
    copied: "COPIED! / COPIED",
    copyBtn: "COPY RESULT TEXT / COPY",
    retry: "PLAY AGAIN / RETRY",
    home: "BACK TO HOME / BACK"
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

export default function DontClickWrong() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
      // Hack: simply re-generating round text logic forces a fresh translation of current round
      // Alternatively, we can just reset the game or let the user toggle before they play.
      return newLang;
    });
    // We intentionally let the user toggle before playing, if toggled during playing, it applies to next round
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
    setPhase("naming");
    let pct = Math.min(99, Math.floor(10 + score * 1.5 + Math.random() * 2));
    if (score === 0) pct = Math.floor(Math.random() * 5);
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
    ? `我在【dx3xb 不要点错】中坚持60秒拿了 ${score} 分，注意力击败了 ${beatPct}% 的人，获得了「${rankInfo.title}」称号！你能超过我吗？\nhttps://dont-click-wrong.dx3xb.com`
    : `I scored ${score} pts in 60s on [dx3xb Don't Tap Wrong], beating ${beatPct}% of players and got the title "${rankInfo.title}"! Can you beat me?\nhttps://dont-click-wrong.dx3xb.com`;

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
          url: "https://dont-click-wrong.dx3xb.com"
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
        .shake-effect { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; background-color: #ffeaea !important; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px auto; max-width: 300px; }
        .shape-btn { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #fff; border: 4px solid #3e4a3d; cursor: pointer; box-shadow: 4px 4px 0 #3e4a3d; transition: transform 0.1s; }
        .shape-btn:active { transform: translate(4px, 4px); box-shadow: none; }
        
        .nameInput { width: 100%; padding: 12px; margin: 20px 0; border: 4px solid #3e4a3d; font-family: inherit; font-size: 18px; outline: none; }
        .nameInput:focus { border-color: #ff6b6b; }
        
        .reportCard { background: #fffdf8; border: 4px solid #3e4a3d; padding: 20px; text-align: center; margin-bottom: 20px; box-shadow: 8px 8px 0 #3e4a3d; }
        .reportTitle { color: #ff6b6b; font-size: 32px; margin: 10px 0; }
        .reportGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; text-align: left; background: #eee; border: 4px solid #3e4a3d; padding: 10px; }
        .reportGrid div { display: flex; justify-content: space-between; border-bottom: 2px dashed #ccc; padding-bottom: 4px; }
        .qrBox { display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 20px; text-align: left; }

        .heroLab { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3e4a3d; padding-bottom: 12px; margin-bottom: 20px; }
        .labKicker { font-size: 14px; text-transform: uppercase; font-family: monospace; letter-spacing: 1px; color: #666; margin: 0 0 4px; }
        .heroLab .title { margin: 0; font-size: 28px; color: #ff6b6b; }
        .scope { display: flex; gap: 4px; align-items: flex-end; height: 30px; }
        .scope span { width: 6px; background: #ff6b6b; animation: radar 1.5s infinite ease-in-out; }
        .scope span:nth-child(2) { animation-delay: 0.2s; background: #3e4a3d; }
        .scope span:nth-child(3) { animation-delay: 0.4s; background: #2ecc71; }
        @keyframes radar { 0%, 100% { height: 8px; } 50% { height: 30px; } }

        .introPanel { padding: 24px 20px; text-align: left; }
        .introText { font-size: 16px; line-height: 1.5; margin: 0 0 20px; }
        .rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #eee; padding: 12px; border: 4px solid #3e4a3d; margin-bottom: 24px; text-align: center; }
        .rules b { display: block; font-size: 24px; color: #3e4a3d; }
        .rules span { font-size: 12px; color: #666; text-transform: uppercase; }
        .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
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
            </div>
            <div className="scope" aria-hidden="true">
              <span /><span /><span />
            </div>
          </section>

          <section className="panel introPanel">
            <p className="introText">{t.readyDesc}</p>
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="pixel" style={{ fontSize: 18 }}>{t.time}: {timeLeft}s</div>
            <div className="pixel" style={{ fontSize: 18, color: "#e74c3c" }}>{t.score}: {score}</div>
          </div>
          
          <div className="panel" style={{ textAlign: "center", marginBottom: 16, backgroundColor: feedback === "correct" ? "#e8f8f5" : "" }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>{instruction}</h2>
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
        <div className="panel" style={{ textAlign: "center" }}>
          <h2 className="pixel" style={{ fontSize: 24, color: "#3e4a3d" }}>{t.generating}</h2>
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
          <button className="btn coral" onClick={submitName}>{t.viewReport}</button>
        </div>
      )}

      {phase === "finished" && (
        <div>
          <div className="reportCard" ref={reportRef}>
            <p className="pixel labKicker">{t.reportKicker}</p>
            <p style={{ marginTop: 15 }}>{t.beatPct1} <strong>{playerName}</strong> {t.beatPct2}</p>
            <div className="pixel" style={{ fontSize: 48, color: "#ff6b6b", margin: "10px 0" }}>{beatPct}%</div>
            <p>{t.beatPct3}</p>
            
            <h2 className="pixel reportTitle">{rankInfo.title}</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>"{rankInfo.desc}"</p>

            <div className="reportGrid">
              <div><span>{t.reportFinalScore}</span><b className="pixel">{score}</b></div>
              <div><span>{t.reportTimeLeft}</span><b className="pixel">0s</b></div>
              <div><span>{t.reportGame}</span><b className="pixel">dx3xb</b></div>
            </div>

            <div className="qrBox">
              <div style={{ border: "4px solid #3e4a3d", padding: 4, background: "#fff", display: "flex" }}>
                <QRCodeSVG value="https://dont-click-wrong.dx3xb.com" size={60} fgColor="#3e4a3d" />
              </div>
              <div style={{ flex: 1 }}>
                <p className="pixel" style={{ fontSize: 14, margin: "0 0 4px" }}>{t.qrScan}</p>
                <p style={{ fontSize: 12, color: "#666", margin: 0 }}>dont-click-wrong.dx3xb.com</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn coral" onClick={downloadReport}>{saving ? t.saving : t.saveBtn}</button>
            <button className="btn teal" onClick={shareNative}>{t.shareBtn}</button>
            <button className="btn" onClick={copyResult} style={{ background: "#eee", color: "#3e4a3d", border: "4px solid #3e4a3d" }}>
              {copied ? t.copied : t.copyBtn}
            </button>
            <button className="btn" onClick={startGame} style={{ background: "transparent", color: "#3e4a3d", border: "none", textDecoration: "underline" }}>{t.retry}</button>
            <a href="https://dx3xb.com" style={{ textAlign: "center", color: "#666", marginTop: 10 }}>{t.home}</a>
          </div>
        </div>
      )}
    </main>
  );
}
