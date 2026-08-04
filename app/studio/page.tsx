"use client";

import { useEffect, useState } from "react";
import { getMyMicroapps, createMicroapp, deleteMicroapp, updateMicroapp, TEMPLATE_META, type Microapp } from "../dx3xb-apps";
import { regFor } from "../_mt/registry";
import { OFFICIAL_REMIXES, type OfficialRemix } from "../_mt/official-remixes";
import { getEmail } from "../dx3xb-trio";
import { persistLanguage } from "@/lib/language";

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
    workshopTitle: "AI 游戏工坊",
    workshopDesc: "注册用户专属：用 Gemini 生成受控游戏规格，由 dx3xb 引擎渲染，仍需审核后上墙。",
    workshopBtn: "开启 AI 游戏工坊",
    workshopLocked: "注册后开启",
    remixKicker: "提示词指挥官通关奖励",
    remixTitle: "挑一款官方游戏开始改造",
    remixDesc: "不用面对空白输入框：先改规则、画面或难度，再让 AI 工坊继续帮你迭代。",
    remixStart: "改造这个模板",
    remixLocked: "注册后可保存、使用 AI 迭代并发布作品。",
    newQuiz: "+ 新建小测验",
    creating: "创建中…",
    empty: "还没有微应用，新建一个吧。",
    edit: "编辑",
    open: "打开",
    del: "删除",
    delConfirm: "确定删除这个微应用？",
    langBtn: "EN",
    plays: (n: number) => `${n} 次游玩`,
    status: { draft: "草稿", unlisted: "仅链接", pending: "审核中", public: "已公开", hidden: "已下架" } as Record<string, string>,
  },
  en: {
    back: "← dx3xb",
    kicker: "MICRO-APP STUDIO",
    title: "My Micro-apps",
    desc: "Pick a template, fill in your content, and ship your own shareable quiz. No code.",
    workshopTitle: "AI Game Workshop",
    workshopDesc: "Registered users only: Gemini generates a controlled game spec, dx3xb renders it, gallery publishing still needs review.",
    workshopBtn: "Open AI Game Workshop",
    workshopLocked: "Register to unlock",
    remixKicker: "PROMPT COMMANDER REWARD",
    remixTitle: "Pick an official game to remix",
    remixDesc: "Skip the blank page: change a rule, visual or difficulty, then keep iterating in the AI Workshop.",
    remixStart: "REMIX THIS TEMPLATE",
    remixLocked: "Register to save, iterate with AI and publish your work.",
    newQuiz: "+ New Quiz",
    creating: "Creating…",
    empty: "No micro-apps yet — make one.",
    edit: "Edit",
    open: "Open",
    del: "Delete",
    delConfirm: "Delete this micro-app?",
    langBtn: "中",
    plays: (n: number) => `${n} plays`,
    status: { draft: "DRAFT", unlisted: "UNLISTED", pending: "IN REVIEW", public: "PUBLIC", hidden: "REMOVED" } as Record<string, string>,
  },
};

