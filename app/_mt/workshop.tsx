"use client";
// AI 游戏工坊：Gemini 只生成受控 JSON 规格，玩家端由这个本地引擎渲染，不执行用户代码。
import { useEffect, useMemo, useState } from "react";
import { clean, type Lang, type PlayerEvents } from "./types";

export type WorkshopGenre = "tap" | "catch" | "sequence";
export type WorkshopEntity = { emoji: string; label: string; points: number };
export type WorkshopConfig = {
  intro: string;
  genre: WorkshopGenre;
  durationSec: number;
  targetScore: number;
  lives: number;
  heroEmoji: string;
  heroLabel: string;
  collectibles: WorkshopEntity[];
  hazards: WorkshopEntity[];
  sequence: string[];
  winText: string;
  loseText: string;
};

const DEFAULT_GOOD: WorkshopEntity[] = [
  { emoji: "⭐", label: "星星", points: 1 },
  { emoji: "💎", label: "宝石", points: 2 },
];
const DEFAULT_BAD: WorkshopEntity[] = [
  { emoji: "💣", label: "陷阱", points: -1 },
  { emoji: "🕳️", label: "坑", points: -1 },
];

export function wsEmpty(lang: Lang = "zh"): WorkshopConfig {
  return {
    intro: lang === "zh" ? "AI 游戏工坊示例：收集星星，避开陷阱。" : "AI workshop sample: collect stars, avoid traps.",
    genre: "tap",
    durationSec: 30,
    targetScore: 10,
    lives: 3,
    heroEmoji: "🚀",
    heroLabel: lang === "zh" ? "玩家" : "Player",
    collectibles: DEFAULT_GOOD,
    hazards: DEFAULT_BAD,
    sequence: ["🚀", "⭐", "💎", "🌙"],
    winText: lang === "zh" ? "通关成功！" : "You cleared it!",
    loseText: lang === "zh" ? "差一点，再来一次。" : "So close. Try again.",
  };
}

const genreOf = (v: unknown): WorkshopGenre => (v === "catch" || v === "sequence" ? v : "tap");
const n = (v: unknown, min: number, max: number, fallback: number) => {
  const x = Math.round(Number(v));
  return Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
};
const entity = (e: Record<string, unknown>, fallback: WorkshopEntity): WorkshopEntity => ({
  emoji: clean(e?.emoji || fallback.emoji, 6) || fallback.emoji,
  label: clean(e?.label || fallback.label, 32) || fallback.label,
  points: n(e?.points, -5, 5, fallback.points),
});

export function wsValidate(input: unknown): WorkshopConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const goodRaw = (Array.isArray(o.collectibles) ? o.collectibles.slice(0, 8) : []) as Record<string, unknown>[];
  const badRaw = (Array.isArray(o.hazards) ? o.hazards.slice(0, 8) : []) as Record<string, unknown>[];
  const sequenceRaw = (Array.isArray(o.sequence) ? o.sequence.slice(0, 12) : []) as unknown[];
  const collectibles = goodRaw.map((x, i) => entity(x, DEFAULT_GOOD[i % DEFAULT_GOOD.length])).filter((x) => x.emoji.trim());
  const hazards = badRaw.map((x, i) => entity(x, DEFAULT_BAD[i % DEFAULT_BAD.length])).filter((x) => x.emoji.trim());
  return {
    intro: clean(o.intro, 240),
    genre: genreOf(o.genre),
    durationSec: n(o.durationSec, 10, 120, 30),
    targetScore: n(o.targetScore, 1, 99, 10),
    lives: n(o.lives, 1, 9, 3),
    heroEmoji: clean(o.heroEmoji, 6) || "🎮",
    heroLabel: clean(o.heroLabel, 32) || "Player",
    collectibles: collectibles.length ? collectibles : DEFAULT_GOOD,
    hazards: hazards.length ? hazards : DEFAULT_BAD,
    sequence: sequenceRaw.map((x) => clean(x, 6)).filter(Boolean).slice(0, 12),
    winText: clean(o.winText, 100) || "You win!",
    loseText: clean(o.loseText, 100) || "Try again.",
  };
}

