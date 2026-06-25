"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import {
  getTrioProgress,
  getProfileHandle,
  claimAccount,
  ensureSession,
  GAME_URL,
  TRIO_GAMES,
  TRIO_REPORT_URL,
  type TrioGame,
  type TrioProgress,
} from "../dx3xb-trio";

type Lang = "zh" | "en";

const GAME_NAME: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "色差猎人", "dont-click-wrong": "不要点错", "instant-memory": "瞬间记忆" },
  en: { "color-hunter": "color hunter", "dont-click-wrong": "Don't Tap Wrong", "instant-memory": "instant memory" },
};
const GAME_DIM: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "感官", "dont-click-wrong": "反应", "instant-memory": "记忆" },
  en: { "color-hunter": "SENSE", "dont-click-wrong": "REACT", "instant-memory": "MEMORY" },
};

// 20 档综合称号 + 辣评（低 → 高）
const TITLES: { zh: string; en: string; rz: string; re: string }[] = [
  { zh: "待机土豆", en: "Idle Potato", rz: "三个传感器集体罢工，建议先把自己开机。", re: "All three sensors on strike. Try turning yourself off and on again." },
  { zh: "信号断流", en: "No Signal", rz: "神经还在缓冲，进度条卡在 1%。", re: "Your nerves are still buffering, stuck at 1%." },
  { zh: "人形错觉", en: "Walking Glitch", rz: "感官、反应、记忆挑一个能用的——你全选了「否」。", re: "Pick one working faculty. You picked 'none'." },
  { zh: "节假日大脑", en: "Brain on Vacation", rz: "大脑挂了自动回复：「稍后再试」。", re: "Your brain set an out-of-office: 'try again later'." },
  { zh: "平平无奇", en: "Gloriously Average", rz: "不好也不坏，像便利店放到打烊的关东煮。", re: "Not bad, not good — like gas-station sushi at closing time." },
  { zh: "苏醒中", en: "Booting Up", rz: "系统加载至 27%，请勿断电。", re: "Loading... 27%. Please do not unplug." },
  { zh: "凡人样本", en: "Standard Human", rz: "教科书级的「正常人」，科学家拿你当对照组。", re: "Textbook normal — scientists would use you as the control group." },
  { zh: "偶有灵光", en: "Occasional Spark", rz: "三个里一个在线，另外两个在摸鱼。", re: "One faculty online, two clocked out." },
  { zh: "进阶学徒", en: "Apprentice", rz: "开始有点东西了，再练练别浪。", re: "Showing promise. Keep grinding, stay humble." },
  { zh: "都市精英", en: "City Slicker", rz: "通勤路上眼疾手快抢座位那种水平。", re: "Sharp enough to win the morning-commute seat war." },
  { zh: "六边形雏形", en: "Rough Hexagon", rz: "三维都站上及格线，雷达图开始好看了。", re: "All three above the line — the radar's getting pretty." },
  { zh: "反应猎手", en: "Reflex Hunter", rz: "手比脑快半拍，好在方向是对的。", re: "Hands outrun your brain, but at least they aim right." },
  { zh: "感官特工", en: "Sensory Agent", rz: "颜色、节奏、序列，你开始全都收得到。", re: "Color, tempo, sequence — you catch them all now." },
  { zh: "记忆宫殿管家", en: "Palace Steward", rz: "脑内开了个仓库，进出有序。", re: "You run a tidy warehouse upstairs." },
  { zh: "三料选手", en: "Triple Threat", rz: "三项都能打，朋友圈那个「什么都会一点」的人。", re: "Solid at all three — the friend who's 'a bit good at everything'." },
  { zh: "神经超频", en: "Overclocked", rz: "大脑风扇开始狂转，小心烫手。", re: "Brain fans spinning up. Handle with care." },
  { zh: "人体处理器", en: "Wetware CPU", rz: "延迟低到离谱，建议去隔壁电竞战队试训。", re: "Latency absurdly low. Go try out for an esports team." },
  { zh: "六边形战士", en: "Hexagon Warrior", rz: "雷达图饱满到没有短板，教练看了想哭。", re: "A radar with zero weak side. Coaches weep." },
  { zh: "感官猎手·神", en: "Apex Hunter", rz: "你不是在玩游戏，是游戏在被你读取。", re: "You don't play the games — you read them." },
  { zh: "三体合一·超脑", en: "The Singularity", rz: "感官、反应、记忆三位一体，百分位已无法形容你。", re: "Sense, reflex, memory as one — percentiles can no longer contain you." },
];

