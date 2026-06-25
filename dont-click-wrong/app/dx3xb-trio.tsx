"use client";
// ===== dx3xb 感官与脑力三件套 · 共享 drop-in 组件 =====
// 跨 *.dx3xb.com 共享匿名会话 + 记录战报 + 三件套进度 + 邮箱认领。
// 每个游戏：npm i @supabase/supabase-js，复制本文件，战报页放 <TrioFooter .../> 即可。
// anon key 是公开 key（数据由 RLS 保护）。
import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lesowftrotytmlvdyilc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlc293ZnRyb3R5dG1sdmR5aWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzIzMzgsImV4cCI6MjA4MTU0ODMzOH0._uHc7n1tgM6t8xO4o3rOkZHk-eV869rzjCMpi9sILNA";
const COOKIE_DOMAIN = ".dx3xb.com";
const STORAGE_KEY = "dx3xb-auth";
const CHUNK = 3200;

export const TRIO_GAMES = ["color-hunter", "dont-click-wrong", "instant-memory"] as const;
export type TrioGame = (typeof TRIO_GAMES)[number];
type Lang = "zh" | "en";

export const GAME_URL: Record<TrioGame, string> = {
  "color-hunter": "https://color-hunter.dx3xb.com",
  "dont-click-wrong": "https://dont-click-wrong.dx3xb.com",
  "instant-memory": "https://instant-memory.dx3xb.com",
};
export const TRIO_REPORT_URL = "https://dx3xb.com/trio";

const GAME_NAME: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "色差猎人", "dont-click-wrong": "不要点错", "instant-memory": "瞬间记忆" },
  en: { "color-hunter": "color hunter", "dont-click-wrong": "Don't Tap Wrong", "instant-memory": "instant memory" },
};
const GAME_SENSE: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "感官", "dont-click-wrong": "反应", "instant-memory": "记忆" },
  en: { "color-hunter": "SENSE", "dont-click-wrong": "REACT", "instant-memory": "MEMORY" },
};

/* ---------- 跨子域 cookie 会话存储 ---------- */
const isLocal =
  typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const domainAttr = isLocal ? "" : `; domain=${COOKIE_DOMAIN}`;
const secureAttr = isLocal ? "" : "; Secure";

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${365 * 864e2}${domainAttr}; SameSite=Lax${secureAttr}`;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0${domainAttr}`;
}
function readCookie(name: string): string | null {
  const esc = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const m = document.cookie.match(new RegExp("(?:^|; )" + esc + "=([^;]*)"));
  return m ? m[1] : null;
}

const cookieStorage = {
  getItem(key: string): string | null {
    const head = readCookie(key);
    if (head == null) return null;
    if (head.startsWith("chunks:")) {
      const n = parseInt(head.slice(7), 10);
      let out = "";
      for (let i = 0; i < n; i += 1) {
        const part = readCookie(`${key}.${i}`);
        if (part == null) return null;
        out += part;
      }
      return decodeURIComponent(out);
    }
    return decodeURIComponent(head);
  },
  setItem(key: string, value: string) {
    const old = readCookie(key);
    if (old && old.startsWith("chunks:")) {
      const n = parseInt(old.slice(7), 10);
      for (let i = 0; i < n; i += 1) deleteCookie(`${key}.${i}`);
    }
    const enc = encodeURIComponent(value);
    if (enc.length <= CHUNK) {
      writeCookie(key, enc);
    } else {
      const n = Math.ceil(enc.length / CHUNK);
      for (let i = 0; i < n; i += 1) writeCookie(`${key}.${i}`, enc.slice(i * CHUNK, (i + 1) * CHUNK));
      writeCookie(key, `chunks:${n}`);
    }
  },
  removeItem(key: string) {
    const old = readCookie(key);
    if (old && old.startsWith("chunks:")) {
      const n = parseInt(old.slice(7), 10);
      for (let i = 0; i < n; i += 1) deleteCookie(`${key}.${i}`);
    }
    deleteCookie(key);
  },
};

let _client: SupabaseClient | null = null;
export function dx3xb(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: cookieStorage as unknown as Storage,
      storageKey: STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return _client;
}

