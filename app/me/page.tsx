"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTrioProgress,
  getProfileHandle,
  getMyRuns,
  getEmail,
  claimAccount,
  ensureSession,
  GAME_URL,
  TRIO_GAMES,
  TRIO_REPORT_URL,
  type TrioGame,
  type TrioProgress,
  type MyRun,
} from "../dx3xb-trio";
import { getMyMicroapps, type Microapp } from "../dx3xb-apps";

type Lang = "zh" | "en";

const GAME_NAME: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "色差猎人", "dont-click-wrong": "不要点错", "instant-memory": "瞬间记忆" },
  en: { "color-hunter": "color hunter", "dont-click-wrong": "Don't Tap Wrong", "instant-memory": "instant memory" },
};
const GAME_DIM: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "感官", "dont-click-wrong": "反应", "instant-memory": "记忆" },
  en: { "color-hunter": "SENSE", "dont-click-wrong": "REACT", "instant-memory": "MEMORY" },
};
const GAME_COLOR: Record<TrioGame, string> = {
  "color-hunter": "var(--coral)",
  "dont-click-wrong": "var(--teal)",
  "instant-memory": "var(--blue)",
};

const COPY = {
  zh: {
    back: "← dx3xb",
    langBtn: "EN",
    kicker: "我的空间",
    anon: "匿名玩家",
    claimedTag: "已认领",
    anonTag: "匿名",
    trioTitle: "三件套战绩",
    trioDone: (d: number) => `${d}/3 已完成`,
    combinedLabel: "综合脑力",
    viewReport: "查看总报告 →",
    goFinish: "去完成三件套 →",
    historyTitle: "历史战报",
    noHistory: "还没有战报，去玩一局吧。",
    beat: (p: number) => `击败 ${p}%`,
    microTitle: "我的微应用 / 玩具",
    microSoon: "施工中 🚧",
    microDesc: "做一个属于你的小测验，生成可分享的结果海报。",
    microStudio: "打开微应用工厂 →",
    microEmpty: "还没做过微应用，去工厂做一个吧。",
    microStatus: { draft: "草稿", unlisted: "仅链接", pending: "审核中", public: "已公开", hidden: "已下架" } as Record<string, string>,
    trainTitle: "思维训练程序",
    trainSoon: "敬请期待",
    trainDesc: "进阶付费训练，系统提升感官与脑力。",
    claimTitle: "注册认领你的账号",
    claimHint: "保存全部战报、跨设备找回你的空间。",
    emailPh: "你的邮箱",
    send: "发送登录链接",
    sending: "发送中…",
    sent: "登录链接已发到邮箱 ✉️ 去收信点开即可",
    err: "发送失败，换个邮箱再试",
    loading: "正在读取你的空间…",
  },
  en: {
    back: "← dx3xb",
    langBtn: "中",
    kicker: "My Space",
    anon: "anon player",
    claimedTag: "CLAIMED",
    anonTag: "GUEST",
    trioTitle: "Trio Record",
    trioDone: (d: number) => `${d}/3 done`,
    combinedLabel: "BRAINPOWER",
    viewReport: "See full report →",
    goFinish: "Finish the trio →",
    historyTitle: "Report History",
    noHistory: "No reports yet — go play a round.",
    beat: (p: number) => `beat ${p}%`,
    microTitle: "My Micro-apps / Toys",
    microSoon: "UNDER BUILD 🚧",
    microDesc: "Make your own little quiz and generate a shareable result poster.",
    microStudio: "Open the studio →",
    microEmpty: "No micro-apps yet — go make one.",
    microStatus: { draft: "DRAFT", unlisted: "UNLISTED", pending: "IN REVIEW", public: "PUBLIC", hidden: "REMOVED" } as Record<string, string>,
    trainTitle: "Mind-Training Program",
    trainSoon: "COMING SOON",
    trainDesc: "Advanced paid training to systematically sharpen sense & brain.",
    claimTitle: "Claim your account",
    claimHint: "Save every report and recover your space on any device.",
    emailPh: "your email",
    send: "Send login link",
    sending: "Sending…",
    sent: "Magic link sent ✉️ check your inbox",
    err: "Failed — try another email",
    loading: "Loading your space…",
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

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function MePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [progress, setProgress] = useState<TrioProgress | null>(null);
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [runs, setRuns] = useState<MyRun[]>([]);
  const [myApps, setMyApps] = useState<Microapp[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claim, setClaim] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const t = COPY[lang];

  useEffect(() => {
    setLang(getInitialLang());
    void ensureSession();
    (async () => {
      const [prog, h, e, r, apps] = await Promise.all([
        getTrioProgress(),
        getProfileHandle(),
        getEmail(),
        getMyRuns(),
        getMyMicroapps(),
      ]);
      setProgress(prog);
      if (h) setHandle(h);
      setEmail(e);
      setRuns(r);
      setMyApps(apps);
      setLoaded(true);
    })();
  }, []);

  const combined = useMemo(() => {
    if (!progress) return 0;
    const v = TRIO_GAMES.map((g) => progress.best[g]?.pct ?? 0);
    return Math.round(v.reduce((a, b) => a + b, 0) / 3);
  }, [progress]);

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

  async function sendLink() {
    const e = claimEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setClaim("error");
      return;
    }
    setClaim("sending");
    const { error } = await claimAccount(e, "https://dx3xb.com/me" + `?lang=${lang}`);
    setClaim(error ? "error" : "sent");
  }

  const langQ = `?lang=${lang}`;
  const isAnon = !email;

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="mbar">
        <a className="mbtn" href="https://dx3xb.com">{t.back}</a>
        <button className="mbtn yellow" onClick={toggleLang} aria-label="switch language">{t.langBtn}</button>
      </div>

      <section className="mhead">
        <div className="mavatar pixel" aria-hidden="true">d×ᴃ</div>
        <div>
          <p className="mkick">{t.kicker}</p>
          <h1 className="pixel mname">{handle || t.anon}</h1>
          <span className={`mtag ${isAnon ? "guest" : "claimed"}`}>{isAnon ? t.anonTag : `${t.claimedTag} · ${email}`}</span>
        </div>
      </section>

      {!loaded ? (
        <section className="panel mcard"><p>{t.loading}</p></section>
      ) : (
        <>
          {/* 三件套战绩 */}
          <section className="panel mcard">
            <div className="mcardhead">
              <h2 className="pixel mctitle">{t.trioTitle}</h2>
              <span className="mctag">{t.trioDone(progress?.done ?? 0)}</span>
            </div>
            <div className="mtrio">
              <div className="mcombined">
                <b className="pixel">{combined}%</b>
                <span>{t.combinedLabel}</span>
              </div>
              <div className="mdots">
                {TRIO_GAMES.map((g) => (
                  <span key={g} className={progress?.best[g] ? "on" : ""} style={{ background: progress?.best[g] ? GAME_COLOR[g] : "" }} />
                ))}
              </div>
            </div>
            <a className="mlink" href={progress?.allDone ? TRIO_REPORT_URL + langQ : GAME_URL[progress?.nextGame ?? "color-hunter"] + langQ}>
              {progress?.allDone ? t.viewReport : t.goFinish}
            </a>
          </section>

          {/* 注册认领 */}
          {isAnon && (
            <section className="panel mcard mclaim">
              <h2 className="pixel mctitle">{t.claimTitle}</h2>
              <p className="mdesc">{t.claimHint}</p>
              {claim === "sent" ? (
                <p className="msent">{t.sent}</p>
              ) : (
                <>
                  <div className="mrow">
                    <input type="email" inputMode="email" placeholder={t.emailPh} value={claimEmail} onChange={(e) => setClaimEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendLink()} />
                    <button onClick={sendLink} disabled={claim === "sending"}>{claim === "sending" ? t.sending : t.send}</button>
                  </div>
                  {claim === "error" && <p className="msent">{t.err}</p>}
                </>
              )}
            </section>
          )}

          {/* 历史战报 */}
          <section className="panel mcard">
            <h2 className="pixel mctitle">{t.historyTitle}</h2>
            {runs.length === 0 ? (
              <p className="mdesc">{t.noHistory}</p>
            ) : (
              <ul className="mhist">
                {runs.map((r, i) => (
                  <li key={i}>
                    <span className="mbadge" style={{ background: GAME_COLOR[r.game] }}>{GAME_DIM[lang][r.game]}</span>
                    <span className="mgame">{GAME_NAME[lang][r.game]}</span>
                    <span className="mtitle">{r.title}</span>
                    <b className="pixel mscore">{r.score}</b>
                    <span className="mbeat">{t.beat(r.pct)}</span>
                    <span className="mdate">{fmtDate(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 我的微应用 */}
          <section className="panel mcard">
            <div className="mcardhead">
              <h2 className="pixel mctitle">{t.microTitle}</h2>
              <a className="mlink" href={`/studio?lang=${lang}`}>{t.microStudio}</a>
            </div>
            <p className="mdesc">{t.microDesc}</p>
            {myApps.length === 0 ? (
              <p className="mdesc">{t.microEmpty}</p>
            ) : (
              <ul className="mhist">
                {myApps.map((a) => (
                  <li key={a.id}>
                    <span className="mbadge" style={{ background: "var(--blue)" }}>{({ quiz: "🐱", knowme: "💘", thisorthat: "⚔️", higherlower: "📈", madlibs: "📖", escape: "🔐" } as Record<string, string>)[a.template] || "🎲"}</span>
                    <a className="mgame" href={`/studio/${a.id}?lang=${lang}`} style={{ textDecoration: "none", color: "var(--ink)" }}>
                      {a.title || "(untitled)"}
                    </a>
                    <span className="mbeat">{t.microStatus[a.status] || a.status}</span>
                    <span className="mdate">{a.plays}▶</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 思维训练入口（占位） */}
          <section className="panel mcard mtrain">
            <div>
              <h2 className="pixel mctitle">{t.trainTitle}</h2>
              <p className="mdesc">{t.trainDesc}</p>
            </div>
            <span className="msoon">{t.trainSoon}</span>
          </section>
        </>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 720px; margin: 0 auto; padding: 22px 16px 60px; }
.panel { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); }
.pixel { font-family: var(--font-press), monospace; letter-spacing: 0.5px; }
.mbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 18px; }
.mbtn { display: inline-block; text-decoration: none; cursor: pointer; font-family: var(--font-press), monospace;
  font-size: 11px; background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.mbtn.yellow { background: var(--yellow); }
.mbtn:active { transform: translate(3px,3px); box-shadow: none; }
.mhead { display: flex; align-items: center; gap: 14px; margin: 6px 0 20px; }
.mavatar { width: 64px; height: 64px; flex: none; background: var(--ink); color: var(--cream); border: 3px solid var(--line);
  box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center; font-size: 18px; }
.mkick { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 6px; }
.mname { margin: 0 0 6px; font-size: clamp(22px, 6vw, 34px); line-height: 1.1; }
.mtag { font-size: 14px; border: 2px solid var(--line); padding: 2px 7px; }
.mtag.guest { background: var(--cream-2); color: var(--ink-soft); }
.mtag.claimed { background: var(--teal); color: #fff; }
.mcard { padding: 18px; margin-bottom: 14px; }
.mcardhead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.mctitle { margin: 0 0 12px; font-size: 15px; }
.mcardhead .mctitle { margin: 0; }
.mctag { font-family: var(--font-press), monospace; font-size: 10px; color: var(--coral); }
.mtrio { display: flex; align-items: center; gap: 16px; margin: 14px 0; }
.mcombined b { display: block; font-size: 34px; color: var(--ink); }
.mcombined span { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink-soft); }
.mdots { display: flex; gap: 8px; }
.mdots span { width: 22px; height: 22px; border: 3px solid var(--line); background: #fff; }
.mlink { display: inline-block; font-family: var(--font-press), monospace; font-size: 11px; color: var(--ink);
  background: var(--yellow); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 10px 12px; text-decoration: none; }
.mlink:active { transform: translate(3px,3px); box-shadow: none; }
.mdesc { font-size: 17px; color: var(--ink-soft); margin: 0 0 12px; }
.mhist { list-style: none; margin: 0; padding: 0; }
.mhist li { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 8px;
  border-bottom: 2px dashed rgba(43,34,51,0.18); padding: 9px 0; }
.mbadge { font-family: var(--font-press), monospace; font-size: 9px; color: #fff; border: 2px solid var(--line); padding: 4px 6px; }
.mgame { font-size: 16px; }
.mtitle { display: none; }
.mscore { font-size: 16px; }
.mbeat { font-size: 13px; color: var(--ink-soft); }
.mdate { font-size: 13px; color: var(--ink-soft); }
.mconstruct .mwall { height: 90px; border: 3px solid var(--line); position: relative; overflow: hidden; image-rendering: pixelated;
  background-color: #c8814f;
  background-image: linear-gradient(0deg, #5d3a22 0 3px, transparent 3px), linear-gradient(90deg, #5d3a22 0 3px, transparent 3px);
  background-size: 100% 16px, 32px 16px;
  display: flex; align-items: center; justify-content: center; }
.mwall::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
  background: repeating-linear-gradient(45deg, var(--yellow) 0 8px, var(--ink) 8px 16px); }
.mwallsign { font-family: var(--font-press), monospace; font-size: 12px; color: var(--ink); background: var(--yellow);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 8px 12px; }
.mtrain { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mtrain .mdesc { margin: 0; }
.msoon { flex: none; font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft);
  background: var(--cream-2); border: 2px solid var(--line); padding: 6px 9px; }
.mclaim { background: var(--cream); }
.mrow { display: flex; gap: 8px; flex-wrap: wrap; }
.mrow input { flex: 1 1 160px; min-width: 0; border: 3px solid var(--line); padding: 10px; font-family: inherit; font-size: 18px; background: #fff; outline: none; }
.mrow button { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: 3px 3px 0 var(--ink); background: var(--yellow); color: var(--ink); padding: 10px 12px; }
.msent { margin: 10px 0 0; font-size: 16px; }
@media (min-width: 520px) { .mtitle { display: block; font-size: 14px; color: var(--ink-soft); } .mhist li { grid-template-columns: auto auto 1fr auto auto auto; } }
`;