const COPY = {
  zh: {
    back: "← dx3xb",
    langBtn: "EN",
    kicker: "感官与脑力三件套",
    introTitle: "三件套挑战",
    introDesc: "三关分别测你的感官辨别、反应控制、短时记忆。三关都打完，解锁你的综合脑力报告。",
    start: "开始挑战",
    replay: "重玩",
    play: "去玩 →",
    doneTag: "已完成",
    progressLabel: (d: number) => `进度 ${d}/3`,
    missingTip: (n: number) => `还差 ${n} 关就能拿到总报告：`,
    reportKicker: "dx3xb 三件套报告",
    issuedTo: "签发给",
    anon: "匿名玩家",
    combinedCaption: "的人类被你的综合脑力击败",
    dim: { "color-hunter": "感官辨别", "dont-click-wrong": "反应控制", "instant-memory": "短时记忆" } as Record<TrioGame, string>,
    download: "下载报告图片",
    share: "分享三件套",
    copy: "复制战报",
    copied: "已复制",
    trainingCta: "进入思维训练程序",
    trainingSoon: "敬请期待",
    qrTitle: "扫码挑战三件套",
    qrCta: "把这张图发给朋友，看谁的综合脑力更高。",
    claimTitle: "注册认领你的账号",
    claimHint: "保存全部战报、解锁你的空间，换设备也能找回。",
    emailPh: "你的邮箱",
    send: "发送登录链接",
    sending: "发送中…",
    sent: "登录链接已发到邮箱 ✉️ 去收信点开即可",
    err: "发送失败，换个邮箱再试",
    challenger: (name: string, s: number) => `${name} 的三件套综合分 ${s}，敢不敢超过 ta？`,
    shareText: (name: string, s: number, title: string, roast: string, url: string) =>
      `我「${name}」在 dx3xb 感官与脑力三件套综合击败了 ${s}% 的人，称号「${title}」！${roast} 来比比：${url}`,
    loading: "正在读取你的三件套进度…",
  },
  en: {
    back: "← dx3xb",
    langBtn: "中",
    kicker: "Sensory & Brainpower Trio",
    introTitle: "The Trio Challenge",
    introDesc: "Three games test your sensory discrimination, reaction control and short-term memory. Finish all three to unlock your combined brain report.",
    start: "START THE TRIO",
    replay: "REPLAY",
    play: "PLAY →",
    doneTag: "DONE",
    progressLabel: (d: number) => `${d}/3 done`,
    missingTip: (n: number) => `${n} more to unlock your full report:`,
    reportKicker: "dx3xb trio report",
    issuedTo: "ISSUED TO",
    anon: "anon player",
    combinedCaption: "of humanity, out-brained",
    dim: { "color-hunter": "SENSE", "dont-click-wrong": "REACTION", "instant-memory": "MEMORY" } as Record<TrioGame, string>,
    download: "SAVE IMAGE",
    share: "SHARE TRIO",
    copy: "COPY REPORT",
    copied: "COPIED",
    trainingCta: "ENTER MIND-TRAINING",
    trainingSoon: "COMING SOON",
    qrTitle: "SCAN FOR THE TRIO",
    qrCta: "Send this card to a friend — see whose brain ranks higher.",
    claimTitle: "Claim your account",
    claimHint: "Save every report, unlock your space, recover it on any device.",
    emailPh: "your email",
    send: "Send login link",
    sending: "Sending…",
    sent: "Magic link sent ✉️ check your inbox",
    err: "Failed — try another email",
    challenger: (name: string, s: number) => `${name} scored ${s} on the trio. Can you beat them?`,
    shareText: (name: string, s: number, title: string, roast: string, url: string) =>
      `${name} out-brained ${s}% of humanity on the dx3xb Sensory & Brainpower Trio — rank "${title}"! ${roast} Beat me: ${url}`,
    loading: "Reading your trio progress…",
  },
} as const;

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  const s = window.localStorage.getItem("dx3xb_lang");
  if (s === "zh" || s === "en") return s;
  return "en";
}

const RADIUS = 78;
const CX = 110;
const CY = 100;
const ANGLES: Record<TrioGame, number> = {
  "color-hunter": -90,
  "dont-click-wrong": 30,
  "instant-memory": 150,
};
function pt(game: TrioGame, v: number) {
  const a = (ANGLES[game] * Math.PI) / 180;
  return [CX + RADIUS * (v / 100) * Math.cos(a), CY + RADIUS * (v / 100) * Math.sin(a)];
}
function ring(scale: number) {
  return TRIO_GAMES.map((g) => pt(g, scale * 100).join(",")).join(" ");
}