export async function ensureSession(): Promise<string | null> {
  const c = dx3xb();
  const { data } = await c.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: anon, error } = await c.auth.signInAnonymously();
  if (error) return null;
  return anon.user?.id ?? null;
}

export type RunPayload = {
  score: number;
  pct: number;
  title: string;
  lang: string;
  stats?: Record<string, unknown>;
};

export async function recordRun(game: TrioGame, p: RunPayload): Promise<void> {
  try {
    const c = dx3xb();
    const id = await ensureSession();
    if (!id) return;
    await c.from("dx3xb_runs").insert({
      user_id: id,
      game,
      score: Math.round(p.score),
      pct: Math.round(p.pct),
      title: p.title,
      lang: p.lang,
      stats: p.stats ?? {},
    });
  } catch {
    /* 记录失败不影响游戏体验 */
  }
}

export type TrioBest = { score: number; pct: number; title: string };
export type TrioProgress = {
  done: number;
  best: Partial<Record<TrioGame, TrioBest>>;
  nextGame: TrioGame | null;
  isAnonymous: boolean;
  allDone: boolean;
};

export async function getTrioProgress(): Promise<TrioProgress> {
  try {
    const c = dx3xb();
    await ensureSession();
    const { data: u } = await c.auth.getUser();
    const isAnonymous = !!u.user?.is_anonymous;
    const { data } = await c.from("dx3xb_runs").select("game,score,pct,title");
    const best: Partial<Record<TrioGame, TrioBest>> = {};
    for (const row of (data ?? []) as { game: TrioGame; score: number; pct: number; title: string }[]) {
      const cur = best[row.game];
      if (!cur || row.score > cur.score) best[row.game] = { score: row.score, pct: row.pct, title: row.title };
    }
    const done = TRIO_GAMES.filter((g) => best[g]).length;
    const nextGame = TRIO_GAMES.find((g) => !best[g]) ?? null;
    return { done, best, nextGame, isAnonymous, allDone: done >= TRIO_GAMES.length };
  } catch {
    return { done: 0, best: {}, nextGame: TRIO_GAMES[0], isAnonymous: true, allDone: false };
  }
}

export async function claimAccount(email: string, redirectTo: string) {
  const c = dx3xb();
  await ensureSession();
  return c.auth.updateUser({ email }, { emailRedirectTo: redirectTo });
}

/* ---------- UI 文案 ---------- */
const UI = {
  zh: {
    label: "感官与脑力三件套",
    next: (n: string) => `下一关：${n} →`,
    report: "查看三件套总报告 →",
    claimTitle: "已过 2 关！注册认领你的账号",
    claimHint: "保存全部战报、解锁你的空间，继续第 3 关进度也不会丢。",
    emailPh: "你的邮箱",
    send: "发送登录链接",
    sending: "发送中…",
    sent: "登录链接已发到邮箱 ✉️ 去收信点开即可",
    err: "发送失败，换个邮箱再试",
    saving: "正在保存战报…",
  },
  en: {
    label: "Sensory & Brainpower Trio",
    next: (n: string) => `Next: ${n} →`,
    report: "See your trio report →",
    claimTitle: "2 down! Claim your account",
    claimHint: "Save every report, unlock your space — your progress sticks for game 3.",
    emailPh: "your email",
    send: "Send login link",
    sending: "Sending…",
    sent: "Magic link sent ✉️ check your inbox",
    err: "Failed — try another email",
    saving: "Saving your run…",
  },
} as const;

