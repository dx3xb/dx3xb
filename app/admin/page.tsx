"use client";

import { useEffect, useState } from "react";
import { MicroReviewCard } from "../_mt/micro-shell";
import type { MicroMeta } from "../_mt/micro-meta";

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
  views: number;
  starts: number;
  completes: number;
  shares: number;
  completionRate: number;
  meta: MicroMeta;
  configSummary: string;
};
type AdminUserApp = {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: string;
  plays: number;
  reports: number;
  created_at: string | null;
  updated_at: string | null;
};
type AdminUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  handle: string | null;
  runCount: number;
  appCount: number;
  publicAppCount: number;
  pendingAppCount: number;
  totalPlays: number;
  reportCount: number;
  apps: AdminUserApp[];
};
type UserSummary = {
  users: number;
  claimed: number;
  anonymous: number;
  apps: number;
  publicApps: number;
  totalPlays: number;
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
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"gb" | "ma" | "users">("gb");
  const [rows, setRows] = useState<Row[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [edit, setEdit] = useState<Record<number, { name: string; message: string }>>({});

  useEffect(() => {
    sessionStorage.removeItem("dx3xb_admin");
    void load();
  }, []);

  async function login() {
    setErr("");
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    setPwd("");
    if (!res.ok) {
      setAuthed(false);
      setErr(res.status === 429 ? "尝试次数过多，请稍后再试" : "登录失败");
      return;
    }
    await load();
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthed(false);
    setRows([]);
    setApps([]);
    setUsers([]);
  }

  async function load() {
    setErr("");
    const res = await fetch("/api/admin/guestbook", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    if (!res.ok) {
      setErr("读取失败");
      return;
    }
    const data = await res.json();
    setRows(data.messages || []);
    setAuthed(true);
    void loadApps();
    void loadUsers();
  }
  async function loadApps() {
    const res = await fetch("/api/admin/microapps", { cache: "no-store" });
    if (res.ok) {
      setApps((await res.json()).apps || []);
    } else {
      setErr("读取微应用失败");
    }
  }
  async function loadUsers() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setSummary(data.summary || null);
    } else {
      setErr("读取用户失败");
    }
  }

  async function actGb(method: string, payload: Record<string, unknown>) {
    setErr("");
    const res = await fetch("/api/admin/guestbook", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      setErr("留言操作失败");
      return;
    }
    await load();
  }
  async function actMa(id: string, status: string) {
    setErr("");
    const res = await fetch("/api/admin/microapps", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!res.ok) {
      setErr("微应用操作失败");
      return;
    }
    await loadApps();
  }

  if (!authed) {
    return (
      <main className="awrap">
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
        <div className="alogin">
          <h1 className="pixel">dx3xb 管理后台</h1>
          <input className="ain" type="password" placeholder="管理密码" value={pwd} onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void login()} />
          <button className="abtn coral" onClick={() => void login()}>登录</button>
          {err && <p className="aerr">{err}</p>}
        </div>
      </main>
    );
  }

  const pending = apps.filter((a) => a.status === "pending").length;
  const claimed = summary?.claimed ?? users.filter((u) => !u.isAnonymous && u.email).length;

  return (
    <main className="awrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="abar">
        <div className="atabs">
          <button className={`atab ${tab === "gb" ? "on" : ""}`} onClick={() => setTab("gb")}>留言 {rows.length}</button>
          <button className={`atab ${tab === "ma" ? "on" : ""}`} onClick={() => setTab("ma")}>微应用{pending ? ` · ${pending}待审` : ""}</button>
          <button className={`atab ${tab === "users" ? "on" : ""}`} onClick={() => setTab("users")}>用户 {claimed}/{users.length}</button>
        </div>
        <button className="abtn" onClick={() => void logout()}>退出</button>
      </div>
      {err && <p className="aerr">{err}</p>}

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
              <MicroReviewCard meta={a.meta} title={a.title} template={a.template} summary={a.configSummary} />
              <div className="astats">
                <span>曝光 {a.views}</span>
                <span>开始 {a.starts}</span>
                <span>完成 {a.completes}</span>
                <span>完成率 {a.completionRate}%</span>
                <span>分享 {a.shares}</span>
              </div>
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

      {tab === "users" && (
        <div className="alist">
          {summary && (
            <div className="agrid">
              <div><b>{summary.users}</b><span>用户</span></div>
              <div><b>{summary.claimed}</b><span>已注册</span></div>
              <div><b>{summary.apps}</b><span>小游戏</span></div>
              <div><b>{summary.totalPlays}</b><span>分享访问/游玩</span></div>
              <div><b>{summary.reports}</b><span>举报</span></div>
            </div>
          )}
          {users.length === 0 && <p className="note">还没有用户数据。</p>}
          {users.map((u) => (
            <div key={u.id} className="acard">
              <div className="ameta">
                <span className={`astatus ${u.isAnonymous ? "draft" : "public"}`}>{u.isAnonymous ? "访客" : "已注册"}</span>
                <span>{u.email || "无邮箱"}</span>
                {u.handle && <span>@{u.handle}</span>}
                <span>注册 {u.createdAt ? bjTime(u.createdAt) : "—"}</span>
                <span>最近登录 {u.lastSignInAt ? bjTime(u.lastSignInAt) : "—"}</span>
              </div>
              <div className="ustats">
                <span>小游戏 {u.appCount}</span>
                <span>公开 {u.publicAppCount}</span>
                <span>待审 {u.pendingAppCount}</span>
                <span>战报 {u.runCount}</span>
                <span>分享访问/游玩 {u.totalPlays}</span>
                {u.reportCount > 0 && <span className="ahid">举报 {u.reportCount}</span>}
              </div>
              <div className="uid">{u.id}</div>
              {u.apps.length > 0 && (
                <div className="uapps">
                  {u.apps.map((a) => (
                    <div key={a.id} className="uapp">
                      <div>
                        <b>{a.title || "(无标题)"}</b>
                        <span>{a.template} · {a.status} · ▶ {a.plays}{a.reports ? ` · 举报 ${a.reports}` : ""}</span>
                      </div>
                      <a href={`/u/${a.slug}`} target="_blank" rel="noreferrer">打开</a>
                    </div>
                  ))}
                </div>
              )}
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
.agrid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.agrid div { background: #fff; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 10px; display: grid; gap: 4px; }
.agrid b { font-family: var(--font-press), monospace; font-size: 16px; }
.agrid span { font-size: 13px; color: var(--ink-soft); }
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
.astats { display: flex; flex-wrap: wrap; gap: 7px; }
.astats span { background: var(--cream-2); border: 2px solid var(--line); padding: 4px 7px; font-size: 13px; }
.ustats { display: flex; flex-wrap: wrap; gap: 8px; }
.ustats span { background: var(--cream-2); border: 2px solid var(--line); padding: 4px 7px; font-size: 13px; }
.uid { font-family: monospace; font-size: 12px; color: var(--ink-soft); word-break: break-all; }
.uapps { display: grid; gap: 7px; margin-top: 2px; }
.uapp { display: flex; justify-content: space-between; gap: 10px; align-items: center; border-top: 2px dashed rgba(43,34,51,.18); padding-top: 7px; }
.uapp div { display: grid; gap: 2px; }
.uapp b { font-size: 16px; }
.uapp span { font-size: 13px; color: var(--ink-soft); }
.uapp a { color: var(--teal); font-weight: 700; white-space: nowrap; }
@media (max-width: 720px) {
  .agrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .abar { align-items: flex-start; }
  .atabs { flex-wrap: wrap; }
  .atab + .atab { border-left: 3px solid var(--line); margin-left: -3px; }
  .uapp { align-items: flex-start; }
}
`;