function Radar({ vals, lang }: { vals: Record<TrioGame, number>; lang: Lang }) {
  const poly = TRIO_GAMES.map((g) => pt(g, vals[g]).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 210" width="100%" style={{ maxWidth: 260, display: "block", margin: "0 auto" }} shapeRendering="geometricPrecision">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={ring(s)} fill="none" stroke="#2b2233" strokeWidth={s === 1 ? 2.5 : 1} opacity={s === 1 ? 1 : 0.3} />
      ))}
      {TRIO_GAMES.map((g) => {
        const [x, y] = pt(g, 100);
        return <line key={g} x1={CX} y1={CY} x2={x} y2={y} stroke="#2b2233" strokeWidth={1} opacity={0.3} />;
      })}
      <polygon points={poly} fill="rgba(255,107,107,0.45)" stroke="#ff6b6b" strokeWidth={3} />
      {TRIO_GAMES.map((g) => {
        const [x, y] = pt(g, vals[g]);
        return <rect key={g} x={x - 3} y={y - 3} width={6} height={6} fill="#ff6b6b" stroke="#2b2233" strokeWidth={1.5} />;
      })}
      {TRIO_GAMES.map((g) => {
        const [x, y] = pt(g, 122);
        return (
          <text key={g} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-press), monospace" fontSize={9} fill="#2b2233">
            {GAME_DIM[lang][g]}
          </text>
        );
      })}
    </svg>
  );
}

