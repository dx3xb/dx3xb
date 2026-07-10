"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { regFor } from "../../_mt/registry";
import { SharePoster } from "../../_mt/share-poster";
import { MicroThemeShell } from "../../_mt/micro-shell";
import {
  ACCENTS,
  CARD_OPTIONS,
  FONT_OPTIONS,
  THEME_OPTIONS,
  attachMicroMeta,
  extractMicroMeta,
  normalizeMicroMeta,
  stripMicroMeta,
  type MicroMeta,
} from "../../_mt/micro-meta";
import { getMicroapp, updateMicroapp, deleteMicroapp, type Microapp, type MicroStatus } from "../../dx3xb-apps";
import { dx3xb, getEmail, getProfileHandle } from "../../dx3xb-trio";

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
    back: "← 我的微应用", edit: "编辑", preview: "预览", langBtn: "EN", titlePh: "标题（如：你是哪种猫？）",
    save: "保存草稿", saved: "已保存 ✓", saving: "保存中…", makeLink: "生成分享链接", submit: "提交到社区墙",
    submitted: "已提交审核 ✓", del: "删除", delConfirm: "确定删除这个微应用？", shareLabel: "分享链接：",
    needPublishable: "内容填好后才能发布（按各模板的最少要求）。", needEmail: "提交到社区墙需要先注册并设置用户名。",
    goClaim: "去 /me 注册 →", notfound: "找不到这个微应用。", ai: "AI 草稿", aiPh: "一句话描述你想做的玩具，比如：给三年级小朋友玩的恐龙冷知识测试",
    aiBtn: "生成内容", aiBusy: "生成中…", style: "外观", cover: "封面", accent: "强调色", advanced: "高级玩法",
    shuffle: "随机题序", progress: "显示进度", time: "限时秒数", lives: "生命值（猜价生效）",
  },
  en: {
    back: "← My Micro-apps", edit: "EDIT", preview: "PREVIEW", langBtn: "中", titlePh: "Title (e.g. Which cat are you?)",
    save: "Save draft", saved: "Saved ✓", saving: "Saving…", makeLink: "Make share link", submit: "Submit to gallery",
    submitted: "Submitted ✓", del: "Delete", delConfirm: "Delete this micro-app?", shareLabel: "Share link:",
    needPublishable: "Fill in the content before publishing (per template's minimum).", needEmail: "Submitting to the gallery needs a claimed account and username.",
    goClaim: "Register at /me →", notfound: "Micro-app not found.", ai: "AI Draft", aiPh: "Describe the toy in one sentence, e.g. a dinosaur trivia quiz for 3rd graders",
    aiBtn: "Generate", aiBusy: "Generating…", style: "Style", cover: "Cover", accent: "Accent", advanced: "Advanced",
    shuffle: "Shuffle order", progress: "Show progress", time: "Time limit", lives: "Lives (higher-lower)",
  },
};

