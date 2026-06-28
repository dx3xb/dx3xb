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
  const [rows, setRows] = useState<Row[]>([]);
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
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
  }

  async function act(method: string, payload: Record<string, unknown>) {
    await fetch("/api/admin/guestbook", {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load(token);
  }

  if (!authed) {
    return (
      <main className="awrap">
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
        <div className="alogin">
          <h1 className="pixel">dx3xb 留言管理</h1>
          <input className="ain" type="password" placeholder="管理密码" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(pwd)} />
          <button className="abtn coral" onClick={() => load(pwd)}>登录</button>
          {err && <p className="aerr">{err}</p>}
        </div>
      </main>
    );
  }

  const total = rows.length;
  const tops = rows.filter((r) => !r.parent_id).length;

  return (
    <main className="awrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="abar">
        <h1 className="pixel" style={{ fontSize: 18, margin: 0 }}>留言管理 · {total} 条（{tops} 主贴）</h1>
        <button className="abtn" onClick={() => { localStorage.removeItem("dx3xb_admin"); setAuthed(false); }}>退出</button>
      </div>
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
                <button className="abtn teal" onClick={() => act("PATCH", { id: r.id, name: e.name, message: e.message })}>保存</button>
                <button className="abtn" onClick={() => act("PATCH", { id: r.id, hidden: !r.hidden })}>{r.hidden ? "取消隐藏" : "隐藏"}</button>
                <button className="abtn coral" onClick={() => { if (confirm(`删除 #${r.id}${r.parent_id ? "" : "（含其回复）"}？`)) act("DELETE", { id: r.id }); }}>删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

const STYLE = `
.awrap { max-width: 820px; margin: 0 auto; padding: 24px 16px 60px; }
.alogin { max-width: 320px; margin: 60px auto; display: grid; gap: 12px; }
.abar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 18px; }
.ain { font-family: var(--font-vt323), monospace; font-size: 18px; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: inset 2px 2px 0 rgba(43,34,51,.1); padding: 10px 12px; width: 100%; outline: none; }
.ain:focus { box-shadow: var(--shadow); }
.abtn { font-family: var(--font-press), monospace; font-size: 10px; cursor: pointer; background: #fff; color: var(--ink);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 9px 12px; }
.abtn.coral { background: var(--coral); color: #fff; }
.abtn.teal { background: var(--teal); color: #fff; }
.abtn:active { transform: translate(3px,3px); box-shadow: none; }
.aerr { color: var(--coral); }
.alist { display: grid; gap: 12px; }
.acard { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow); padding: 12px; display: grid; gap: 8px; }
.acard.hidden { opacity: .6; background: var(--cream-2); }
.acard.reply { margin-left: 22px; border-left: 6px solid var(--teal); }
.ameta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; color: var(--ink-soft); align-items: center; }
.ameta .aloc { color: var(--ink); }
.ameta .aip { font-family: monospace; }
.ameta .ahid { background: var(--coral); color: #fff; padding: 1px 6px; font-size: 11px; }
.arow { display: flex; gap: 8px; flex-wrap: wrap; }
`;