export default function TrioPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [progress, setProgress] = useState<TrioProgress | null>(null);
  const [handle, setHandle] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [claim, setClaim] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [fromName, setFromName] = useState("");
  const [fromScore, setFromScore] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const t = COPY[lang];

  useEffect(() => {
    setLang(getInitialLang());
    const p = new URLSearchParams(window.location.search);
    setFromName((p.get("from") || "").replace(/[<>]/g, "").slice(0, 24));
    setFromScore(Number(p.get("score") || 0));
    void ensureSession();
    (async () => {
      const [prog, h] = await Promise.all([getTrioProgress(), getProfileHandle()]);
      setProgress(prog);
      if (h) setHandle(h);
    })();
  }, []);

  const vals = useMemo<Record<TrioGame, number>>(
    () => ({
      "color-hunter": progress?.best["color-hunter"]?.pct ?? 0,
      "dont-click-wrong": progress?.best["dont-click-wrong"]?.pct ?? 0,
      "instant-memory": progress?.best["instant-memory"]?.pct ?? 0,
    }),
    [progress],
  );
  const combined = Math.round((vals["color-hunter"] + vals["dont-click-wrong"] + vals["instant-memory"]) / 3);
  const tier = TITLES[Math.min(TITLES.length - 1, Math.max(0, Math.floor(combined / 5)))];
  const allDone = !!progress?.allDone;
  const name = handle || t.anon;

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === "zh" ? "en" : "zh";
      window.localStorage.setItem("dx3xb_lang", next);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState(null, "", url.toString());
      return next;
    });
  }

  function challengeUrl() {
    return `${TRIO_REPORT_URL}?from=${encodeURIComponent(handle || "")}&score=${combined}&lang=${lang}`;
  }

  useEffect(() => {
    if (!allDone) {
      setQr("");
      return;
    }
    let active = true;
    QRCode.toDataURL(challengeUrl(), { margin: 1, width: 320, color: { dark: "#2b2233", light: "#fffdf8" } })
      .then((d) => active && setQr(d))
      .catch(() => active && setQr(""));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, combined, lang, handle]);

  function reportText() {
    return t.shareText(name, combined, lang === "zh" ? tier.zh : tier.en, lang === "zh" ? tier.rz : tier.re, challengeUrl());
  }
  async function shareResult() {
    try {
      if (navigator.share) await navigator.share({ title: "dx3xb trio", text: reportText(), url: challengeUrl() });
      else {
        await navigator.clipboard.writeText(reportText());
        setCopied(true);
      }
    } catch {
      /* cancelled */
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
      const a = document.createElement("a");
      a.download = `dx3xb-trio-${handle || "report"}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      /* capture failed */
    } finally {
      setSaving(false);
    }
  }
  async function sendLink() {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setClaim("error");
      return;
    }
    setClaim("sending");
    const { error } = await claimAccount(e, TRIO_REPORT_URL + `?lang=${lang}`);
    setClaim(error ? "error" : "sent");
  }

  const langQ = `?lang=${lang}`;

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="tbar">
        <a className="tbtn" href="https://dx3xb.com">{t.back}</a>
        <button className="tbtn yellow" onClick={toggleLang} aria-label="switch language">{t.langBtn}</button>
      </div>

      <section className="thead">
        <p className="tkick">{t.kicker}</p>
        <h1 className="pixel ttitle">{t.introTitle}</h1>
      </section>

      {!progress ? (
        <section className="panel tpanel"><p>{t.loading}</p></section>
      ) : !allDone ? (
        <section className="panel tpanel">
          {fromName && fromScore > 0 && (
            <div className="tchallenger">{t.challenger(fromName, fromScore)}</div>
          )}
          <p className="tdesc">{t.introDesc}</p>
          <p className="tprog">{t.progressLabel(progress.done)} · {t.missingTip(3 - progress.done)}</p>
          <div className="tgames">
            {TRIO_GAMES.map((g) => {
              const b = progress.best[g];
              return (
                <a key={g} className={`tgame ${b ? "done" : ""}`} href={GAME_URL[g] + langQ}>
                  <b>{GAME_DIM[lang][g]}</b>
                  <span>{GAME_NAME[lang][g]}</span>
                  <em>{b ? `${b.score} · ${t.doneTag}` : t.play}</em>
                </a>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          <div className="reportCard" ref={reportRef}>
            <div className="rhead">
              <p className="rk">{t.reportKicker}</p>
              <span className="rbolt" aria-hidden="true">🧠</span>
            </div>
            <div className="rbody">
              <p className="rissued">{t.issuedTo}</p>
              <p className="rname">{name}</p>
              <h2 className="pixel rtitle">{lang === "zh" ? tier.zh : tier.en}</h2>
              <p className="rroast">&ldquo;{lang === "zh" ? tier.rz : tier.re}&rdquo;</p>

              <Radar vals={vals} lang={lang} />

              <div className="rpct">
                <div className="rpctnum">{combined}<span>%</span></div>
                <p className="rpctcap">{t.combinedCaption}</p>
                <div className="rbar"><i style={{ width: `${combined}%` }} /></div>
              </div>

              <div className="rdims">
                {TRIO_GAMES.map((g) => (
                  <div key={g}>
                    <span>{t.dim[g]}</span>
                    <b className="pixel">{vals[g]}%</b>
                    <em>{progress.best[g]?.score ?? 0}</em>
                  </div>
                ))}
              </div>

              <div className="rqr">
                <div className="rqrframe">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="trio QR" width={92} height={92} style={{ display: "block", imageRendering: "pixelated" }} />
                  ) : (
                    <div style={{ width: 92, height: 92 }} />
                  )}
                </div>
                <div className="rqrtext">
                  <p className="pixel">{t.qrTitle}</p>
                  <p className="rqrcta">{t.qrCta}</p>
                  <p className="rqrurl">dx3xb.com/trio</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tactions">
            <button className="tbig coral" onClick={downloadReport}>{saving ? "…" : t.download}</button>
            <button className="tbig teal" onClick={shareResult}>{t.share}</button>
            <button className="tbig ghost" onClick={copyResult}>{copied ? t.copied : t.copy}</button>
          </div>

          <div className="ttrain">
            <span>{t.trainingCta}</span>
            <em>{t.trainingSoon}</em>
          </div>

          {progress.isAnonymous && (
            <div className="tclaim">
              <h4>{t.claimTitle}</h4>
              <p>{t.claimHint}</p>
              {claim === "sent" ? (
                <p className="tsent">{t.sent}</p>
              ) : (
                <>
                  <div className="trow">
                    <input type="email" inputMode="email" placeholder={t.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendLink()} />
                    <button onClick={sendLink} disabled={claim === "sending"}>{claim === "sending" ? t.sending : t.send}</button>
                  </div>
                  {claim === "error" && <p className="tsent">{t.err}</p>}
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 720px; margin: 0 auto; padding: 22px 16px 60px; }
.panel { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); }
.pixel { font-family: var(--font-press), monospace; letter-spacing: 0.5px; }
.tbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 18px; }
.tbtn { display: inline-block; text-decoration: none; cursor: pointer; font-family: var(--font-press), monospace;
  font-size: 11px; background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.tbtn.yellow { background: var(--yellow); }
.tbtn:active { transform: translate(3px,3px); box-shadow: none; }
.thead { margin: 6px 0 20px; }
.tkick { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 8px; }
.ttitle { margin: 0; font-size: clamp(28px, 8vw, 52px); line-height: 1.05; }
.tpanel { padding: 20px; }
.tdesc { font-size: 20px; line-height: 1.45; margin: 0 0 14px; }
.tprog { font-family: var(--font-press), monospace; font-size: 11px; color: var(--ink-soft); margin: 0 0 14px; }
.tchallenger { background: var(--yellow); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 11px 13px; margin-bottom: 16px; font-size: 18px; }
.tgames { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.tgame { text-decoration: none; color: var(--ink); background: #fff; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink);
  padding: 12px 8px; text-align: center; display: block; }
.tgame.done { background: var(--cream-2); }
.tgame:hover { transform: translate(-1px,-1px); box-shadow: 4px 4px 0 var(--ink); }
.tgame b { display: block; font-family: var(--font-press), monospace; font-size: 11px; }
.tgame span { display: block; font-size: 15px; margin: 4px 0; }
.tgame em { display: block; font-style: normal; font-family: var(--font-press), monospace; font-size: 9px; color: var(--teal); }
.tgame.done em { color: var(--coral); }

.reportCard { background: #fff; border: 4px solid var(--line); box-shadow: 10px 10px 0 var(--ink); overflow: hidden; margin-bottom: 18px; }
.rhead { background: var(--ink); color: var(--cream); display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; }
.rk { font-family: var(--font-press), monospace; font-size: 11px; letter-spacing: 1px; margin: 0; }
.rbolt { font-size: 22px; }
.rbody { padding: 20px; text-align: center; }
.rissued { font-size: 16px; color: var(--ink-soft); margin: 0 0 2px; }
.rname { font-family: var(--font-press), monospace; font-size: 17px; margin: 0; }
.rtitle { font-size: clamp(22px, 7vw, 38px); color: var(--coral); margin: 12px 0 8px; line-height: 1.12; }
.rroast { font-size: 18px; color: var(--ink-soft); margin: 0 0 14px; }
.rpct { background: var(--cream-2); border: 3px solid var(--line); padding: 12px; margin: 12px 0 14px; }
.rpctnum { font-family: var(--font-press), monospace; font-size: clamp(36px, 14vw, 60px); line-height: 1; }
.rpctnum span { color: var(--coral); }
.rpctcap { font-size: 15px; color: var(--ink-soft); margin: 8px 0 10px; }
.rbar { height: 16px; border: 3px solid var(--line); background: #fff; overflow: hidden; }
.rbar i { display: block; height: 100%; background: repeating-linear-gradient(45deg, var(--coral) 0 8px, #ffa3a3 8px 16px); }
.rdims { display: flex; gap: 8px; margin-bottom: 14px; }
.rdims div { flex: 1; background: var(--cream); border: 3px solid var(--line); padding: 8px 4px; }
.rdims span { display: block; font-size: 12px; color: var(--ink-soft); }
.rdims b { display: block; font-size: 17px; margin: 2px 0; }
.rdims em { font-style: normal; font-size: 13px; color: var(--ink-soft); }
.rqr { display: flex; align-items: center; gap: 12px; border-top: 3px dashed rgba(43,34,51,0.38); padding-top: 14px; text-align: left; }
.rqrframe { border: 4px solid var(--line); background: #fff; padding: 5px; box-shadow: var(--shadow); flex: none; line-height: 0; }
.rqrtext .pixel { font-size: 12px; margin: 0 0 4px; }
.rqrcta { font-size: 15px; color: var(--ink-soft); margin: 0; }
.rqrurl { font-family: var(--font-press), monospace; font-size: 9px; margin: 5px 0 0; }

.tactions { display: flex; flex-direction: column; gap: 12px; }
.tbig { font-family: var(--font-press), monospace; font-size: 12px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 14px; color: #fff; background: var(--coral); }
.tbig.teal { background: var(--teal); }
.tbig.ghost { background: #fff; color: var(--ink); }
.tbig:active { transform: translate(4px,4px); box-shadow: none; }
.ttrain { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  border: 3px dashed var(--line); background: var(--cream-2); padding: 14px; }
.ttrain span { font-family: var(--font-press), monospace; font-size: 12px; }
.ttrain em { font-style: normal; font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft);
  background: #fff; border: 2px solid var(--line); padding: 5px 8px; }
.tclaim { margin-top: 14px; border: 3px dashed var(--line); padding: 14px; background: var(--cream); }
.tclaim h4 { margin: 0 0 4px; font-family: var(--font-press), monospace; font-size: 12px; }
.tclaim p { margin: 0 0 10px; font-size: 16px; color: var(--ink-soft); }
.trow { display: flex; gap: 8px; flex-wrap: wrap; }
.trow input { flex: 1 1 160px; min-width: 0; border: 3px solid var(--line); padding: 10px; font-family: inherit; font-size: 18px; background: #fff; outline: none; }
.trow button { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: 3px 3px 0 var(--ink); background: var(--yellow); color: var(--ink); padding: 10px 12px; }
.tsent { margin: 10px 0 0; font-size: 16px; }
`;
