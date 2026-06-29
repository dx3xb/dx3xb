"use client";

import { useEffect, useState } from "react";
import { regFor } from "../../_mt/registry";
import { getMicroappBySlug, bumpPlay, reportMicroapp, type Microapp } from "../../dx3xb-apps";

type Lang = "zh" | "en";
function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  const s = window.localStorage.getItem("dx3xb_lang");
  return s === "zh" ? "zh" : "en";
}

const C = {
  zh: { back: "← dx3xb", loading: "加载中…", notfound: "这个微应用不存在或已下架。", explore: "去 dx3xb 玩玩", report: "举报", reported: "已举报，谢谢", make: "我也做一个 →" },
  en: { back: "← dx3xb", loading: "Loading…", notfound: "This micro-app doesn't exist or was removed.", explore: "Explore dx3xb", report: "Report", reported: "Reported, thanks", make: "Make your own →" },
};

export function RunnerClient({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [app, setApp] = useState<Microapp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reported, setReported] = useState(false);
  const t = C[lang];

  useEffect(() => {
    setLang(initialLang());
    (async () => {
      const a = await getMicroappBySlug(slug);
      setApp(a);
      setLoaded(true);
      if (a) void bumpPlay(slug);
    })();
  }, [slug]);

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="ubar">
        <a className="ubtn" href="https://dx3xb.com">{t.back}</a>
        <a className="ubtn coral" href={`/studio?lang=${lang}`}>{t.make}</a>
      </div>

      {!loaded ? (
        <p className="unote">{t.loading}</p>
      ) : !app ? (
        <div className="upanel">
          <p>{t.notfound}</p>
          <a className="ubtn" href="https://dx3xb.com">{t.explore}</a>
        </div>
      ) : (
        <>
          {(() => {
            const Player = regFor(app.template).Player;
            return <Player config={app.config} title={app.title} slug={app.slug} lang={lang} />;
          })()}
          <div className="ufoot">
            <button
              className="ulink"
              onClick={async () => {
                await reportMicroapp(app.id, "user-report");
                setReported(true);
              }}
            >
              {reported ? t.reported : t.report}
            </button>
          </div>
        </>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 640px; margin: 0 auto; padding: 22px 16px 60px; }
.ubar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.ubtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 11px;
  background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.ubtn.coral { background: var(--coral); color: #fff; }
.ubtn:active { transform: translate(3px,3px); box-shadow: none; }
.unote { color: var(--ink-soft); }
.upanel { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; display: grid; gap: 14px; justify-items: start; }
.ufoot { margin-top: 18px; text-align: center; }
.ulink { background: none; border: none; color: var(--ink-soft); font-family: inherit; font-size: 15px; cursor: pointer; text-decoration: underline; }
`;
