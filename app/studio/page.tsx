"use client";

import { useEffect, useState } from "react";
import { getMyMicroapps, createMicroapp, type Microapp } from "../dx3xb-apps";

type Lang = "zh" | "en";
function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  const s = window.localStorage.getItem("dx3xb_lang");
  return s === "zh" ? "zh" : "en";
}

const C = {
  zh: {
    back: "← dx3xb",
    kicker: "微应用工厂",
    title: "我的微应用",
    desc: "选个模板、填上内容，就能做出自己的小测验并分享。无需写代码。",
    newQuiz: "+ 新建小测验",
    creating: "创建中…",
    empty: "还没有微应用，新建一个吧。",
    edit: "编辑",
    open: "打开",
    plays: (n: number) => `${n} 次游玩`,
    status: { draft: "草稿", unlisted: "仅链接", pending: "审核中", public: "已公开", hidden: "已下架" } as Record<string, string>,
  },
  en: {
    back: "← dx3xb",
    kicker: "MICRO-APP STUDIO",
    title: "My Micro-apps",
    desc: "Pick a template, fill in your content, and ship your own shareable quiz. No code.",
    newQuiz: "+ New Quiz",
    creating: "Creating…",
    empty: "No micro-apps yet — make one.",
    edit: "Edit",
    open: "Open",
    plays: (n: number) => `${n} plays`,
    status: { draft: "DRAFT", unlisted: "UNLISTED", pending: "IN REVIEW", public: "PUBLIC", hidden: "REMOVED" } as Record<string, string>,
  },
};

export default function StudioPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [apps, setApps] = useState<Microapp[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const t = C[lang];

  useEffect(() => {
    setLang(initialLang());
    (async () => {
      setApps(await getMyMicroapps());
      setLoaded(true);
    })();
  }, []);

  async function newQuiz() {
    if (creating) return;
    setCreating(true);
    const r = await createMicroapp();
    if (r) window.location.href = `/studio/${r.id}?lang=${lang}`;
    else setCreating(false);
  }

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="sbar">
        <a className="sbtn" href="https://dx3xb.com">{t.back}</a>
        <a className="sbtn" href={`/me?lang=${lang}`}>/me</a>
      </div>
      <section className="shead">
        <p className="skick">{t.kicker}</p>
        <h1 className="pixel stitle">{t.title}</h1>
        <p className="sdesc">{t.desc}</p>
        <button className="sbig coral" onClick={newQuiz} disabled={creating}>{creating ? t.creating : t.newQuiz}</button>
      </section>

      {loaded && apps.length === 0 ? (
        <p className="snote">{t.empty}</p>
      ) : (
        <ul className="slist">
          {apps.map((a) => (
            <li key={a.id} className="sitem">
              <div className="sinfo">
                <b>{a.title || "(untitled)"}</b>
                <span className={`stag ${a.status}`}>{t.status[a.status] || a.status}</span>
                <em>{t.plays(a.plays)}</em>
              </div>
              <div className="sactions">
                <a className="sbtn" href={`/studio/${a.id}?lang=${lang}`}>{t.edit}</a>
                {a.status !== "draft" && <a className="sbtn coral" href={`/u/${a.slug}?lang=${lang}`}>{t.open}</a>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 720px; margin: 0 auto; padding: 22px 16px 60px; }
.sbar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.sbtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 11px;
  background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.sbtn.coral { background: var(--coral); color: #fff; }
.sbtn:active { transform: translate(3px,3px); box-shadow: none; }
.shead { margin-bottom: 22px; }
.skick { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 8px; }
.stitle { margin: 0 0 8px; font-size: clamp(24px, 7vw, 40px); }
.sdesc { font-size: 18px; color: var(--ink-soft); margin: 0 0 16px; max-width: 40em; }
.sbig { font-family: var(--font-press), monospace; font-size: 12px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 14px 18px; color: #fff; background: var(--coral); }
.sbig:active { transform: translate(4px,4px); box-shadow: none; }
.snote { color: var(--ink-soft); }
.slist { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.sitem { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow); padding: 14px; display: flex;
  align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.sinfo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sinfo b { font-size: 19px; }
.stag { font-family: var(--font-press), monospace; font-size: 9px; border: 2px solid var(--line); padding: 4px 7px; background: var(--cream-2); }
.stag.public { background: var(--teal); color: #fff; }
.stag.pending { background: var(--yellow); }
.stag.hidden { background: var(--coral); color: #fff; }
.sinfo em { font-style: normal; font-size: 14px; color: var(--ink-soft); }
.sactions { display: flex; gap: 8px; }
`;
