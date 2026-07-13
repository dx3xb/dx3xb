"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_AVATAR_URL,
  getAvatarUrl,
  getTrioProgress,
  getProfileHandle,
  getMyRuns,
  getEmail,
  completeClaimAccount,
  dx3xb,
  ensureSession,
  GAME_URL,
  sendPasswordReset,
  signInAccount,
  signOutAccount,
  startPasswordSignup,
  TRIO_GAMES,
  TRIO_REPORT_URL,
  updateAccountPassword,
  uploadAvatar,
  type TrioGame,
  type TrioProgress,
  type MyRun,
} from "../dx3xb-trio";
import { getMyMicroapps, type Microapp } from "../dx3xb-apps";

type Lang = "zh" | "en";
type AccountMode = "register" | "login" | "forgot" | "reset";
type LibraryRow = { created_at?: string; played_at?: string; kind?: string; dx3xb_microapps: { slug: string; title: string; template?: string } };

const GAME_NAME: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "色差猎人", "dont-click-wrong": "不要点错", "instant-memory": "瞬间记忆" },
  en: { "color-hunter": "color hunter", "dont-click-wrong": "Don't Tap Wrong", "instant-memory": "instant memory" },
};
const GAME_DIM: Record<Lang, Record<TrioGame, string>> = {
  zh: { "color-hunter": "感官", "dont-click-wrong": "反应", "instant-memory": "记忆" },
  en: { "color-hunter": "SENSE", "dont-click-wrong": "REACT", "instant-memory": "MEMORY" },
};
const GAME_COLOR: Record<TrioGame, string> = {
  "color-hunter": "var(--coral)",
  "dont-click-wrong": "var(--teal)",
  "instant-memory": "var(--blue)",
};

