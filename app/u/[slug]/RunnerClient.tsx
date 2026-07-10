"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { regFor } from "../../_mt/registry";
import { MicroThemeShell } from "../../_mt/micro-shell";
import { CommunityGameCard, CreatorLink } from "../../_mt/community-card";
import { applyAdvancedConfig, extractMicroMeta, stripMicroMeta, type MicroEvent } from "../../_mt/micro-meta";
import { getMicroappBySlug, bumpPlay, reportMicroapp, trackMicroappEvent, TEMPLATE_META, type Microapp } from "../../dx3xb-apps";

type Lang = "zh" | "en";
function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  const s = window.localStorage.getItem("dx3xb_lang");
  return s === "zh" ? "zh" : "en";
}

const C = {
  zh: { back: "← dx3xb", langBtn: "EN", loading: "加载中…", notfound: "这个微应用不存在或已下架。", explore: "去 dx3xb 玩玩", report: "举报", reported: "已举报，谢谢", make: "我也做一个 →", more: "通关了，再玩玩这位创作者的作品", profile: "查看创作者空间" },
  en: { back: "← dx3xb", langBtn: "中", loading: "Loading…", notfound: "This micro-app doesn't exist or was removed.", explore: "Explore dx3xb", report: "Report", reported: "Reported, thanks", make: "Make your own →", more: "Nice run. Play more from this creator", profile: "View creator space" },
};

export function RunnerClient({ slug }: { slug: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [app, setApp] = useState<Microapp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reported, setReported] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const sent = useRef<Partial<Record<MicroEvent, boolean>>>({});
  const t = C[lang];

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

  useEffect(() => {
    setLang(initialLang());
    sent.current = {};
    setCompleted(false);
    (async () => {
      const a = await getMicroappBySlug(slug);
      setApp(a);
      setLoaded(true);
      if (a) {
        void bumpPlay(slug);
        void trackMicroappEvent(slug, "view");
      }
    })();
  }, [slug]);

  const sendEvent = useCallback(
    (event: MicroEvent) => {
      if (sent.current[event]) return;
      sent.current[event] = true;
      void trackMicroappEvent(slug, event);
    },
    [slug],
  );

  const complete = useCallback(() => {
    setCompleted(true);
    sendEvent("complete");
  }, [sendEvent]);

  // config 派生量必须 memo 锁定身份：否则任何父级重渲染（如完成时 setCompleted）
  // 都会生成新 config 对象，触发各模板 Player 里「config 变了就重置」的效果，
  // 把刚到手的结果页瞬间打回开始屏。
  const play = useMemo(() => {
    if (!app) return null;
    const meta = extractMicroMeta(app.config);
    const baseConfig = stripMicroMeta(app.config);
    return { meta, playConfig: applyAdvancedConfig(baseConfig, app.template, meta, app.slug) };
  }, [app]);

  return (
    <main className={`wrap ${app?.template === "workshop" ? "workshop" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="ubar">
        <a className="ubtn" href={`https://dx3xb.com/?lang=${lang}`}>{t.back}</a>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ubtn" onClick={toggleLang} style={{ cursor: "pointer", background: "var(--yellow)" }} aria-label="switch language">{t.langBtn}</button>
          <a className="ubtn coral" href={`/studio?lang=${lang}`}>{t.make}</a>
        </div>
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
            const { meta, playConfig } = play!;
            const label = TEMPLATE_META.find((m) => m.id === app.template)?.name[lang] ?? app.template;
            return (
              <MicroThemeShell
                meta={meta}
                title={app.title}
                templateLabel={label}
                lang={lang}
                onTimeUp={() => setTimeUp(true)}
                stopped={completed}
                byline={<CreatorLink creator={app.creator} lang={lang} sourceSlug={app.slug} compact className="cover-creator" />}
              >
                <Player
                  config={playConfig}
                  title={app.title}
                  slug={app.slug}
                  lang={lang}
                  advanced={meta.advanced}
                  timeUp={timeUp}
                  onRestart={() => { setCompleted(false); setTimeUp(false); }}
                  onResult={(r) => { void fetch(`/api/microapps/${encodeURIComponent(app.id)}/results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) }).catch(() => {}); }}
                  onStart={() => sendEvent("start")}
                  onComplete={complete}
                  onShare={() => sendEvent("share")}
                />
              </MicroThemeShell>
            );
          })()}
          {completed && app.creator && (
            <section className="creator-finish" aria-labelledby="creator-more-title">
              <div className="creator-finish-head">
                <div>
                  <h2 id="creator-more-title">{t.more}</h2>
                  <CreatorLink creator={app.creator} lang={lang} sourceSlug={app.slug} compact />
                </div>
                <a className="ubtn" href={`/p/${encodeURIComponent(app.creator.handle)}?lang=${lang}`} onClick={() => sendEvent("creator_link_click")}>{t.profile}</a>
              </div>
              {app.moreByCreator && app.moreByCreator.length > 0 && (
                <div className="grid creator-more-grid">
                  {app.moreByCreator.map((item) => <CommunityGameCard key={item.slug} app={item} lang={lang} context="more" />)}
                </div>
              )}
            </section>
          )}
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
.wrap.workshop { max-width: 960px; }
.ubar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.ubtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 11px;
  background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.ubtn.coral { background: var(--coral); color: #fff; }
.ubtn:active { transform: translate(3px,3px); box-shadow: none; }
.unote { color: var(--ink-soft); }
.upanel { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); padding: 22px; display: grid; gap: 14px; justify-items: start; }
.creator-finish { margin-top: 24px; padding-top: 18px; border-top: 4px solid var(--line); }
.creator-finish-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.creator-finish-head > div { min-width: 0; display: grid; gap: 9px; justify-items: start; }
.creator-finish h2 { margin: 0; font-family: var(--font-press), monospace; font-size: 12px; line-height: 1.5; }
.creator-more-grid { grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); }
.ufoot { margin-top: 18px; text-align: center; }
.ulink { background: none; border: none; color: var(--ink-soft); font-family: inherit; font-size: 15px; cursor: pointer; text-decoration: underline; }
@media (max-width: 560px) {
  .creator-finish-head { align-items: flex-start; flex-direction: column; }
}
`;