export function wsPublishable(c: WorkshopConfig): boolean {
  const cfg = wsValidate(c);
  return cfg.intro.trim().length >= 4 && cfg.collectibles.length >= 1 && cfg.hazards.length >= 1 && (cfg.genre !== "sequence" || cfg.sequence.length >= 3);
}

const T = {
  zh: {
    start: "开始游戏",
    replay: "再玩一次",
    score: "分数",
    time: "时间",
    lives: "生命",
    catchHint: "点左右移动，接住好东西，避开陷阱",
    sequenceHint: "记住顺序，然后按顺序点击",
    showing: "记住它",
    yourTurn: "轮到你",
    share: "分享",
    copied: "已复制",
    empty: "这个 AI 游戏还没生成好。",
  },
  en: {
    start: "START",
    replay: "PLAY AGAIN",
    score: "SCORE",
    time: "TIME",
    lives: "LIVES",
    catchHint: "Move left/right, catch good stuff, avoid hazards",
    sequenceHint: "Memorize the sequence, then tap in order",
    showing: "MEMORIZE",
    yourTurn: "YOUR TURN",
    share: "SHARE",
    copied: "COPIED",
    empty: "This AI game is not ready yet.",
  },
} as const;

function pickEntity(cfg: WorkshopConfig) {
  const pool = [...cfg.collectibles, ...cfg.collectibles, ...cfg.hazards];
  return pool[Math.floor(Math.random() * pool.length)] ?? cfg.collectibles[0];
}