const COPY = {
  zh: {
    back: "← dx3xb",
    langBtn: "EN",
    kicker: "我的空间",
    anon: "匿名玩家",
    claimedTag: "已认领",
    anonTag: "匿名",
    trioTitle: "三件套战绩",
    trioDone: (d: number) => `${d}/3 已完成`,
    combinedLabel: "综合脑力",
    viewReport: "查看总报告 →",
    goFinish: "去完成三件套 →",
    historyTitle: "历史战报",
    noHistory: "还没有战报，去玩一局吧。",
    historyPlay: "去玩一局 →",
    beat: (p: number) => `击败 ${p}%`,
    microTitle: "我的微应用 / 玩具",
    microSoon: "施工中 🚧",
    microDesc: "做一个属于你的小测验，生成可分享的结果海报。",
    microStudio: "打开微应用工厂 →",
    microEmpty: "还没做过微应用，去工厂做一个吧。",
    microStatus: { draft: "草稿", unlisted: "仅链接", pending: "审核中", public: "已公开", hidden: "已下架" } as Record<string, string>,
    favorites: "我的收藏", recent: "最近玩过", notifications: "新作提醒", socialEmpty: "这里还没有内容。",
    trainTitle: "思维训练程序",
    trainSoon: "敬请期待",
    trainDesc: "进阶训练，系统提升感官与脑力。",
    claimTitle: "账号",
    claimHint: "注册正式账号会保留当前三件套战报和微应用。已有账号请直接登录。",
    registerTab: "注册",
    loginTab: "登录",
    forgotTab: "找回",
    handlePh: "用户名 / 空间名",
    emailPh: "你的邮箱",
    passwordPh: "密码（至少 8 位）",
    newPasswordPh: "新密码（至少 8 位）",
    confirmPasswordPh: "确认密码",
    register: "注册账号",
    login: "登录",
    forgot: "发送重置邮件",
    savePassword: "保存新密码",
    logout: "退出登录",
    send: "发送确认邮件",
    sending: "发送中…",
    sent: "确认邮件已发到邮箱。点开后会绑定当前空间。",
    resetSent: "重置密码邮件已发送，请去邮箱打开链接。",
    passwordUpdated: "密码已更新。",
    loggedIn: "已登录。",
    loggedOut: "已退出登录。",
    avatarAlt: "空间头像",
    avatarUpload: "换头像",
    avatarUploading: "上传中…",
    avatarErr: "头像上传失败",
    spaceName: "空间名",
    boundEmail: "绑定邮箱",
    existingSent: "这个邮箱已有账号，请切换到登录。",
    claimed: "认领完成，当前空间已绑定邮箱。",
    err: "发送失败，换个邮箱再试",
    errPrefix: "发送失败：",
    loading: "正在读取你的空间…",
  },
  en: {
    back: "← dx3xb",
    langBtn: "中",
    kicker: "My Space",
    anon: "anon player",
    claimedTag: "CLAIMED",
    anonTag: "GUEST",
    trioTitle: "Trio Record",
    trioDone: (d: number) => `${d}/3 done`,
    combinedLabel: "BRAINPOWER",
    viewReport: "See full report →",
    goFinish: "Finish the trio →",
    historyTitle: "Report History",
    noHistory: "No reports yet — go play a round.",
    historyPlay: "Play a round →",
    beat: (p: number) => `beat ${p}%`,
    microTitle: "My Micro-apps / Toys",
    microSoon: "UNDER BUILD 🚧",
    microDesc: "Make your own little quiz and generate a shareable result poster.",
    microStudio: "Open the studio →",
    microEmpty: "No micro-apps yet — go make one.",
    microStatus: { draft: "DRAFT", unlisted: "UNLISTED", pending: "IN REVIEW", public: "PUBLIC", hidden: "REMOVED" } as Record<string, string>,
    favorites: "Favorites", recent: "Recently Played", notifications: "Creator Updates", socialEmpty: "Nothing here yet.",
    trainTitle: "Mind-Training Program",
    trainSoon: "COMING SOON",
    trainDesc: "Advanced training to systematically sharpen sense & brain.",
    claimTitle: "Account",
    claimHint: "Create an account to keep this space's reports and micro-apps. Already registered? Sign in.",
    registerTab: "Sign up",
    loginTab: "Sign in",
    forgotTab: "Reset",
    handlePh: "username / space name",
    emailPh: "your email",
    passwordPh: "password (8+ chars)",
    newPasswordPh: "new password (8+ chars)",
    confirmPasswordPh: "confirm password",
    register: "Create account",
    login: "Sign in",
    forgot: "Send reset email",
    savePassword: "Save new password",
    logout: "Sign out",
    send: "Send confirmation",
    sending: "Sending…",
    sent: "Confirmation email sent. Open it to bind this space.",
    resetSent: "Password reset email sent.",
    passwordUpdated: "Password updated.",
    loggedIn: "Signed in.",
    loggedOut: "Signed out.",
    avatarAlt: "Space avatar",
    avatarUpload: "Change avatar",
    avatarUploading: "Uploading…",
    avatarErr: "Avatar upload failed",
    spaceName: "Space",
    boundEmail: "Email",
    existingSent: "This email already has an account. Switch to sign in.",
    claimed: "Claim complete. This space is now bound to your email.",
    err: "Failed — try another email",
    errPrefix: "Failed: ",
    loading: "Loading your space…",
  },
} as const;

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const u = new URLSearchParams(window.location.search).get("lang");
  if (u === "zh" || u === "en") return u;
  const s = window.localStorage.getItem("dx3xb_lang");
  if (s === "zh" || s === "en") return s;
  return "en";
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function claimErrorText(code: string, lang: Lang) {
  const zh: Record<string, string> = {
    email_exists: "这个邮箱已注册，请切换到登录",
    handle_taken: "这个空间名已经被使用，请换一个",
    missing_handle: "请先填写用户名/空间名",
    invalid_email: "邮箱格式不对",
    missing_session: "当前会话失效，请刷新后重试",
    missing_email_session: "邮箱链接没有完成登录，请重新打开邮件链接",
    bad_or_expired_claim: "认领链接已失效，请重新发送登录链接",
    email_mismatch: "当前登录邮箱和认领邮箱不一致",
    profile_save_failed: "账号已创建，但空间名保存失败，请刷新后重试",
    "Invalid login credentials": "邮箱或密码不对",
  };
  const en: Record<string, string> = {
    email_exists: "This email already has an account. Switch to sign in",
    handle_taken: "This space name is already taken",
    missing_handle: "Choose a username / space name first",
    invalid_email: "Invalid email",
    missing_session: "Session expired. Refresh and try again",
    missing_email_session: "The email link did not finish sign-in. Open the link again",
    bad_or_expired_claim: "Claim link expired. Send a new login link",
    email_mismatch: "The signed-in email does not match this claim",
    profile_save_failed: "Account created, but saving the space name failed. Refresh and try again",
    "Invalid login credentials": "Invalid email or password",
  };
  return (lang === "zh" ? zh : en)[code] ?? code;
}

