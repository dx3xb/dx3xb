"use client";

import { useEffect, useState } from "react";

type Row = {
  id: number;
  name: string;
  message: string;
  created_at: string;
  parent_id: number | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  hidden: boolean;
};
type App = {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: string;
  plays: number;
  created_at: string;
  reports: number;
};

function bjTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"gb" | "ma">("gb");
  const [rows, setRows] = useState<Row[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [edit, setEdit] = useState<Record<number, { name: string; message: string }>>({});

  useEffect(() => {
    const saved = localStorage.getItem("dx3xb_admin");
    if (saved) {
      setToken(saved);
      void load(saved);
    }
  }, []);

  async function load(tk: string) {
    setErr("");
    const res = await fetch("/api/admin/guestbook", { headers: { Authorization: `Bearer ${tk}` }, cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      setErr("密码错误");
      localStorage.removeItem("dx3xb_admin");
      return;
    }
    const data = await res.json();
    setRows(data.messages || []);
    setAuthed(true);
    localStorage.setItem("dx3xb_admin", tk);
    setToken(tk);
    void loadApps(tk);
  }
  async function loadApps(tk: string) {
    const res = await fetch("/api/admin/microapps", { headers: { Authorization: `Bearer ${tk}` }, cache: "no-store" });
    if (res.ok) setApps((await res.json()).apps || []);
  }

  async function actGb(method: string, payload: Record<string, unknown>) {
    await fetch("/api/admin/guestbook", { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await load(token);
  }
  async function actMa(id: string, status: string) {
    await fetch("/api/admin/microapps", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    await loadApps(token);
  }

  if (!authed) {
    return (
      <main className="awrap">
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
        <div className="alogin">
          <h1 className="pixel">dx3xb 管理后台</h1>
          <input className="ain" type="password" placeholder="管理密码" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(pwd)} />
          <button className="abtn coral" onClick={() => load(pwd)}>登录</button>
          {err && <p className="aerr">{err}</p>}
        </div>
      </main>
    );
  }

  const pending = apps.filter((a) => a.status === "pending").length;

  return (
    <main className="awrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="abar">
        <div className="atabs">
          <button className={`atab ${tab === "gb" ? "on" : ""}`} onClick={() => setTab("gb")}>留言 {rows.length}</button>
          <button className={`atab ${tab === "ma" ? "on" : ""}`} onClick={() => setTab("ma")}>微应用{pending ? ` · ${pending}待审` : ""}</button>
        </div>
        <button className="abtn" onClick={() => { localStorage.removeItem("dx3xb_admin"); setAuthed(false); }}>退出</button>
      </div>

      {tab === "gb" && (
        <div className="alist">
          {rows.map((r) => {
            const e = edit[r.id] ?? { name: r.name, message: r.message };
            return (
              <div key={r.id} className={`acard ${r.hidden ? "hidden" : ""} ${r.parent_id ? "reply" : ""}`}>
                <div className="ameta">
                  <span>#{r.id}{r.parent_id ? ` ↳回复 #${r.parent_id}` : ""}</span>
                  <span>{bjTime(r.created_at)}</span>
                  <span className="aloc">{[r.country, r.region, r.city].filter(Boolean).join(" / ") || "—"}</span>
                  <span className="aip">IP {r.ip || "—"}</span>
                  {r.hidden && <span className="ahid">已隐藏</span>}
                </div>
                <input className="ain" value={e.name} placeholder="（匿名）" onChange={(ev) => setEdit({ ...edit, [r.id]: { ...e, name: ev.target.value } })} />
                <textarea className="ain" rows={2} value={e.message} onChange={(ev) => setEdit({ ...edit, [r.id]: { ...e, message: ev.target.value } })} />
                <div className="arow">
                  <button className="abtn teal" onClick={() => actGb("PATCH", { id: r.id, name: e.name, message: e.message })}>保存</button>
                  <button className="abtn" onClick={() => actGb("PATCH", { id: r.id, hidden: !r.hidden })}>{r.hidden ? "取消隐藏" : "隐藏"}</button>
                  <button className="abtn coral" onClick={() => { if (confirm(`删除 #${r.id}${r.parent_id ? "" : "（含其回复）"}？`)) actGb("DELETE", { id: r.id }); }}>删除</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "ma" && (
        <div className="alist">
          {apps.length === 0 && <p className="note">还没有提交到社区墙的微应用。</p>}
          {apps.map((a) => (
            <div key={a.id} className={`acard ${a.status === "hidden" ? "hidden" : ""}`}>
              <div className="ameta">
                <span className={`astatus ${a.status}`}>{a.status}</span>
                <span>{a.template}</span>
                <span>{bjTime(a.created_at)}</span>
                <span>▶ {a.plays}</span>
                {a.reports > 0 && <span className="ahid">举报 {a.reports}</span>}
              </div>
              <div className="atitle">{a.title || "(无标题)"}</div>
              <div className="arow">
                <a className="abtn" href={`/u/${a.slug}`} target="_blank" rel="noreferrer">预览</a>
                {a.status !== "public" && <button className="abtn teal" onClick={() => actMa(a.id, "public")}>通过上墙</button>}
                {a.status !== "hidden" && <button className="abtn coral" onClick={() => actMa(a.id, "hidden")}>下架</button>}
                {a.status === "public" && <button className="abtn" onClick={() => actMa(a.id, "pending")}>退回待审</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const STYLE = `
.awrap { max-width: 820px; margin: 0 auto; padding: 24px 16px 60px; }
.alogin { max-width: 320px; margin: 60px auto; display: grid; gap: 12px; }
.abar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.atabs { display: flex; }
.atab { font-family: var(--font-press), monospace; font-size: 10px; background: #fff; color: var(--ink-soft);
  border: 3px solid var(--line); padding: 9px 12px; cursor: pointer; }
.atab + .atab { border-left: none; }
.atab.on { background: var(--ink); color: var(--cream); }
.ain { font-family: var(--font-vt323), monospace; font-size: 18px; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 10px 12px; width: 100%; outline: none; }
.ain:focus { box-shadow: var(--shadow); }
.abtn { display: inline-block; text-decoration: none; font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.abtn.coral { background: var(--coral); color: #fff; }
.abtn.teal { background: var(--teal); color: #fff; }
.abtn:active { transform: translate(3px,3px); box-shadow: none; }
.aerr { color: var(--coral); }
.note { color: var(--ink-soft); }
.alist { display: grid; gap: 12px; }
.acard { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow); padding: 12px; display: grid; gap: 8px; }
.acard.hidden { opacity: .6; background: var(--cream-2); }
.acard.reply { margin-left: 22px; border-left: 6px solid var(--teal); }
.ameta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; color: var(--ink-soft); align-items: center; }
.ameta .aloc { color: var(--ink); }
.ameta .aip { font-family: monospace; }
.ameta .ahid { background: var(--coral); color: #fff; padding: 1px 6px; font-size: 11px; }
.astatus { font-family: var(--font-press), monospace; font-size: 9px; padding: 3px 6px; border: 2px solid var(--line); }
.astatus.pending { background: var(--yellow); }
.astatus.public { background: var(--teal); color: #fff; }
.astatus.hidden { background: var(--coral); color: #fff; }
.atitle { font-size: 19px; }
.arow { display: flex; gap: 8px; flex-wrap: wrap; }
`;