export function WorkshopPlayer({
  config,
  title,
  lang,
  slug,
  preview = false,
  onStart,
  onComplete,
  onShare,
}: {
  config: WorkshopConfig;
  title: string;
  slug?: string;
  lang: Lang;
  preview?: boolean;
} & PlayerEvents) {
  const t = T[lang];
  const cfg = useMemo(() => wsValidate(config), [config]);
  const [phase, setPhase] = useState<"intro" | "play" | "result">("intro");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(cfg.lives);
  const [left, setLeft] = useState(cfg.durationSec);
  const [won, setWon] = useState(false);
  const [current, setCurrent] = useState<WorkshopEntity>(() => pickEntity(cfg));
  const [lane, setLane] = useState(1);
  const [fallLane, setFallLane] = useState(1);
  const [seqIndex, setSeqIndex] = useState(0);
  const [showing, setShowing] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhase("intro");
    setScore(0);
    setLives(cfg.lives);
    setLeft(cfg.durationSec);
    setSeqIndex(0);
    setShowing(true);
  }, [cfg]);

  useEffect(() => {
    if (phase !== "play" || cfg.genre === "sequence") return;
    const id = window.setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          finish(score >= cfg.targetScore);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg.genre, cfg.targetScore, score]);

  useEffect(() => {
    if (phase !== "play" || cfg.genre !== "catch") return;
    const id = window.setInterval(() => {
      const e = pickEntity(cfg);
      setCurrent(e);
      setFallLane(Math.floor(Math.random() * 3));
      setScore((s) => {
        if (fallLane !== lane) return s;
        const next = Math.max(0, s + e.points);
        if (next >= cfg.targetScore) finish(true);
        if (e.points < 0) setLives((life) => {
          const nextLife = life - 1;
          if (nextLife <= 0) finish(false);
          return Math.max(0, nextLife);
        });
        return next;
      });
    }, 900);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg.genre, lane, fallLane]);

  useEffect(() => {
    if (phase !== "play" || cfg.genre !== "sequence" || !showing) return;
    const id = window.setTimeout(() => setShowing(false), Math.max(1600, cfg.sequence.length * 520));
    return () => window.clearTimeout(id);
  }, [phase, cfg.genre, cfg.sequence.length, showing]);

  function begin() {
    setScore(0);
    setLives(cfg.lives);
    setLeft(cfg.durationSec);
    setWon(false);
    setCurrent(pickEntity(cfg));
    setLane(1);
    setFallLane(Math.floor(Math.random() * 3));
    setSeqIndex(0);
    setShowing(true);
    setPhase("play");
    onStart?.();
  }
  function finish(ok: boolean) {
    setWon(ok);
    setPhase("result");
    onComplete?.();
  }
  function tap(e: WorkshopEntity) {
    const next = Math.max(0, score + e.points);
    if (e.points < 0) {
      const nextLives = lives - 1;
      setLives(Math.max(0, nextLives));
      if (nextLives <= 0) return finish(false);
    }
    setScore(next);
    if (next >= cfg.targetScore) return finish(true);
    setCurrent(pickEntity(cfg));
  }
  function chooseSequence(emoji: string) {
    if (showing) return;
    if (emoji !== cfg.sequence[seqIndex]) return finish(false);
    const next = seqIndex + 1;
    setSeqIndex(next);
    setScore(next);
    if (next >= cfg.sequence.length) finish(true);
  }
  async function share() {
    if (preview) return;
    const url = slug ? `https://dx3xb.com/u/${slug}` : "https://dx3xb.com";
    try {
      onShare?.();
      await navigator.clipboard.writeText(`${title || "dx3xb"} · ${won ? cfg.winText : cfg.loseText}\n${url}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!wsPublishable(cfg)) return <p style={{ color: "var(--ink-soft)" }}>{t.empty}</p>;

  const sequenceChoices = Array.from(new Set([...cfg.sequence, ...cfg.collectibles.map((x) => x.emoji), ...cfg.hazards.map((x) => x.emoji)])).slice(0, 10);

  return (
    <div className="ws">
      <style dangerouslySetInnerHTML={{ __html: WS_STYLE }} />
      {phase === "intro" && (
        <div className="ws-card ws-intro">
          <div className="ws-hero">{cfg.heroEmoji}</div>
          <h2 className="pixel ws-title">{title || "AI 游戏工坊"}</h2>
          <p className="ws-introtext">{cfg.intro}</p>
          <button className="ws-btn coral" onClick={begin}>{t.start}</button>
        </div>
      )}
      {phase === "play" && cfg.genre === "tap" && (
        <div className="ws-card">
          <Hud t={t} score={score} left={left} lives={lives} />
          <button className={`ws-target ${current.points < 0 ? "bad" : "good"}`} onClick={() => tap(current)}>
            <span>{current.emoji}</span>
            <b>{current.label}</b>
          </button>
        </div>
      )}
      {phase === "play" && cfg.genre === "catch" && (
        <div className="ws-card">
          <Hud t={t} score={score} left={left} lives={lives} />
          <p className="ws-hint">{t.catchHint}</p>
          <div className="ws-lanes">
            {[0, 1, 2].map((i) => (
              <button key={i} className={`ws-lane ${lane === i ? "on" : ""}`} onClick={() => setLane(i)}>
                <span className={fallLane === i ? "fall" : ""}>{fallLane === i ? current.emoji : ""}</span>
                <b>{lane === i ? cfg.heroEmoji : ""}</b>
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === "play" && cfg.genre === "sequence" && (
        <div className="ws-card">
          <Hud t={t} score={score} left={cfg.sequence.length} lives={lives} />
          <p className="ws-hint">{showing ? t.showing : t.yourTurn}</p>
          {showing ? (
            <div className="ws-seqshow">{cfg.sequence.map((x, i) => <span key={`${x}-${i}`}>{x}</span>)}</div>
          ) : (
            <div className="ws-choices">{sequenceChoices.map((x) => <button key={x} onClick={() => chooseSequence(x)}>{x}</button>)}</div>
          )}
        </div>
      )}
      {phase === "result" && (
        <div className="ws-card ws-result">
          <div className="ws-hero">{won ? "🏆" : "💥"}</div>
          <h2 className="pixel ws-title">{won ? cfg.winText : cfg.loseText}</h2>
          <p className="ws-introtext">{t.score}: {score}</p>
          <div className="ws-actions">
            <button className="ws-btn coral" onClick={begin}>{t.replay}</button>
            {!preview && <button className="ws-btn teal" onClick={share}>{copied ? t.copied : t.share}</button>}
          </div>
        </div>
      )}
    </div>
  );
}

type WsText = Record<"score" | "time" | "lives", string>;
function Hud({ t, score, left, lives }: { t: WsText; score: number; left: number; lives: number }) {
  return (
    <div className="ws-hud">
      <span>{t.score} <b>{score}</b></span>
      <span>{t.time} <b>{left}</b></span>
      <span>{t.lives} <b>{lives}</b></span>
    </div>
  );
}

export function WorkshopEditor({ config, onChange, lang }: { config: WorkshopConfig; onChange: (c: WorkshopConfig) => void; lang: Lang }) {
  const c = wsValidate(config);
  const t =
    lang === "zh"
      ? { intro: "玩法说明", genre: "玩法类型", tap: "点按收集", catch: "三路接物", sequence: "记忆序列", hero: "玩家符号", target: "目标分", duration: "时长", lives: "生命", win: "成功文案", lose: "失败文案", good: "好东西", bad: "陷阱", seq: "记忆序列（用空格分隔 emoji）" }
      : { intro: "Intro", genre: "Game type", tap: "Tap", catch: "Catch", sequence: "Sequence", hero: "Hero", target: "Target", duration: "Time", lives: "Lives", win: "Win copy", lose: "Lose copy", good: "Collectibles", bad: "Hazards", seq: "Sequence (space-separated emoji)" };
  const patch = (p: Partial<WorkshopConfig>) => onChange(wsValidate({ ...c, ...p }));
  const setEnt = (key: "collectibles" | "hazards", i: number, p: Partial<WorkshopEntity>) => patch({ [key]: c[key].map((x, j) => (j === i ? { ...x, ...p } : x)) } as Partial<WorkshopConfig>);
  return (
    <div className="eform">
      <input className="ein" placeholder={t.intro} value={c.intro} maxLength={240} onChange={(e) => patch({ intro: e.target.value })} />
      <h3 className="ehead">{t.genre}</h3>
      <div className="eseg">
        {(["tap", "catch", "sequence"] as WorkshopGenre[]).map((g) => <button key={g} className={c.genre === g ? "on" : ""} onClick={() => patch({ genre: g })}>{t[g]}</button>)}
      </div>
      <div className="erow">
        <input className="ein emoji" value={c.heroEmoji} maxLength={4} onChange={(e) => patch({ heroEmoji: e.target.value })} />
        <input className="ein grow" placeholder={t.hero} value={c.heroLabel} maxLength={32} onChange={(e) => patch({ heroLabel: e.target.value })} />
      </div>
      <div className="erow">
        <input className="ein" type="number" style={{ width: 110 }} value={c.targetScore} onChange={(e) => patch({ targetScore: Number(e.target.value) })} />
        <input className="ein" type="number" style={{ width: 110 }} value={c.durationSec} onChange={(e) => patch({ durationSec: Number(e.target.value) })} />
        <input className="ein" type="number" style={{ width: 110 }} value={c.lives} onChange={(e) => patch({ lives: Number(e.target.value) })} />
      </div>
      <input className="ein" placeholder={t.win} value={c.winText} maxLength={100} onChange={(e) => patch({ winText: e.target.value })} />
      <input className="ein" placeholder={t.lose} value={c.loseText} maxLength={100} onChange={(e) => patch({ loseText: e.target.value })} />
      <h3 className="ehead">{t.good}</h3>
      {c.collectibles.map((x, i) => (
        <div key={i} className="erow">
          <input className="ein emoji" value={x.emoji} maxLength={4} onChange={(e) => setEnt("collectibles", i, { emoji: e.target.value })} />
          <input className="ein grow" value={x.label} maxLength={32} onChange={(e) => setEnt("collectibles", i, { label: e.target.value })} />
          <input className="ein" type="number" style={{ width: 82 }} value={x.points} onChange={(e) => setEnt("collectibles", i, { points: Number(e.target.value) })} />
        </div>
      ))}
      <h3 className="ehead">{t.bad}</h3>
      {c.hazards.map((x, i) => (
        <div key={i} className="erow">
          <input className="ein emoji" value={x.emoji} maxLength={4} onChange={(e) => setEnt("hazards", i, { emoji: e.target.value })} />
          <input className="ein grow" value={x.label} maxLength={32} onChange={(e) => setEnt("hazards", i, { label: e.target.value })} />
          <input className="ein" type="number" style={{ width: 82 }} value={x.points} onChange={(e) => setEnt("hazards", i, { points: Number(e.target.value) })} />
        </div>
      ))}
      <h3 className="ehead">{t.seq}</h3>
      <input className="ein" value={c.sequence.join(" ")} maxLength={80} onChange={(e) => patch({ sequence: e.target.value.split(/\s+/).filter(Boolean) })} />
    </div>
  );
}

const WS_STYLE = `
.ws { font-family: var(--font-vt323), monospace; }
.ws-card { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; display: grid; gap: 14px; }
.ws-intro, .ws-result { text-align: center; justify-items: center; }
.ws-hero { width: 82px; height: 82px; display: grid; place-items: center; border: 4px solid var(--line); box-shadow: 5px 5px 0 var(--ink); background: var(--cream); font-size: 44px; }
.ws-title { margin: 0; font-size: clamp(24px, 7vw, 38px); }
.ws-introtext, .ws-hint { font-size: 19px; color: var(--ink-soft); margin: 0; }
.ws-hud { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ws-hud span { border: 3px solid var(--line); background: var(--cream); padding: 8px; text-align: center; font-family: var(--font-press), monospace; font-size: 9px; }
.ws-hud b { display: block; font-size: 15px; color: var(--coral); margin-top: 4px; }
.ws-target { min-height: 190px; cursor: pointer; border: 4px solid var(--line); box-shadow: 7px 7px 0 var(--ink); background: var(--cream); display: grid; place-items: center; gap: 4px; padding: 20px; }
.ws-target.good { background: #e9fbf8; }
.ws-target.bad { background: #fff0ee; }
.ws-target span { font-size: 70px; line-height: 1; }
.ws-target b { font-family: var(--font-vt323), monospace; font-size: 24px; color: var(--ink); }
.ws-lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-height: 220px; }
.ws-lane { position: relative; cursor: pointer; border: 3px solid var(--line); background: var(--cream); box-shadow: 4px 4px 0 var(--ink); overflow: hidden; }
.ws-lane.on { background: #e9fbf8; }
.ws-lane b { position: absolute; bottom: 10px; left: 0; right: 0; font-size: 42px; }
.ws-lane .fall { position: absolute; top: 12px; left: 0; right: 0; font-size: 42px; animation: wsFall .85s linear infinite; }
@keyframes wsFall { from { transform: translateY(-20px); } to { transform: translateY(145px); } }
.ws-seqshow, .ws-choices { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.ws-seqshow span, .ws-choices button { min-width: 54px; min-height: 54px; border: 3px solid var(--line); background: var(--cream); box-shadow: 3px 3px 0 var(--ink); display: grid; place-items: center; font-size: 30px; }
.ws-choices button { cursor: pointer; }
.ws-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.ws-btn { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line); box-shadow: var(--shadow); padding: 13px 15px; color: #fff; background: var(--coral); }
.ws-btn.teal { background: var(--teal); }
.ws-btn:active, .ws-target:active, .ws-lane:active, .ws-choices button:active { transform: translate(3px,3px); box-shadow: none; }
@media (max-width: 430px) {
  .ws-hud { gap: 5px; }
  .ws-card { padding: 16px; }
  .ws-target { min-height: 160px; }
  .ws-target span { font-size: 58px; }
}
`;