async function waitForEmailLinkSession() {
  const client = dx3xb();
  for (let i = 0; i < 10; i += 1) {
    const { data } = await client.auth.getSession();
    if (data.session) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

export default function MePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [progress, setProgress] = useState<TrioProgress | null>(null);
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [runs, setRuns] = useState<MyRun[]>([]);
  const [myApps, setMyApps] = useState<Microapp[]>([]);
  const [library, setLibrary] = useState<{ favorites: LibraryRow[]; recent: LibraryRow[]; notifications: LibraryRow[] }>({ favorites: [], recent: [], notifications: [] });
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimHandle, setClaimHandle] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountMode, setAccountMode] = useState<AccountMode>("register");
  const [claim, setClaim] = useState<"idle" | "sending" | "sent" | "resetSent" | "passwordUpdated" | "loggedIn" | "loggedOut" | "completed" | "error">("idle");
  const [claimError, setClaimError] = useState("");
  const t = COPY[lang];

  async function refreshSpace() {
    const [prog, h, e, r, apps, avatar] = await Promise.all([
      getTrioProgress(),
      getProfileHandle(),
      getEmail(),
      getMyRuns(),
      getMyMicroapps(),
      getAvatarUrl(),
    ]);
    setProgress(prog);
    if (h) {
      setHandle(h);
      setClaimHandle(h);
    } else {
      setHandle("");
    }
    setEmail(e);
    setRuns(r);
    setMyApps(apps);
    if (e) {
      const { data: session } = await dx3xb().auth.getSession();
      const token = session.session?.access_token;
      if (token) {
        const response = await fetch("/api/me/library", { headers: { Authorization: `Bearer ${token}` } });
        const body = await response.json().catch(() => null);
        if (response.ok) setLibrary({ favorites: body.favorites || [], recent: body.recent || [], notifications: body.notifications || [] });
      }
    } else setLibrary({ favorites: [], recent: [], notifications: [] });
    setAvatarUrl(avatar);
    setLoaded(true);
  }

  useEffect(() => {
    setLang(getInitialLang());
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const claimToken = params.get("claim");
      const isReset = params.get("reset") === "1";
      if (claimToken) {
        const hasEmailSession = await waitForEmailLinkSession();
        const completed = hasEmailSession ? await completeClaimAccount(claimToken) : { ok: false, error: "missing_email_session" };
        const url = new URL(window.location.href);
        url.searchParams.delete("claim");
        window.history.replaceState(null, "", url.toString());
        if (completed.ok) {
          setClaim("completed");
        } else {
          setClaimError(claimErrorText(completed.error || "claim_complete_failed", getInitialLang()));
          setClaim("error");
        }
      } else if (isReset) {
        await waitForEmailLinkSession();
      } else {
        await ensureSession();
      }
      if (isReset) {
        setAccountMode("reset");
      }
      await refreshSpace();
    })();
  }, []);

  const combined = useMemo(() => {
    if (!progress) return 0;
    const v = TRIO_GAMES.map((g) => progress.best[g]?.pct ?? 0);
    return Math.round(v.reduce((a, b) => a + b, 0) / 3);
  }, [progress]);

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

  function validateEmailAndPassword(requirePassword = true) {
    const e = claimEmail.trim();
    setClaimError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setClaimError(lang === "zh" ? "邮箱格式不对" : "invalid email");
      setClaim("error");
      return null;
    }
    if (requirePassword && accountPassword.length < 8) {
      setClaimError(lang === "zh" ? "密码至少 8 位" : "password must be at least 8 characters");
      setClaim("error");
      return null;
    }
    return e;
  }

  async function registerAccount() {
    const e = validateEmailAndPassword(true);
    const h = claimHandle.trim();
    if (!e) return;
    if (!h) {
      setClaimError(lang === "zh" ? "请先填写用户名/空间名" : "choose a username / space name");
      setClaim("error");
      return;
    }
    if (accountPassword !== confirmPassword) {
      setClaimError(lang === "zh" ? "两次输入的密码不一致" : "passwords do not match");
      setClaim("error");
      return;
    }
    setClaim("sending");
    const res = await startPasswordSignup(e, h, accountPassword);
    if (res.error) {
      console.warn("dx3xb register failed", res.error);
      setClaimError(claimErrorText(res.error.message || String(res.error), lang));
      setClaim("error");
      return;
    }
    setClaim("sent");
    await refreshSpace();
  }

  async function loginAccount() {
    const e = validateEmailAndPassword(true);
    if (!e) return;
    setClaim("sending");
    const res = await signInAccount(e, accountPassword);
    if (res.error) {
      setClaimError(claimErrorText(res.error.message || String(res.error), lang));
      setClaim("error");
      return;
    }
    setClaim("loggedIn");
    await refreshSpace();
  }

  async function forgotPassword() {
    const e = validateEmailAndPassword(false);
    if (!e) return;
    setClaim("sending");
    const res = await sendPasswordReset(e);
    if (res.error) {
      setClaimError(claimErrorText(res.error.message || String(res.error), lang));
      setClaim("error");
      return;
    }
    setClaim("resetSent");
  }

  async function saveNewPassword() {
    setClaimError("");
    if (accountPassword.length < 8 || accountPassword !== confirmPassword) {
      setClaimError(lang === "zh" ? "密码至少 8 位，且两次输入必须一致" : "password must be 8+ characters and match");
      setClaim("error");
      return;
    }
    setClaim("sending");
    const res = await updateAccountPassword(accountPassword);
    if (res.error) {
      setClaimError(claimErrorText(res.error.message || String(res.error), lang));
      setClaim("error");
      return;
    }
    setClaim("passwordUpdated");
    await refreshSpace();
  }

  async function logoutAccount() {
    setClaimError("");
    setClaim("sending");
    const res = await signOutAccount();
    if (res.error) {
      setClaimError(claimErrorText(res.error.message || String(res.error), lang));
      setClaim("error");
      return;
    }
    setEmail(null);
    setHandle("");
    setRuns([]);
    setMyApps([]);
    setAvatarUrl(DEFAULT_AVATAR_URL);
    setProgress(null);
    setClaim("loggedOut");
    await ensureSession();
    await refreshSpace();
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    setAvatarError("");
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setAvatarError(lang === "zh" ? "请上传 2MB 内的图片" : "Upload an image under 2MB");
      return;
    }
    setAvatarBusy(true);
    const result = await uploadAvatar(file);
    setAvatarBusy(false);
    if (result.error || !result.url) {
      setAvatarError(claimErrorText(result.error || "avatar_upload_failed", lang));
      return;
    }
    setAvatarUrl(result.url);
  }

  const langQ = `?lang=${lang}`;
  const isAnon = !email;
  const playUrl = GAME_URL[progress?.nextGame ?? "color-hunter"] + langQ;

  return (
    <main className="wrap">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="mbar">
        <a className="mbtn" href="https://dx3xb.com">{t.back}</a>
        <button className="mbtn yellow" onClick={toggleLang} aria-label="switch language">{t.langBtn}</button>
      </div>

      <section className="mhead">
        <div className="mavatarWrap">
          <div className="mavatar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={t.avatarAlt} onError={() => setAvatarUrl(DEFAULT_AVATAR_URL)} />
          </div>
          {!isAnon && (
            <label className="avatarUpload">
              <span>{avatarBusy ? t.avatarUploading : t.avatarUpload}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => changeAvatar(e.target.files?.[0])} disabled={avatarBusy} />
            </label>
          )}
        </div>
        <div>
          <p className="mkick">{t.kicker}</p>
          <h1 className="pixel mname">{handle || t.anon}</h1>
          <span className={`mtag ${isAnon ? "guest" : "claimed"}`}>{isAnon ? t.anonTag : `${t.claimedTag} · ${email}`}</span>
          {avatarError && <p className="avatarErr">{avatarError}</p>}
        </div>
      </section>

      {!loaded ? (
        <section className="panel mcard"><p>{t.loading}</p></section>
      ) : (
        <>
          {/* 三件套战绩 */}
          <section className="panel mcard">
            <div className="mcardhead">
              <h2 className="pixel mctitle">{t.trioTitle}</h2>
              <span className="mctag">{t.trioDone(progress?.done ?? 0)}</span>
            </div>
            <div className="mtrio">
              <div className="mcombined">
                <b className="pixel">{combined}%</b>
                <span>{t.combinedLabel}</span>
              </div>
              <div className="mdots">
                {TRIO_GAMES.map((g) => (
                  <span key={g} className={progress?.best[g] ? "on" : ""} style={{ background: progress?.best[g] ? GAME_COLOR[g] : "" }} />
                ))}
              </div>
            </div>
            <a className="mlink" href={progress?.allDone ? TRIO_REPORT_URL + langQ : GAME_URL[progress?.nextGame ?? "color-hunter"] + langQ}>
              {progress?.allDone ? t.viewReport : t.goFinish}
            </a>
          </section>

          {/* 账号 */}
          <section className="panel mcard mclaim">
            <h2 className="pixel mctitle">{t.claimTitle}</h2>
            <p className="mdesc">{isAnon ? t.claimHint : `${t.claimedTag} · ${email}`}</p>

            {!isAnon && accountMode !== "reset" ? (
              <>
                <div className="accountSummary">
                  <div>
                    <span>{t.spaceName}</span>
                    <b>{handle || t.anon}</b>
                  </div>
                  <div>
                    <span>{t.boundEmail}</span>
                    <b>{email}</b>
                  </div>
                </div>
                <button className="accountBtn" onClick={logoutAccount} disabled={claim === "sending"}>
                  {claim === "sending" ? t.sending : t.logout}
                </button>
              </>
            ) : accountMode === "reset" ? (
              <>
                <input type="password" placeholder={t.newPasswordPh} value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} />
                <input type="password" placeholder={t.confirmPasswordPh} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <button className="accountBtn" onClick={saveNewPassword} disabled={claim === "sending"}>
                  {claim === "sending" ? t.sending : t.savePassword}
                </button>
              </>
            ) : (
              <>
                <div className="accountTabs" role="tablist" aria-label={t.claimTitle}>
                  <button className={accountMode === "register" ? "on" : ""} onClick={() => { setAccountMode("register"); setClaim("idle"); setClaimError(""); }} type="button">
                    {t.registerTab}
                  </button>
                  <button className={accountMode === "login" ? "on" : ""} onClick={() => { setAccountMode("login"); setClaim("idle"); setClaimError(""); }} type="button">
                    {t.loginTab}
                  </button>
                  <button className={accountMode === "forgot" ? "on" : ""} onClick={() => { setAccountMode("forgot"); setClaim("idle"); setClaimError(""); }} type="button">
                    {t.forgotTab}
                  </button>
                </div>
                {accountMode === "register" && (
                  <input type="text" placeholder={t.handlePh} value={claimHandle} onChange={(e) => setClaimHandle(e.target.value)} maxLength={24} />
                )}
                <input type="email" inputMode="email" placeholder={t.emailPh} value={claimEmail} onChange={(e) => setClaimEmail(e.target.value)} />
                {accountMode !== "forgot" && (
                  <input
                    type="password"
                    placeholder={t.passwordPh}
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (accountMode === "register" ? registerAccount() : loginAccount())}
                  />
                )}
                {accountMode === "register" && (
                  <input type="password" placeholder={t.confirmPasswordPh} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                )}
                <button
                  className="accountBtn"
                  onClick={accountMode === "register" ? registerAccount : accountMode === "login" ? loginAccount : forgotPassword}
                  disabled={claim === "sending"}
                >
                  {claim === "sending" ? t.sending : accountMode === "register" ? t.register : accountMode === "login" ? t.login : t.forgot}
                </button>
              </>
            )}

            {claim !== "idle" && claim !== "sending" && claim !== "error" && (
              <p className="msent">
                {claim === "sent"
                  ? t.sent
                  : claim === "resetSent"
                    ? t.resetSent
                    : claim === "passwordUpdated"
                      ? t.passwordUpdated
                      : claim === "loggedIn"
                        ? t.loggedIn
                        : claim === "loggedOut"
                          ? t.loggedOut
                          : t.claimed}
              </p>
            )}
            {claim === "error" && <p className="msent">{claimError ? `${t.errPrefix}${claimError}` : t.err}</p>}
          </section>

          {/* 历史战报 */}
          <section className="panel mcard">
            <div className="mcardhead">
              <h2 className="pixel mctitle">{t.historyTitle}</h2>
              <a className="mlink mini" href={playUrl}>{t.historyPlay}</a>
            </div>
            {runs.length === 0 ? (
              <p className="mdesc">{t.noHistory}</p>
            ) : (
              <ul className="mhist">
                {runs.map((r, i) => (
                  <li key={i}>
                    <span className="mbadge" style={{ background: GAME_COLOR[r.game] }}>{GAME_DIM[lang][r.game]}</span>
                    <span className="mgame">{GAME_NAME[lang][r.game]}</span>
                    <span className="mtitle">{r.title}</span>
                    <b className="pixel mscore">{r.score}</b>
                    <span className="mbeat">{t.beat(r.pct)}</span>
                    <span className="mdate">{fmtDate(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 我的微应用 */}
          <section className="panel mcard">
            <div className="mcardhead">
              <h2 className="pixel mctitle">{t.microTitle}</h2>
              <a className="mlink" href={`/studio?lang=${lang}`}>{t.microStudio}</a>
            </div>
            <p className="mdesc">{t.microDesc}</p>
            {myApps.length === 0 ? (
              <p className="mdesc">{t.microEmpty}</p>
            ) : (
              <ul className="mhist">
                {myApps.map((a) => (
                  <li key={a.id}>
                    <span className="mbadge" style={{ background: "var(--blue)" }}>{({ quiz: "🐱", knowme: "💘", thisorthat: "⚔️", higherlower: "📈", madlibs: "📖", escape: "🔐" } as Record<string, string>)[a.template] || "🎲"}</span>
                    <a className="mgame" href={`/studio/${a.id}?lang=${lang}`} style={{ textDecoration: "none", color: "var(--ink)" }}>
                      {a.title || "(untitled)"}
                    </a>
                    <span className="mbeat">{t.microStatus[a.status] || a.status}</span>
                    <span className="mdate">{a.plays}▶</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {email && ([
            ["favorites", t.favorites],
            ["recent", t.recent],
            ["notifications", t.notifications],
          ] as const).map(([key, label]) => (
            <section className="panel mcard" key={key}>
              <h2 className="pixel mctitle">{label}</h2>
              {library[key].length === 0 ? <p className="mdesc">{t.socialEmpty}</p> : (
                <ul className="mhist social-list">{library[key].map((row, index) => (
                  <li key={`${row.dx3xb_microapps.slug}-${index}`}>
                    <span className="mbadge" style={{ background: key === "notifications" ? "var(--coral)" : "var(--teal)" }}>{key === "notifications" ? "!" : key === "favorites" ? "★" : "▶"}</span>
                    <a className="mgame" href={`/u/${row.dx3xb_microapps.slug}?lang=${lang}`}>{row.dx3xb_microapps.title}</a>
                    <span className="mdate">{fmtDate(row.created_at || row.played_at || "")}</span>
                  </li>
                ))}</ul>
              )}
            </section>
          ))}

          {/* 思维训练入口（占位） */}
          <section className="panel mcard mtrain">
            <div>
              <h2 className="pixel mctitle">{t.trainTitle}</h2>
              <p className="mdesc">{t.trainDesc}</p>
            </div>
            <span className="msoon">{t.trainSoon}</span>
          </section>
        </>
      )}
    </main>
  );
}

const STYLE = `
.wrap { --me-small: 11px; --me-label: 12px; --me-body: 18px; --me-title: 14px; --me-lead: 20px;
  max-width: 720px; margin: 0 auto; padding: 20px 16px 60px; font-size: var(--me-body); line-height: 1.42; }
.panel { background: #fff; border: 3px solid var(--line); box-shadow: var(--shadow-lg); }
.pixel { font-family: var(--font-press), "FpxCJK", monospace; letter-spacing: 0; }
.mbar { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 16px; }
.mbtn { display: inline-flex; min-height: 38px; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; font-family: var(--font-press), "FpxCJK", monospace;
  font-size: var(--me-small); line-height: 1.25; background: #fff; color: var(--ink); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 8px 12px; }
.mbtn.yellow { background: var(--yellow); }
.mbtn:active { transform: translate(3px,3px); box-shadow: none; }
.mhead { display: flex; align-items: center; gap: 14px; margin: 4px 0 20px; }
.mavatarWrap { width: 74px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 7px; }
.mavatar { width: 62px; height: 62px; flex: none; background: #fff; border: 3px solid var(--line);
  box-shadow: var(--shadow); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.mavatar img { width: 100%; height: 100%; object-fit: cover; display: block; image-rendering: auto; }
.avatarUpload { max-width: 74px; cursor: pointer; user-select: none; text-align: center; font-family: var(--font-press), "FpxCJK", monospace;
  font-size: 9px; line-height: 1.35; color: var(--ink); background: var(--yellow); border: 2px solid var(--line); box-shadow: 2px 2px 0 var(--ink);
  padding: 5px 4px; }
.avatarUpload:active { transform: translate(2px,2px); box-shadow: none; }
.avatarUpload input { display: none; }
.avatarErr { margin: 7px 0 0; color: var(--coral); font-size: 16px; }
.mkick { font-family: var(--font-press), "FpxCJK", monospace; font-size: 10px; line-height: 1.4; letter-spacing: 0; color: var(--ink-soft); margin: 0 0 6px; }
.mname { margin: 0 0 7px; font-size: clamp(22px, 5vw, 30px); line-height: 1.14; max-width: 100%; overflow-wrap: anywhere; }
.mtag { display: inline-flex; align-items: center; max-width: min(100%, 360px); min-height: 24px; font-size: 15px; line-height: 1.1;
  border: 2px solid var(--line); padding: 3px 8px; overflow-wrap: anywhere; }
.mtag.guest { background: var(--cream-2); color: var(--ink-soft); }
.mtag.claimed { background: var(--teal); color: #fff; }
.mcard { padding: 18px; margin-bottom: 14px; }
.mcardhead { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.mctitle { margin: 0 0 12px; font-size: var(--me-title); line-height: 1.45; }
.mcardhead .mctitle { margin: 0; }
.mctag { flex: none; font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.45; color: var(--coral); }
.mtrio { display: flex; align-items: end; gap: 18px; margin: 14px 0 16px; }
.mcombined b { display: block; font-size: 31px; line-height: 1; color: var(--ink); }
.mcombined span { display: block; margin-top: 7px; font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.45; color: var(--ink-soft); }
.mdots { display: flex; gap: 8px; padding-bottom: 7px; }
.mdots span { width: 21px; height: 21px; border: 3px solid var(--line); background: #fff; }
.mlink { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.35; color: var(--ink);
  background: var(--yellow); border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 10px 13px; text-decoration: none; white-space: nowrap; }
.mlink.mini { flex: none; min-height: 36px; font-size: 10px; padding: 7px 10px; }
.mlink:active { transform: translate(3px,3px); box-shadow: none; }
.mdesc { font-size: var(--me-body); line-height: 1.36; color: var(--ink-soft); margin: 0 0 12px; }
.mhist { list-style: none; margin: 0; padding: 0; }
.mhist li { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 8px;
  border-bottom: 2px dashed rgba(43,34,51,0.18); padding: 10px 0; }
.social-list li { grid-template-columns: auto 1fr auto; }
.social-list .mgame { color: var(--ink); text-decoration: none; }
.mbadge { font-family: var(--font-press), "FpxCJK", monospace; font-size: 9px; line-height: 1.35; color: #fff; border: 2px solid var(--line); padding: 4px 6px; }
.mgame { font-size: var(--me-body); line-height: 1.25; min-width: 0; overflow-wrap: anywhere; }
.mtitle { display: none; }
.mscore { font-size: var(--me-label); }
.mbeat { font-size: 16px; color: var(--ink-soft); }
.mdate { font-size: 16px; color: var(--ink-soft); white-space: nowrap; }
.mconstruct .mwall { height: 90px; border: 3px solid var(--line); position: relative; overflow: hidden; image-rendering: pixelated;
  background-color: #c8814f;
  background-image: linear-gradient(0deg, #5d3a22 0 3px, transparent 3px), linear-gradient(90deg, #5d3a22 0 3px, transparent 3px);
  background-size: 100% 16px, 32px 16px;
  display: flex; align-items: center; justify-content: center; }
.mwall::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 8px;
  background: repeating-linear-gradient(45deg, var(--yellow) 0 8px, var(--ink) 8px 16px); }
.mwallsign { font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); color: var(--ink); background: var(--yellow);
  border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink); padding: 8px 12px; }
.mtrain { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mtrain .mdesc { margin: 0; }
.msoon { flex: none; font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.45; color: var(--ink-soft);
  background: var(--cream-2); border: 2px solid var(--line); padding: 6px 9px; }
.mclaim { background: var(--cream); }
.mclaim > input { width: 100%; border: 3px solid var(--line); padding: 10px; font-family: inherit; font-size: var(--me-body); background: #fff; outline: none; margin-bottom: 8px; }
.accountTabs { display: flex; gap: 6px; margin: 0 0 10px; }
.accountTabs button { flex: 1 1 0; min-width: 0; cursor: pointer; border: 3px solid var(--line); background: #fff; color: var(--ink);
  font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.35; padding: 9px 6px; }
.accountTabs button.on { background: var(--ink); color: var(--cream); }
.accountSummary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 10px 0 12px; }
.accountSummary div { min-width: 0; background: #fff; border: 2px solid var(--line); padding: 8px 9px; box-shadow: inset 2px 2px 0 rgba(43,34,51,.08); }
.accountSummary span { display: block; font-family: var(--font-press), "FpxCJK", monospace; font-size: 9px; line-height: 1.35; color: var(--ink-soft); margin-bottom: 4px; }
.accountSummary b { display: block; font-weight: 400; font-size: 17px; line-height: 1.2; color: var(--ink); overflow-wrap: anywhere; }
.accountBtn { display: inline-block; cursor: pointer; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink);
  background: var(--yellow); color: var(--ink); font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.35; padding: 10px 13px; }
.accountBtn:active { transform: translate(3px,3px); box-shadow: none; }
.accountBtn:disabled { opacity: 0.7; cursor: wait; }
.mrow { display: flex; gap: 8px; flex-wrap: wrap; }
.mrow input { flex: 1 1 160px; min-width: 0; border: 3px solid var(--line); padding: 10px; font-family: inherit; font-size: var(--me-body); background: #fff; outline: none; }
.mrow button { font-family: var(--font-press), "FpxCJK", monospace; font-size: var(--me-small); line-height: 1.35; cursor: pointer; border: 3px solid var(--line);
  box-shadow: 3px 3px 0 var(--ink); background: var(--yellow); color: var(--ink); padding: 10px 12px; }
.msent { margin: 10px 0 0; font-size: var(--me-body); line-height: 1.3; }
@media (min-width: 520px) { .mtitle { display: block; font-size: 16px; color: var(--ink-soft); } .mhist li { grid-template-columns: auto auto 1fr auto auto auto; } }
@media (max-width: 520px) {
  .wrap { --me-body: 17px; --me-title: 13px; padding-left: 14px; padding-right: 14px; }
  .mcard { padding: 17px; }
  .mcardhead { align-items: flex-start; }
  .accountSummary { grid-template-columns: 1fr; }
}
@media (max-width: 420px) {
  .mhead { align-items: flex-start; gap: 12px; }
  .mlink.mini { max-width: 132px; text-align: center; white-space: normal; }
  .mhist li { grid-template-columns: auto 1fr auto; }
  .mdate { display: none; }
}
`;