function Segmented<T extends string>({
  items,
  value,
  lang,
  onPick,
}: {
  items: { id: T; zh: string; en: string }[];
  value: T;
  lang: Lang;
  onPick: (value: T) => void;
}) {
  return (
    <div className="eseg">
      {items.map((item) => (
        <button key={item.id} className={value === item.id ? "on" : ""} onClick={() => onPick(item.id)}>
          {item[lang]}
        </button>
      ))}
    </div>
  );
}

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [lang, setLang] = useState<Lang>("en");
  const [app, setApp] = useState<Microapp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("");
  const [cfg, setCfg] = useState<unknown>(null);
  const [meta, setMeta] = useState<MicroMeta>(normalizeMicroMeta(null));
  const [status, setStatus] = useState<MicroStatus>("draft");
  const [slug, setSlug] = useState("");
  const [tpl, setTpl] = useState("quiz");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const t = C[lang];

  useEffect(() => {
    setLang(initialLang());
    (async () => {
      const [a, e, handle] = await Promise.all([getMicroapp(id), getEmail(), getProfileHandle()]);
      if (a) {
        setApp(a);
        setTitle(a.title);
        setTpl(a.template);
        const nextMeta = extractMicroMeta(a.config);
        setMeta(nextMeta);
        setAiPrompt(nextMeta.aiPrompt);
        setCfg(regFor(a.template).validate(stripMicroMeta(a.config)));
        setStatus(a.status);
        setSlug(a.slug);
      }
      setEmail(e);
      setCreatorHandle(handle);
      setLoaded(true);
    })();
  }, [id]);

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
  function onCfg(c: unknown) {
    setCfg(c);
    setSaveState("idle");
  }
  function patchMeta(patch: Partial<MicroMeta>) {
    setMeta((prev) => normalizeMicroMeta({ ...prev, ...patch, advanced: { ...prev.advanced, ...(patch.advanced ?? {}) } }));
    setSaveState("idle");
  }
  async function save(newStatus?: MicroStatus) {
    if (cfg == null) return;
    setSaveState("saving");
    const nextStatus = newStatus ?? (status === "public" ? "pending" : undefined);
    const ok = await updateMicroapp(id, { title, config: attachMicroMeta(regFor(tpl).validate(cfg), { ...meta, aiPrompt }), status: nextStatus });
    if (ok && nextStatus) setStatus(nextStatus);
    setSaveState(ok ? "saved" : "idle");
  }
  async function generateDraft() {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const { data } = await dx3xb().auth.getSession();
      const token = data.session?.access_token;
      const res = await fetch("/api/microapps/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ template: tpl, prompt: aiPrompt, lang }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.config) {
        setCfg(regFor(tpl).validate(body.config));
        if (body.title) setTitle(String(body.title).slice(0, 60));
        if (body.meta) setMeta(normalizeMicroMeta({ ...meta, ...body.meta, aiPrompt }));
        setSaveState("idle");
      }
    } finally {
      setAiBusy(false);
    }
  }
  async function remove() {
    if (!window.confirm(t.delConfirm)) return;
    await deleteMicroapp(id);
    window.location.href = `/studio?lang=${lang}`;
  }

  if (!loaded) return <main className="wrap"><style dangerouslySetInnerHTML={{ __html: STYLE }} /><p className="enote">…</p></main>;
  if (!app || cfg == null) return <main className="wrap"><style dangerouslySetInnerHTML={{ __html: STYLE }} /><p className="enote">{t.notfound}</p></main>;

  const reg = regFor(tpl);
  const validCfg = reg.validate(cfg);
  const publishable = reg.publishable(cfg);
  const Player = reg.Player;
  const Editor = reg.Editor;
  const shareUrl = `https://dx3xb.com/u/${slug}`;
  const templateLabel = tpl;

  return (
    <main className={`wrap ${tpl === "workshop" ? "workshop" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="ebar">
        <a className="ebtn" href={`/studio?lang=${lang}`}>{t.back}</a>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ebtn" onClick={toggleLang} style={{ cursor: "pointer", background: "var(--yellow)" }} aria-label="switch language">{t.langBtn}</button>
          <div className="etabs">
            <button className={`etab ${tab === "edit" ? "on" : ""}`} onClick={() => setTab("edit")}>{t.edit}</button>
            <button className={`etab ${tab === "preview" ? "on" : ""}`} onClick={() => setTab("preview")}>{t.preview}</button>
          </div>
        </div>
      </div>

      {tab === "preview" ? (
        <MicroThemeShell meta={meta} title={title} templateLabel={templateLabel} lang={lang}>
          <Player config={validCfg} title={title} lang={lang} preview advanced={meta.advanced} />
        </MicroThemeShell>
      ) : (
        <div className="eform">
          <input className="ein big" placeholder={t.titlePh} value={title} maxLength={60} onChange={(e) => { setTitle(e.target.value); setSaveState("idle"); }} />
          {tpl !== "workshop" && <div className="epanel">
            <h3 className="ehead">{t.ai}</h3>
            <div className="erow">
              <textarea className="ein grow" rows={2} placeholder={t.aiPh} value={aiPrompt} maxLength={240} onChange={(e) => { setAiPrompt(e.target.value); setSaveState("idle"); }} />
              <button className="ebig teal" onClick={generateDraft} disabled={aiBusy || !aiPrompt.trim()}>{aiBusy ? t.aiBusy : t.aiBtn}</button>
            </div>
          </div>}

          <div className="epanel">
            <h3 className="ehead">{t.style}</h3>
            <div className="erow wraprow">
              <label className="efield"><span>{t.cover}</span><input className="ein emoji" value={meta.coverEmoji} maxLength={4} onChange={(e) => patchMeta({ coverEmoji: e.target.value })} /></label>
              <label className="efield grow"><span>{t.accent}</span><input className="ein" value={meta.accent} maxLength={7} onChange={(e) => patchMeta({ accent: e.target.value })} /></label>
              <div className="eswatches">
                {ACCENTS.map((c) => <button key={c} aria-label={c} className={meta.accent === c ? "on" : ""} style={{ background: c }} onClick={() => patchMeta({ accent: c })} />)}
              </div>
            </div>
            <Segmented items={THEME_OPTIONS} value={meta.theme} lang={lang} onPick={(theme) => patchMeta({ theme })} />
            <Segmented items={FONT_OPTIONS} value={meta.font} lang={lang} onPick={(font) => patchMeta({ font })} />
            <Segmented items={CARD_OPTIONS} value={meta.card} lang={lang} onPick={(card) => patchMeta({ card })} />
          </div>

          <div className="epanel">
            <h3 className="ehead">{t.advanced}</h3>
            <label className="echeck"><input type="checkbox" checked={meta.advanced.shuffle} onChange={(e) => patchMeta({ advanced: { ...meta.advanced, shuffle: e.target.checked } })} /> {t.shuffle}</label>
            <label className="echeck"><input type="checkbox" checked={meta.advanced.showProgress} onChange={(e) => patchMeta({ advanced: { ...meta.advanced, showProgress: e.target.checked } })} /> {t.progress}</label>
            <div className="erow">
              <label className="efield grow"><span>{t.time}</span><input className="ein" type="number" min={0} max={900} value={meta.advanced.timeLimitSec} onChange={(e) => patchMeta({ advanced: { ...meta.advanced, timeLimitSec: Number(e.target.value) || 0 } })} /></label>
              <label className="efield grow"><span>{t.lives}</span><input className="ein" type="number" min={1} max={9} value={meta.advanced.lives} onChange={(e) => patchMeta({ advanced: { ...meta.advanced, lives: Number(e.target.value) || 1 } })} /></label>
            </div>
          </div>
          <Editor config={validCfg} onChange={onCfg} lang={lang} appId={id} title={title} onTitleChange={(next) => { setTitle(next); setSaveState("idle"); }} />

          <div className="esave">
            <button className="ebig" onClick={() => save()}>{saveState === "saving" ? t.saving : saveState === "saved" ? t.saved : t.save}</button>
            <button className="ebig teal" disabled={!publishable} onClick={() => save("unlisted")}>{t.makeLink}</button>
            <button className="ebig coral" disabled={!publishable || !email || !creatorHandle} onClick={() => save("pending")}>
              {status === "pending" || status === "public" ? t.submitted : t.submit}
            </button>
            <button className="ebig ghost" onClick={remove}>{t.del}</button>
          </div>
          {!publishable && <p className="ewarn">{t.needPublishable}</p>}
          {publishable && (!email || !creatorHandle) && (
            <p className="ewarn">{t.needEmail} <a href={`/me?lang=${lang}`}>{t.goClaim}</a></p>
          )}
          {status !== "draft" && (
            <>
              <p className="eshare">{t.shareLabel} <a href={`/u/${slug}?lang=${lang}`}>{shareUrl}</a></p>
              <p className="eshare"><a href={`/studio/${id}/results?lang=${lang}`}>{lang === "zh" ? "查看玩家测试结果（保留 24 小时）→" : "View player results (kept 24h) →"}</a></p>
              <SharePoster title={title} template={tpl} slug={slug} lang={lang} creatorHandle={creatorHandle} />
            </>
          )}
        </div>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 720px; margin: 0 auto; padding: 22px 16px 60px; }
.wrap.workshop { max-width: 1180px; }
.enote { color: var(--ink-soft); }
.ebar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 18px; }
.ebtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 11px;
  background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.etabs { display: flex; }
.etab { font-family: var(--font-press), monospace; font-size: 10px; background: #fff; color: var(--ink-soft);
  border: 3px solid var(--line); padding: 9px 12px; cursor: pointer; }
.etab + .etab { border-left: none; }
.etab.on { background: var(--ink); color: var(--cream); }
.eform { display: grid; gap: 10px; }
.epanel { background: var(--cream); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px; display: grid; gap: 9px; }
.ein { font-family: var(--font-vt323), monospace; font-size: 19px; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 10px 12px; width: 100%; outline: none; }
.ein:focus { box-shadow: var(--shadow); }
.ein.big { font-size: 22px; }
.ein.emoji { width: 60px; flex: none; text-align: center; }
.ein.grow { flex: 1; min-width: 0; }
.ehead { font-family: var(--font-press), monospace; font-size: 12px; margin: 16px 0 2px; }
.ecard { background: var(--cream); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px; display: grid; gap: 8px; }
.erow { display: flex; gap: 8px; align-items: center; }
.erow.wraprow { flex-wrap: wrap; }
.efield { display: grid; gap: 4px; min-width: 96px; }
.efield span { font-family: var(--font-press), monospace; font-size: 9px; color: var(--ink-soft); }
.echeck { font-size: 17px; display: inline-flex; align-items: center; gap: 8px; }
.echeck input { width: 18px; height: 18px; accent-color: var(--teal); }
.eswatches { display: flex; flex-wrap: wrap; gap: 6px; align-items: end; }
.eswatches button { width: 34px; height: 34px; border: 3px solid var(--line); cursor: pointer; box-shadow: 2px 2px 0 var(--ink); }
.eswatches button.on { outline: 3px solid var(--yellow); }
.eseg { display: flex; flex-wrap: wrap; gap: 0; }
.eseg button { font-family: var(--font-press), monospace; font-size: 9px; background: #fff; color: var(--ink-soft); border: 3px solid var(--line); padding: 8px 10px; cursor: pointer; }
.eseg button + button { margin-left: -3px; }
.eseg button.on { background: var(--ink); color: var(--cream); }
.ex { flex: none; width: 38px; height: 38px; font-family: var(--font-press), monospace; font-size: 12px; cursor: pointer;
  background: #fff; color: var(--ink); border: 3px solid var(--line); }
.ex:disabled { opacity: .4; cursor: not-allowed; }
.eopt { background: #fff; border: 3px solid var(--line); padding: 8px; display: grid; gap: 6px; }
.escore { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ehint { font-size: 13px; color: var(--ink-soft); width: 100%; }
.echip { font-family: var(--font-vt323), monospace; font-size: 16px; cursor: pointer; background: #fff; color: var(--ink);
  border: 3px solid var(--line); padding: 5px 8px; }
.echip.w1 { background: var(--yellow); }
.echip.w2 { background: var(--coral); color: #fff; }
.eadd { justify-self: start; font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer;
  background: #fff; color: var(--ink); border: 3px dashed var(--line); padding: 10px 12px; }
.eadd.small { font-size: 9px; padding: 7px 9px; }
.esave { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.ebig { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer; border: 3px solid var(--line);
  box-shadow: var(--shadow); padding: 13px 15px; background: #fff; color: var(--ink); }
.ebig.teal { background: var(--teal); color: #fff; }
.ebig.coral { background: var(--coral); color: #fff; }
.ebig.ghost { background: #fff; color: var(--ink-soft); }
.ebig:disabled { opacity: .45; cursor: not-allowed; }
.ewarn { font-size: 15px; color: var(--ink-soft); margin: 4px 0 0; }
.eshare { font-size: 15px; margin: 8px 0 0; word-break: break-all; }
`;