export default function StudioPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [apps, setApps] = useState<Microapp[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [remixMode, setRemixMode] = useState(false);
  const t = C[lang];

  useEffect(() => {
    setLang(initialLang());
    setRemixMode(new URLSearchParams(window.location.search).get("remix") === "prompt-commander");
    (async () => {
      const [list, e] = await Promise.all([getMyMicroapps(), getEmail()]);
      setApps(list);
      setEmail(e);
      setLoaded(true);
    })();
  }, []);

  function toggleLang() {
    setLang((prev) => {
      const next: Lang = prev === "zh" ? "en" : "zh";
      persistLanguage(next);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState(null, "", url.toString());
      return next;
    });
  }

  async function newApp(template: string, suppliedConfig?: unknown, suppliedTitle?: string) {
    if (creating) return;
    setCreating(true);
    const config = suppliedConfig ?? regFor(template).empty(lang);
    const r = await createMicroapp(template, config);
    if (r) {
      if (suppliedTitle) await updateMicroapp(r.id, { title: suppliedTitle });
      window.location.href = `/studio/${r.id}?lang=${lang}&from=official-remix`;
    }
    else setCreating(false);
  }

  function remix(template: OfficialRemix) {
    return newApp("workshop", template.config[lang], template.name[lang]);
  }

  async function del(id: string) {
    if (!window.confirm(t.delConfirm)) return;
    await deleteMicroapp(id);
    setApps(await getMyMicroapps());
  }

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="sbar">
        <a className="sbtn" href={`https://dx3xb.com/?lang=${lang}`}>{t.back}</a>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="sbtn" href={`/me?lang=${lang}`}>/me</a>
          <button className="sbtn yellow" onClick={toggleLang} aria-label="switch language">{t.langBtn}</button>
        </div>
      </div>
      <section className="shead">
        <p className="skick">{t.kicker}</p>
        <h1 className="pixel stitle">{t.title}</h1>
        <p className="sdesc">{t.desc}</p>
        {remixMode && (
          <section className="remixShelf" aria-label={t.remixTitle}>
            <p className="skick">{t.remixKicker}</p>
            <h2 className="pixel">{t.remixTitle}</h2>
            <p>{t.remixDesc}</p>
            {!email && <p className="remixLocked">{t.remixLocked} <a href={`/me?lang=${lang}`}>{t.workshopLocked} →</a></p>}
            <div className="remixGrid">
              {OFFICIAL_REMIXES.map((template) => (
                <article key={template.id}>
                  <span>{template.emoji}</span>
                  <b>{template.name[lang]}</b>
                  <p>{template.skill[lang]}</p>
                  <button className="sbtn coral" onClick={() => remix(template)} disabled={creating || !email}>{creating ? t.creating : t.remixStart}</button>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="sworkshop">
          <span className="spickemoji">🕹️</span>
          <div>
            <b>{t.workshopTitle}</b>
            <p>{t.workshopDesc}</p>
          </div>
          {email ? (
            <button className="sbtn coral" onClick={() => newApp("workshop")} disabled={creating}>{creating ? t.creating : t.workshopBtn}</button>
          ) : (
            <a className="sbtn" href={`/me?lang=${lang}`}>{t.workshopLocked}</a>
          )}
        </div>
        <div className="spick">
          {TEMPLATE_META.filter((m) => m.id !== "workshop").map((m) => (
            <button key={m.id} className="spickcard" onClick={() => newApp(m.id)} disabled={creating}>
              <span className="spickemoji">{m.emoji}</span>
              <b>{m.name[lang]}</b>
              <span className="spicktag">{m.tagline[lang]}</span>
            </button>
          ))}
        </div>
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
                <button className="sbtn del" onClick={() => del(a.id)}>{t.del}</button>
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
.sbtn.yellow { background: var(--yellow); cursor: pointer; }
.sbtn.del { cursor: pointer; color: var(--ink-soft); }
.sbtn.del:hover { background: var(--coral); color: #fff; }
.sbtn:active { transform: translate(3px,3px); box-shadow: none; }
.shead { margin-bottom: 22px; }
.skick { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px; color: var(--ink-soft); margin: 0 0 8px; }
.stitle { margin: 0 0 8px; font-size: clamp(24px, 7vw, 40px); }
.sdesc { font-size: 18px; color: var(--ink-soft); margin: 0 0 16px; max-width: 40em; }
.sworkshop { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: center; background: var(--ink);
  color: var(--cream); border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 14px; margin: 0 0 14px; }
.sworkshop b { font-family: var(--font-press), monospace; font-size: 13px; }
.sworkshop p { margin: 5px 0 0; color: rgba(255,253,248,.78); font-size: 15px; }
.sworkshop .sbtn { white-space: nowrap; }
.remixShelf { background: var(--yellow); border: 4px solid var(--line); box-shadow: var(--shadow-lg); padding: 18px; margin: 0 0 18px; }
.remixShelf h2 { margin: 0 0 8px; font-size: clamp(20px, 5vw, 28px); }
.remixShelf > p { margin: 6px 0 14px; }
.remixLocked { background: #fff; border: 2px solid var(--line); padding: 9px; }
.remixGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.remixGrid article { background: #fffdf8; border: 3px solid var(--line); padding: 13px; display: grid; gap: 7px; align-content: start; }
.remixGrid article > span { font-size: 34px; }
.remixGrid article > b { font-size: 18px; }
.remixGrid article > p { color: var(--ink-soft); margin: 0; min-height: 42px; }
.remixGrid .sbtn { cursor: pointer; text-align: center; }
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
.spick { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.spickcard { text-align: left; cursor: pointer; background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow);
  padding: 16px; display: grid; gap: 6px; }
.spickcard:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 var(--ink); }
.spickcard:active { transform: translate(4px,4px); box-shadow: none; }
.spickcard:disabled { opacity: .5; cursor: wait; }
.spickemoji { font-size: 32px; }
.spickcard b { font-size: 19px; }
.spicktag { font-size: 15px; color: var(--ink-soft); }
@media (max-width: 640px) {
  .sworkshop { grid-template-columns: auto 1fr; }
  .sworkshop .sbtn { grid-column: 1 / -1; text-align: center; }
  .remixGrid { grid-template-columns: 1fr; }
}
`;
