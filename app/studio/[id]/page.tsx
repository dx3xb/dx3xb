"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QuizPlayer } from "../../quiz-player";
import {
  getMicroapp,
  updateMicroapp,
  deleteMicroapp,
  quizIsPublishable,
  validateQuizConfig,
  type Microapp,
  type QuizConfig,
  type MicroStatus,
} from "../../dx3xb-apps";
import { getEmail } from "../../dx3xb-trio";

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
    back: "← 我的微应用",
    edit: "编辑",
    preview: "预览",
    titlePh: "测验标题（如：你是哪种猫？）",
    introPh: "一句话介绍（可选）",
    results: "结果（2–8 个）",
    addResult: "+ 加一个结果",
    emojiPh: "😺",
    resTitlePh: "结果名（如：懒猫）",
    resDescPh: "结果描述（可选）",
    questions: "题目（1–12 题）",
    addQuestion: "+ 加一题",
    qPh: "题目（如：周末你更想…）",
    optPh: "选项",
    addOption: "+ 选项",
    scoreHint: "点结果表情给该选项加权（0→1→2）：",
    save: "保存草稿",
    saved: "已保存 ✓",
    saving: "保存中…",
    makeLink: "生成分享链接",
    submit: "提交到社区墙",
    submitted: "已提交审核 ✓",
    del: "删除",
    delConfirm: "确定删除这个微应用？",
    shareLabel: "分享链接：",
    needPublishable: "结果和题目都填好（结果≥2、每题选项≥2）才能发布。",
    needEmail: "提交到社区墙需要先注册认领账号。",
    goClaim: "去 /me 注册 →",
    notfound: "找不到这个微应用。",
  },
  en: {
    back: "← My Micro-apps",
    edit: "EDIT",
    preview: "PREVIEW",
    titlePh: "Quiz title (e.g. Which cat are you?)",
    introPh: "One-line intro (optional)",
    results: "Results (2–8)",
    addResult: "+ Add result",
    emojiPh: "😺",
    resTitlePh: "Result name (e.g. Lazy Cat)",
    resDescPh: "Result description (optional)",
    questions: "Questions (1–12)",
    addQuestion: "+ Add question",
    qPh: "Question (e.g. On weekends you'd rather…)",
    optPh: "Option",
    addOption: "+ Option",
    scoreHint: "Tap a result emoji to weight this option (0→1→2):",
    save: "Save draft",
    saved: "Saved ✓",
    saving: "Saving…",
    makeLink: "Make share link",
    submit: "Submit to gallery",
    submitted: "Submitted ✓",
    del: "Delete",
    delConfirm: "Delete this micro-app?",
    shareLabel: "Share link:",
    needPublishable: "Fill results & questions (≥2 results, ≥2 options each) before publishing.",
    needEmail: "Submitting to the gallery needs a claimed account.",
    goClaim: "Register at /me →",
    notfound: "Micro-app not found.",
  },
};

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [lang, setLang] = useState<Lang>("en");
  const [app, setApp] = useState<Microapp | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("");
  const [cfg, setCfg] = useState<QuizConfig | null>(null);
  const [status, setStatus] = useState<MicroStatus>("draft");
  const [slug, setSlug] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [email, setEmail] = useState<string | null>(null);
  const t = C[lang];

  useEffect(() => {
    setLang(initialLang());
    (async () => {
      const [a, e] = await Promise.all([getMicroapp(id), getEmail()]);
      if (a) {
        setApp(a);
        setTitle(a.title);
        setCfg(validateQuizConfig(a.config));
        setStatus(a.status);
        setSlug(a.slug);
      }
      setEmail(e);
      setLoaded(true);
    })();
  }, [id]);

  function patchCfg(p: Partial<QuizConfig>) {
    setCfg((c) => (c ? { ...c, ...p } : c));
    setSaveState("idle");
  }
  function setResult(i: number, p: Partial<{ emoji: string; title: string; desc: string }>) {
    if (!cfg) return;
    const results = cfg.results.map((r, j) => (j === i ? { ...r, ...p } : r));
    patchCfg({ results });
  }
  function addResult() {
    if (!cfg || cfg.results.length >= 8) return;
    const k = "r" + Math.random().toString(36).slice(2, 5);
    patchCfg({ results: [...cfg.results, { key: k, emoji: "✨", title: "", desc: "" }] });
  }
  function removeResult(i: number) {
    if (!cfg || cfg.results.length <= 1) return;
    patchCfg({ results: cfg.results.filter((_, j) => j !== i) });
  }
  function setQ(i: number, p: Partial<{ q: string }>) {
    if (!cfg) return;
    patchCfg({ questions: cfg.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) });
  }
  function addQuestion() {
    if (!cfg || cfg.questions.length >= 12) return;
    patchCfg({ questions: [...cfg.questions, { q: "", options: [{ label: "", scores: {} }, { label: "", scores: {} }] }] });
  }
  function removeQuestion(i: number) {
    if (!cfg || cfg.questions.length <= 1) return;
    patchCfg({ questions: cfg.questions.filter((_, j) => j !== i) });
  }
  function setOpt(qi: number, oi: number, label: string) {
    if (!cfg) return;
    const questions = cfg.questions.map((q, j) =>
      j === qi ? { ...q, options: q.options.map((o, k) => (k === oi ? { ...o, label } : o)) } : q,
    );
    patchCfg({ questions });
  }
  function addOption(qi: number) {
    if (!cfg) return;
    const questions = cfg.questions.map((q, j) =>
      j === qi && q.options.length < 6 ? { ...q, options: [...q.options, { label: "", scores: {} }] } : q,
    );
    patchCfg({ questions });
  }
  function removeOption(qi: number, oi: number) {
    if (!cfg) return;
    const questions = cfg.questions.map((q, j) =>
      j === qi && q.options.length > 2 ? { ...q, options: q.options.filter((_, k) => k !== oi) } : q,
    );
    patchCfg({ questions });
  }
  function cycleScore(qi: number, oi: number, key: string) {
    if (!cfg) return;
    const questions = cfg.questions.map((q, j) => {
      if (j !== qi) return q;
      return {
        ...q,
        options: q.options.map((o, k) => {
          if (k !== oi) return o;
          const cur = o.scores[key] ?? 0;
          const next = cur >= 2 ? 0 : cur + 1;
          const scores = { ...o.scores };
          if (next === 0) delete scores[key];
          else scores[key] = next;
          return { ...o, scores };
        }),
      };
    });
    patchCfg({ questions });
  }

  async function save(newStatus?: MicroStatus) {
    if (!cfg) return;
    setSaveState("saving");
    const ok = await updateMicroapp(id, { title, config: cfg, status: newStatus });
    if (ok && newStatus) setStatus(newStatus);
    setSaveState(ok ? "saved" : "idle");
  }
  async function remove() {
    if (!window.confirm(t.delConfirm)) return;
    await deleteMicroapp(id);
    window.location.href = `/studio?lang=${lang}`;
  }

  if (!loaded) return <main className="wrap"><style dangerouslySetInnerHTML={{ __html: STYLE }} /><p className="enote">…</p></main>;
  if (!app || !cfg) return <main className="wrap"><style dangerouslySetInnerHTML={{ __html: STYLE }} /><p className="enote">{t.notfound}</p></main>;

  const publishable = quizIsPublishable(validateQuizConfig(cfg));
  const shareUrl = `https://dx3xb.com/u/${slug}`;

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="ebar">
        <a className="ebtn" href={`/studio?lang=${lang}`}>{t.back}</a>
        <div className="etabs">
          <button className={`etab ${tab === "edit" ? "on" : ""}`} onClick={() => setTab("edit")}>{t.edit}</button>
          <button className={`etab ${tab === "preview" ? "on" : ""}`} onClick={() => setTab("preview")}>{t.preview}</button>
        </div>
      </div>

      {tab === "preview" ? (
        <QuizPlayer config={validateQuizConfig(cfg)} title={title} lang={lang} preview />
      ) : (
        <div className="eform">
          <input className="ein big" placeholder={t.titlePh} value={title} maxLength={60} onChange={(e) => { setTitle(e.target.value); setSaveState("idle"); }} />
          <input className="ein" placeholder={t.introPh} value={cfg.intro} maxLength={200} onChange={(e) => patchCfg({ intro: e.target.value })} />

          <h3 className="ehead">{t.results}</h3>
          {cfg.results.map((r, i) => (
            <div key={i} className="ecard">
              <div className="erow">
                <input className="ein emoji" value={r.emoji} maxLength={6} onChange={(e) => setResult(i, { emoji: e.target.value })} placeholder={t.emojiPh} />
                <input className="ein grow" value={r.title} maxLength={40} onChange={(e) => setResult(i, { title: e.target.value })} placeholder={t.resTitlePh} />
                <button className="ex" onClick={() => removeResult(i)} disabled={cfg.results.length <= 1}>✕</button>
              </div>
              <input className="ein" value={r.desc} maxLength={200} onChange={(e) => setResult(i, { desc: e.target.value })} placeholder={t.resDescPh} />
            </div>
          ))}
          {cfg.results.length < 8 && <button className="eadd" onClick={addResult}>{t.addResult}</button>}

          <h3 className="ehead">{t.questions}</h3>
          {cfg.questions.map((q, qi) => (
            <div key={qi} className="ecard">
              <div className="erow">
                <input className="ein grow" value={q.q} maxLength={120} onChange={(e) => setQ(qi, { q: e.target.value })} placeholder={t.qPh} />
                <button className="ex" onClick={() => removeQuestion(qi)} disabled={cfg.questions.length <= 1}>✕</button>
              </div>
              {q.options.map((o, oi) => (
                <div key={oi} className="eopt">
                  <div className="erow">
                    <input className="ein grow" value={o.label} maxLength={60} onChange={(e) => setOpt(qi, oi, e.target.value)} placeholder={`${t.optPh} ${oi + 1}`} />
                    <button className="ex" onClick={() => removeOption(qi, oi)} disabled={q.options.length <= 2}>✕</button>
                  </div>
                  <div className="escore">
                    <span className="ehint">{t.scoreHint}</span>
                    {cfg.results.map((r) => {
                      const w = o.scores[r.key] ?? 0;
                      return (
                        <button key={r.key} className={`echip w${w}`} onClick={() => cycleScore(qi, oi, r.key)} title={r.title}>
                          {r.emoji || "?"}{w > 0 ? `+${w}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {q.options.length < 6 && <button className="eadd small" onClick={() => addOption(qi)}>{t.addOption}</button>}
            </div>
          ))}
          {cfg.questions.length < 12 && <button className="eadd" onClick={addQuestion}>{t.addQuestion}</button>}

          <div className="esave">
            <button className="ebig" onClick={() => save()}>{saveState === "saving" ? t.saving : saveState === "saved" ? t.saved : t.save}</button>
            <button className="ebig teal" disabled={!publishable} onClick={() => save("unlisted")}>{t.makeLink}</button>
            <button className="ebig coral" disabled={!publishable || !email} onClick={() => save("pending")}>
              {status === "pending" || status === "public" ? t.submitted : t.submit}
            </button>
            <button className="ebig ghost" onClick={remove}>{t.del}</button>
          </div>
          {!publishable && <p className="ewarn">{t.needPublishable}</p>}
          {publishable && !email && (
            <p className="ewarn">{t.needEmail} <a href={`/me?lang=${lang}`}>{t.goClaim}</a></p>
          )}
          {status !== "draft" && (
            <p className="eshare">{t.shareLabel} <a href={`/u/${slug}?lang=${lang}`}>{shareUrl}</a></p>
          )}
        </div>
      )}
    </main>
  );
}

const STYLE = `
.wrap { max-width: 720px; margin: 0 auto; padding: 22px 16px 60px; }
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
.ein { font-family: var(--font-vt323), monospace; font-size: 19px; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 10px 12px; width: 100%; outline: none; }
.ein:focus { box-shadow: var(--shadow); }
.ein.big { font-size: 22px; }
.ein.emoji { width: 60px; flex: none; text-align: center; }
.ein.grow { flex: 1; min-width: 0; }
.ehead { font-family: var(--font-press), monospace; font-size: 12px; margin: 16px 0 2px; }
.ecard { background: var(--cream); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 12px; display: grid; gap: 8px; }
.erow { display: flex; gap: 8px; align-items: center; }
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
