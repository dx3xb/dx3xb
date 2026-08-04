"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { AiQuestFooter, getAiProfile } from "./dx3xb-ai";
import {
  CASES_PER_RUN,
  ROUND_SECONDS,
  STARTING_TOKENS,
  casesForSeed,
  makeSeed,
  masteryScore,
  resultKey,
  safeChallengeName,
  scoreRound,
  type Lang,
} from "./game";

type Phase = "intro" | "playing" | "feedback" | "report";

const RESULTS = {
  evidence_hunter: {
    zh: { title: "证据猎手", desc: "你不被语气带跑，知道什么时候该查、什么时候可以判断。" },
    en: { title: "EVIDENCE HUNTER", desc: "You resist confident tone and know when evidence is worth spending." },
  },
  calm_verifier: {
    zh: { title: "冷静核验员", desc: "大多数胡说都躲不过你。再留意一次来源，就更稳了。" },
    en: { title: "CALM VERIFIER", desc: "Most shaky claims do not get past you. One more source check will make it stronger." },
  },
  clue_collector: {
    zh: { title: "线索收集家", desc: "你已经会停下来找线索。下一步是分清“像真的”和“有证据”。" },
    en: { title: "CLUE COLLECTOR", desc: "You pause for clues. Next, separate 'sounds true' from 'has evidence'." },
  },
  pause_before_nodding: {
    zh: { title: "先别急着点头", desc: "AI 最擅长把话说顺。下次先问：来源呢？日期呢？证据呢？" },
    en: { title: "PAUSE BEFORE NODDING", desc: "AI is great at sounding smooth. Next time ask: source, date, evidence?" },
  },
} as const;

const COPY = {
  zh: {
    langBtn: "EN",
    kicker: "AI ADVENTURE / CASE 01",
    title: "AI 侦探社",
    subtitle: "谁在胡说？",
    intro: "AI 说得一本正经，不代表每句话都站得住。5 个案件里，每案都有一句最不可靠的话——把它揪出来。",
    rules: [
      ["5 案", "一局"],
      ["15s", "每案"],
      ["3 枚", "查证币"],
    ],
    start: "开始查案",
    newSet: "换一套案件",
    challenge: (name: string, score: number) => `${name || "一位匿名侦探"} 留下了 ${score} 分的同题挑战。`,
    hudCase: "案件",
    hudTime: "倒计时",
    hudTokens: "查证币",
    hudScore: "得分",
    question: "哪一句最不可靠？",
    verify: "消耗 1 枚查证币",
    verified: "本案线索已打开",
    outOfTokens: "查证币用完了",
    timeout: "时间到",
    correct: "判断成立",
    wrong: "被它说服了",
    answer: "不可靠的是",
    evidence: "核验记录",
    lesson: "带走这条",
    next: "下一案 →",
    report: "查看侦探报告 →",
    reportKicker: "dx3xb AI 素养报告",
    issued: "签发给",
    anon: "匿名侦探",
    mastery: "核验掌握度",
    stats: { correct: "判断正确", tokens: "剩余查证币", streak: "最高连击", score: "案件得分" },
    learning: "本局掌握",
    learningText: "语言流畅 ≠ 事实可靠。重要信息要检查来源、日期和上下文。",
    qr: "扫码挑战同一套案件",
    disclaimer: "学习娱乐用途，不评价智力或人格。题库为审核过的静态内容。",
    download: "下载报告",
    share: "发起挑战",
    copy: "复制战报",
    copied: "已复制",
    replay: "再查一遍",
    another: "换一套案件",
    challengeWin: (diff: number) => `你比挑战者高 ${diff} 分。案件已反转。`,
    challengeLose: (diff: number) => `还差 ${diff} 分。线索就在同一套案件里。`,
    shareText: (name: string, score: number, title: string, mastery: number, url: string) =>
      `我「${name}」在 dx3xb AI 侦探社拿到 ${score} 分，称号「${title}」，核验掌握度 ${mastery}%。AI 说得像真的，你能找出它在胡说的那一句吗？同题挑战：${url}`,
  },
  en: {
    langBtn: "中",
    kicker: "AI ADVENTURE / CASE 01",
    title: "AI DETECTIVE",
    subtitle: "WHO IS BLUFFING?",
    intro: "AI can sound certain without being reliable. Five cases, three claims each, one weak link—catch it.",
    rules: [
      ["5", "CASES"],
      ["15s", "EACH"],
      ["3", "CLUE TOKENS"],
    ],
    start: "OPEN THE CASE",
    newSet: "NEW CASE SET",
    challenge: (name: string, score: number) => `${name || "An anonymous detective"} left a ${score}-point challenge.`,
    hudCase: "CASE",
    hudTime: "TIME",
    hudTokens: "CLUES",
    hudScore: "SCORE",
    question: "WHICH CLAIM IS LEAST RELIABLE?",
    verify: "SPEND 1 CLUE TOKEN",
    verified: "CLUE OPENED",
    outOfTokens: "NO CLUE TOKENS LEFT",
    timeout: "TIME'S UP",
    correct: "CASE CRACKED",
    wrong: "THE BLUFF WORKED",
    answer: "WEAK CLAIM",
    evidence: "VERIFICATION NOTE",
    lesson: "TAKE THIS WITH YOU",
    next: "NEXT CASE →",
    report: "OPEN REPORT →",
    reportKicker: "dx3xb AI LITERACY REPORT",
    issued: "ISSUED TO",
    anon: "ANON DETECTIVE",
    mastery: "VERIFICATION MASTERY",
    stats: { correct: "CORRECT", tokens: "CLUES LEFT", streak: "BEST STREAK", score: "CASE SCORE" },
    learning: "LEARNED THIS RUN",
    learningText: "Fluent language is not reliable evidence. Check the source, date, and context.",
    qr: "SCAN FOR THE SAME CASES",
    disclaimer: "For learning and fun—not an intelligence or personality assessment. Uses a reviewed static case bank.",
    download: "DOWNLOAD REPORT",
    share: "CHALLENGE",
    copy: "COPY REPORT",
    copied: "COPIED",
    replay: "REPLAY",
    another: "NEW CASE SET",
    challengeWin: (diff: number) => `You beat the challenger by ${diff}. Case closed.`,
    challengeLose: (diff: number) => `${diff} points short. The clues are in the same case set.`,
    shareText: (name: string, score: number, title: string, mastery: number, url: string) =>
      `${name} scored ${score} in dx3xb AI Detective — "${title}", verification mastery ${mastery}%. Can you catch the AI bluff in the same cases? ${url}`,
  },
} as const;

function initialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "zh" || query === "en") return query;
  const cookie = document.cookie.match(/(?:^|; )dx3xb_lang=(zh|en)/)?.[1];
  const stored = window.localStorage.getItem("dx3xb_lang");
  return cookie === "en" || stored === "en" ? "en" : "zh";
}

export default function AiTruthDetective() {
  const [hydrated, setHydrated] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [seed, setSeed] = useState("dx3xb-detective");
  const [phase, setPhase] = useState<Phase>("intro");
  const [caseIndex, setCaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [tokensLeft, setTokensLeft] = useState(STARTING_TOKENS);
  const [evidenceUsed, setEvidenceUsed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [evidenceSpent, setEvidenceSpent] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [challengerName, setChallengerName] = useState("");
  const [challengerScore, setChallengerScore] = useState(0);
  const [dailyDate, setDailyDate] = useState("");
  const [classCode, setClassCode] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const cases = useMemo(() => casesForSeed(seed), [seed]);
  const currentCase = cases[caseIndex];
  const t = COPY[lang];
  const mastery = masteryScore(correctCount, tokensLeft);
  const result = RESULTS[resultKey(correctCount, tokensLeft)][lang];
  const reportName = profileName || t.anon;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextLang = initialLang();
    const nextSeed = safeChallengeName(params.get("seed")) || makeSeed();
    setLang(nextLang);
    setSeed(nextSeed);
    setChallengerName(safeChallengeName(params.get("from")));
    setChallengerScore(Math.max(0, Math.min(99999, Number(params.get("score")) || 0)));
    setDailyDate(/^\d{4}-\d{2}-\d{2}$/.test(params.get("daily") || "") ? params.get("daily") || "" : "");
    setClassCode(/^[A-Z2-9]{6}$/.test((params.get("class") || "").toUpperCase()) ? (params.get("class") || "").toUpperCase() : "");
    document.documentElement.lang = nextLang;
    setHydrated(true);
    getAiProfile().then((profile) => setProfileName(safeChallengeName(profile.handle))).catch(() => undefined);
  }, []);

  const submitAnswer = useCallback((choice: number) => {
    if (phase !== "playing" || !currentCase) return;
    const correct = choice === currentCase.unreliable;
    const points = scoreRound({ correct, secondsLeft, evidenceUsed, previousStreak: streak });
    setSelected(choice);
    setScore((value) => value + points);
    if (correct) {
      const nextStreak = streak + 1;
      setCorrectCount((value) => value + 1);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
    } else {
      setStreak(0);
    }
    setPhase("feedback");
  }, [currentCase, evidenceUsed, phase, secondsLeft, streak]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, caseIndex]);

  useEffect(() => {
    if (phase === "playing" && secondsLeft === 0) submitAnswer(-1);
  }, [phase, secondsLeft, submitAnswer]);

  const challengeUrl = useCallback(() => {
    const origin = typeof window === "undefined" ? "https://ai-detective.dx3xb.com" : window.location.origin;
    const url = new URL(origin);
    url.searchParams.set("seed", seed);
    url.searchParams.set("lang", lang);
    url.searchParams.set("from", reportName);
    url.searchParams.set("score", String(score));
    if (classCode) url.searchParams.set("class", classCode);
    return url.toString();
  }, [classCode, lang, reportName, score, seed]);

  useEffect(() => {
    if (phase !== "report") return;
    QRCode.toDataURL(challengeUrl(), { margin: 1, width: 280, color: { dark: "#221a2b", light: "#fffdf8" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [challengeUrl, phase]);

  function start(nextSeed = seed) {
    setSeed(nextSeed);
    setPhase("playing");
    setCaseIndex(0);
    setSecondsLeft(ROUND_SECONDS);
    setTokensLeft(STARTING_TOKENS);
    setEvidenceUsed(false);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setEvidenceSpent(0);
    setQr("");
    setCopied(false);
  }

  function useEvidence() {
    if (phase !== "playing" || evidenceUsed || tokensLeft <= 0) return;
    setTokensLeft((value) => Math.max(0, value - 1));
    setEvidenceSpent((value) => value + 1);
    setEvidenceUsed(true);
  }

  function nextCase() {
    if (caseIndex >= CASES_PER_RUN - 1) {
      setPhase("report");
      return;
    }
    setCaseIndex((value) => value + 1);
    setSecondsLeft(ROUND_SECONDS);
    setEvidenceUsed(false);
    setSelected(null);
    setPhase("playing");
  }

  function switchLang() {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    document.documentElement.lang = next;
    window.localStorage.setItem("dx3xb_lang", next);
    document.cookie = `dx3xb_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Domain=.dx3xb.com; Secure`;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url.toString());
  }

  function freshSet() {
    const next = makeSeed();
    const url = new URL(window.location.href);
    url.searchParams.set("seed", next);
    url.searchParams.delete("from");
    url.searchParams.delete("score");
    window.history.replaceState(null, "", url.toString());
    setChallengerName("");
    setChallengerScore(0);
    start(next);
  }

  function reportText() {
    return t.shareText(reportName, score, result.title, mastery, challengeUrl());
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function shareReport() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "dx3xb AI Detective", text: reportText(), url: challengeUrl() });
      } else {
        await copyReport();
      }
    } catch {
      /* user cancelled or browser blocked sharing */
    }
  }

  async function downloadReport() {
    if (!reportRef.current || saving) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: "#fff7e7" });
      const link = document.createElement("a");
      link.download = "dx3xb-ai-detective-report.png";
      link.href = dataUrl;
      link.click();
    } catch {
      /* export failure must not affect the completed result */
    } finally {
      setSaving(false);
    }
  }

  const selectedCorrectly = selected === currentCase?.unreliable;
  const run = useMemo(() => ({
    score,
    pct: mastery,
    title: result.title,
    lang,
    handle: reportName,
    stats: { correct: correctCount, total: CASES_PER_RUN, tokensLeft, evidenceSpent, bestStreak, seed, ...(dailyDate ? { dailyDate } : {}), ...(classCode ? { classCode } : {}) },
  }), [bestStreak, classCode, correctCount, dailyDate, evidenceSpent, lang, mastery, reportName, result.title, score, seed, tokensLeft]);

  return (
    <main className="wrap" data-testid="game-root" data-hydrated={hydrated ? "true" : "false"}>
      <div className="backbar">
        <a className="backbtn" href="https://dx3xb.com">← dx3xb</a>
        <button className="langbtn" onClick={switchLang} aria-label="switch language">{t.langBtn}</button>
      </div>

      <header className="heroLab">
        <div>
          <p className="labKicker">{t.kicker}</p>
          <h1 className="pixel title">{t.title}</h1>
          <p className="subtitle pixel">{t.subtitle}</p>
        </div>
        <div className="detectiveMark" aria-hidden="true"><span>?</span><b>🔎</b></div>
      </header>

      {phase === "intro" && (
        <section className="panel introPanel">
          {challengerScore > 0 && <p className="challengeNotice">⚡ {t.challenge(challengerName, challengerScore)}</p>}
          <p className="introText">{t.intro}</p>
          <div className="rules">
            {t.rules.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <div className="actions">
            <button className="btn coral" onClick={() => start()}>{t.start}</button>
            <button className="btn ghost" onClick={freshSet}>{t.newSet}</button>
          </div>
        </section>
      )}

      {(phase === "playing" || phase === "feedback") && currentCase && (
        <>
          <section className="hud" aria-label="game status">
            <div><b>{caseIndex + 1}/{CASES_PER_RUN}</b><span>{t.hudCase}</span></div>
            <div className={secondsLeft <= 5 ? "danger" : ""}><b>{secondsLeft}s</b><span>{t.hudTime}</span></div>
            <div><b>{"◆".repeat(tokensLeft) || "0"}</b><span>{t.hudTokens}</span></div>
            <div><b>{score}</b><span>{t.hudScore}</span></div>
          </section>

          <section className="gamePanel" aria-live="polite">
            <div className="caseMeta"><span>CASE {String(caseIndex + 1).padStart(2, "0")}</span><span>{currentCase.category[lang]}</span></div>
            <h2>{currentCase.prompt[lang]}</h2>
            <p className="question pixel">{t.question}</p>
            <div className="claimList">
              {currentCase.claims[lang].map((claim, index) => {
                const isWeak = index === currentCase.unreliable;
                const isPicked = index === selected;
                const state = phase === "feedback" ? `${isWeak ? " weak" : ""}${isPicked ? " picked" : ""}` : "";
                return (
                  <button
                    key={claim}
                    className={`claim${state}`}
                    onClick={() => submitAnswer(index)}
                    disabled={phase !== "playing"}
                    aria-label={`claim ${index + 1}: ${claim}`}
                  >
                    <span className="claimNo">{index + 1}</span><span>{claim}</span>
                  </button>
                );
              })}
            </div>

            {phase === "playing" ? (
              <div className="evidenceBar">
                <button className="btn teal" onClick={useEvidence} disabled={evidenceUsed || tokensLeft <= 0}>
                  {evidenceUsed ? t.verified : tokensLeft <= 0 ? t.outOfTokens : t.verify}
                </button>
                {evidenceUsed && <p>🔎 {currentCase.evidence[lang]}</p>}
              </div>
            ) : (
              <div className={`feedback ${selectedCorrectly ? "ok" : "no"}`}>
                <h3 className="pixel">{selected === -1 ? t.timeout : selectedCorrectly ? t.correct : t.wrong}</h3>
                <p><b>{t.answer}：</b>{currentCase.claims[lang][currentCase.unreliable]}</p>
                <p><b>{t.evidence}：</b>{currentCase.explanation[lang]}</p>
                <div className="lesson"><span>{t.lesson}</span><strong>{currentCase.lesson[lang]}</strong></div>
                <button className="btn coral" onClick={nextCase}>{caseIndex >= CASES_PER_RUN - 1 ? t.report : t.next}</button>
              </div>
            )}
          </section>
        </>
      )}

      {phase === "report" && (
        <section className="resultShell">
          <div className="reportCard" ref={reportRef}>
            <div className="reportTop"><p className="labKicker">{t.reportKicker}</p><span>CASE CLOSED</span></div>
            <p className="issued">{t.issued}</p>
            <h2 className="pixel resultName">{reportName}</h2>
            <h3 className="pixel resultTitle">{result.title}</h3>
            <p className="resultDesc">{result.desc}</p>
            <div className="mastery"><b>{mastery}<span>%</span></b><p>{t.mastery}</p></div>
            <div className="reportGrid">
              <div><b>{correctCount}/{CASES_PER_RUN}</b><span>{t.stats.correct}</span></div>
              <div><b>{tokensLeft}/{STARTING_TOKENS}</b><span>{t.stats.tokens}</span></div>
              <div><b>{bestStreak}</b><span>{t.stats.streak}</span></div>
              <div><b>{score}</b><span>{t.stats.score}</span></div>
            </div>
            <div className="learningCard"><span className="pixel">{t.learning}</span><strong>{t.learningText}</strong></div>
            {challengerScore > 0 && (
              <p className={`challengeResult ${score >= challengerScore ? "win" : "lose"}`}>
                {score >= challengerScore ? t.challengeWin(score - challengerScore) : t.challengeLose(challengerScore - score)}
              </p>
            )}
            <div className="reportShare">
              {qr && <img src={qr} alt="challenge QR code" />}
              <div><p className="pixel">{t.qr}</p><small>ai-detective.dx3xb.com</small></div>
            </div>
            <p className="fineprint">{t.disclaimer}</p>
          </div>

          <AiQuestFooter lang={lang} run={run} />

          <div className="actions resultActions">
            <button className="btn coral" onClick={downloadReport} disabled={saving}>{t.download}</button>
            <button className="btn teal" onClick={shareReport}>{t.share}</button>
            <button className="btn ghost" onClick={copyReport}>{copied ? t.copied : t.copy}</button>
            <button className="btn ghost" onClick={() => start()}>{t.replay}</button>
            <button className="btn ghost" onClick={freshSet}>{t.another}</button>
          </div>
        </section>
      )}
    </main>
  );
}
