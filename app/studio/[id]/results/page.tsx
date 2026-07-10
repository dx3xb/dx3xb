"use client";
// 创作者结果页：看最近 24 小时玩家的测试结果（超时自动删除，不留档）
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { dx3xb } from "../../../dx3xb-trio";

type Lang = "zh" | "en";
function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  return window.localStorage.getItem("dx3xb_lang") === "zh" ? "zh" : "en";
}

const C = {
  zh: {
    back: "← 返回编辑",
    title: "玩家测试结果",
    sub: "只显示最近 24 小时，超时自动删除；玩家匿名，不收集身份信息。",
    empty: "最近 24 小时还没有人玩。把分享链接发出去吧。",
    refresh: "刷新",
    loading: "加载中…",
    denied: "需要用创作者账号登录才能查看。",
    count: (n: number) => `${n} 条结果`,
  },
  en: {
    back: "← Back to editor",
    title: "Player Results",
    sub: "Last 24 hours only — older entries are deleted automatically. Players stay anonymous.",
    empty: "No plays in the last 24 hours. Share your link!",
    refresh: "Refresh",
    loading: "Loading…",
    denied: "Log in as the creator to view results.",
    count: (n: number) => `${n} results`,
  },
} as const;

type Row = { label: string; score: number | null; created_at: string };

function timeAgo(value: string, lang: Lang) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return lang === "zh" ? "刚刚" : "just now";
  if (minutes < 60) return lang === "zh" ? `${minutes} 分钟前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return lang === "zh" ? `${hours} 小时前` : `${hours}h ago`;
}

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [lang, setLang] = useState<Lang>("en");
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const t = C[lang];

  const load = useCallback(async () => {
    setState("loading");
    try {
      const { data } = await dx3xb().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setState("denied");
        return;
      }
      const res = await fetch(`/api/microapps/${encodeURIComponent(id)}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 404) {
        setState("denied");
        return;
      }
      const body = (await res.json()) as { items?: Row[] };
      setRows(body.items ?? []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    setLang(initialLang());
    void load();
  }, [load]);

  return (
    <main className="rwrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="rbar">
        <a className="rbtn" href={`/studio/${id}?lang=${lang}`}>{t.back}</a>
        <button className="rbtn teal" onClick={() => void load()}>{t.refresh}</button>
      </div>

      <h1 className="pixel rtitle">{t.title}</h1>
      <p className="rsub">{t.sub}</p>

      {state === "loading" && <p className="rsub">{t.loading}</p>}
      {state === "denied" && <p className="rsub">{t.denied}</p>}
      {state === "error" && <p className="rsub">✕</p>}
      {state === "ready" && (
        <>
          <p className="rcount">{t.count(rows.length)}</p>
          {rows.length === 0 ? (
            <p className="rsub">{t.empty}</p>
          ) : (
            <div className="rlist">
              {rows.map((row, index) => (
                <div key={index} className="rrow">
                  <span className="rlabel">{row.label}</span>
                  {typeof row.score === "number" && <b className="rscore">{row.score}%</b>}
                  <span className="rtime">{timeAgo(row.created_at, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

const STYLE = `
.rwrap { max-width: 620px; margin: 0 auto; padding: 22px 16px 60px; font-family: var(--font-vt323), monospace; }
.rbar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.rbtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer;
  background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.rbtn.teal { background: var(--teal); color: #fff; }
.rtitle { font-size: clamp(22px, 6vw, 32px); margin: 0 0 6px; }
.rsub { color: var(--ink-soft); font-size: 16px; margin: 0 0 14px; line-height: 1.5; }
.rcount { font-family: var(--font-press), monospace; font-size: 10px; color: var(--ink-soft); margin: 0 0 10px; }
.rlist { display: grid; gap: 8px; }
.rrow { display: flex; align-items: center; gap: 10px; background: #fff; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 11px 13px; }
.rlabel { font-size: 18px; flex: 1; min-width: 0; word-break: break-word; }
.rscore { font-family: var(--font-press), monospace; font-size: 13px; color: var(--coral); flex: none; }
.rtime { color: var(--ink-soft); font-size: 14px; flex: none; }
`;