const STYLE = `
.trio { margin-top: 14px; border: 3px solid var(--line, #221a2b); background: #fffdf8;
  box-shadow: 6px 6px 0 var(--ink, #221a2b); padding: 14px; }
.trio-label { font-family: var(--font-press), monospace; font-size: 10px; letter-spacing: 1px;
  color: var(--ink-soft, #5f5368); margin: 0 0 10px; }
.trio-track { display: flex; align-items: stretch; gap: 0; }
.trio-seg { flex: 1; text-align: center; border: 3px solid var(--line, #221a2b); padding: 8px 4px;
  background: #fff; }
.trio-seg + .trio-seg { border-left: none; }
.trio-seg.done { background: var(--coral, #ff5f57); color: #fff; }
.trio-seg.cur { background: var(--yellow, #ffd044); color: var(--ink, #221a2b); }
.trio-seg b { display: block; font-family: var(--font-press), monospace; font-size: 10px; }
.trio-seg span { display: block; font-size: 14px; margin-top: 3px; }
.trio-cta { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.trio-btn { display: block; text-align: center; text-decoration: none; cursor: pointer;
  font-family: var(--font-press), monospace; font-size: 11px; line-height: 1.3;
  border: 3px solid var(--line, #221a2b); box-shadow: 4px 4px 0 var(--ink, #221a2b);
  padding: 12px 14px; background: var(--teal, #12b7a6); color: #fff; }
.trio-btn.report { background: var(--coral, #ff5f57); }
.trio-btn:active { transform: translate(4px,4px); box-shadow: none; }
.trio-claim { margin-top: 12px; border: 3px dashed var(--line, #221a2b); padding: 12px; background: #fff7e7; }
.trio-claim h4 { margin: 0 0 4px; font-family: var(--font-press), monospace; font-size: 12px; }
.trio-claim p { margin: 0 0 10px; font-size: 16px; color: var(--ink-soft, #5f5368); }
.trio-row { display: flex; gap: 8px; flex-wrap: wrap; }
.trio-row input { flex: 1 1 150px; min-width: 0; border: 3px solid var(--line, #221a2b); padding: 10px;
  font-family: inherit; font-size: 18px; background: #fff; outline: none; }
.trio-row button { font-family: var(--font-press), monospace; font-size: 11px; cursor: pointer;
  border: 3px solid var(--line, #221a2b); box-shadow: 3px 3px 0 var(--ink, #221a2b);
  background: var(--yellow, #ffd044); color: var(--ink, #221a2b); padding: 10px 12px; }
.trio-sent { margin: 10px 0 0; font-size: 16px; }
`;

export function TrioFooter({ game, lang, run }: { game: TrioGame; lang: Lang; run: RunPayload }) {
  const recorded = useRef(false);
  const [progress, setProgress] = useState<TrioProgress | null>(null);
  const [email, setEmail] = useState("");
  const [claim, setClaim] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const u = UI[lang];

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    (async () => {
      await recordRun(game, run);
      setProgress(await getTrioProgress());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendLink() {
    const e = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setClaim("error");
      return;
    }
    setClaim("sending");
    const { error } = await claimAccount(e, GAME_URL[game] + `?lang=${lang}`);
    setClaim(error ? "error" : "sent");
  }

  const langQ = `?lang=${lang}`;
  return (
    <section className="trio" aria-label="trio progress">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <p className="trio-label">{u.label} · {progress ? `${progress.done}/3` : u.saving}</p>
      <div className="trio-track">
        {TRIO_GAMES.map((g) => {
          const isDone = !!progress?.best[g];
          const isCur = g === game;
          return (
            <div key={g} className={`trio-seg ${isDone ? "done" : ""} ${isCur ? "cur" : ""}`}>
              <b>{GAME_SENSE[lang][g]}</b>
              <span>{GAME_NAME[lang][g]}</span>
            </div>
          );
        })}
      </div>

      {progress && (
        <div className="trio-cta">
          {progress.allDone ? (
            <a className="trio-btn report" href={TRIO_REPORT_URL + langQ}>{u.report}</a>
          ) : progress.nextGame ? (
            <a className="trio-btn" href={GAME_URL[progress.nextGame] + langQ}>
              {u.next(GAME_NAME[lang][progress.nextGame])}
            </a>
          ) : null}
        </div>
      )}

      {progress && progress.isAnonymous && progress.done >= 2 && (
        <div className="trio-claim">
          <h4>{u.claimTitle}</h4>
          <p>{u.claimHint}</p>
          {claim === "sent" ? (
            <p className="trio-sent">{u.sent}</p>
          ) : (
            <>
              <div className="trio-row">
                <input
                  type="email"
                  inputMode="email"
                  placeholder={u.emailPh}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendLink()}
                />
                <button onClick={sendLink} disabled={claim === "sending"}>
                  {claim === "sending" ? u.sending : u.send}
                </button>
              </div>
              {claim === "error" && <p className="trio-sent">{u.err}</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}
