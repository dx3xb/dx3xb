"use client";

import { useEffect, useRef, useState } from "react";
import { CommunityGameCard } from "./_mt/community-card";
import type { PublicMicroappSummary } from "./_mt/creator-types";
import { persistLanguage } from "@/lib/language";
import type { PublicToy } from "@/lib/public-home";

type Msg = { id: number; name: string; message: string; created_at: string; parent_id: number | null };
type Lang = "zh" | "en";
type WallApp = PublicMicroappSummary;

type HomeClientProps = {
  initialLang: Lang;
  initialToys: PublicToy[];
  initialCommunity: WallApp[];
};

/* ===== 施工中卡片的像素砖墙场景（错缝砖 + 高光暗边 + 工地小装饰） ===== */
/* 墙头装饰画在原点(0..16)，由 WallScene 放大后摆到墙沿上探出来 */
function HardHat() {
  return (
    <g>
      <rect x="0" y="9" width="16" height="2" fill="#d99a00" />
      <rect x="0" y="11" width="16" height="1" fill="#221a2b" />
      <rect x="4" y="3" width="8" height="6" fill="#ffd044" />
      <rect x="5" y="1" width="6" height="2" fill="#ffd86b" />
      <rect x="4" y="3" width="8" height="1" fill="#ffe89a" />
      <rect x="4" y="3" width="1" height="6" fill="#ffe89a" />
      <rect x="9" y="1" width="2" height="8" fill="#e0a800" />
      <rect x="11" y="3" width="1" height="6" fill="#cf8f00" />
    </g>
  );
}

function Cone() {
  return (
    <g>
      <rect x="6" y="0" width="2" height="2" fill="#ff7a3c" />
      <rect x="5" y="2" width="4" height="2" fill="#ff8a4c" />
      <rect x="5" y="3" width="4" height="1" fill="#fff7e7" />
      <rect x="4" y="4" width="6" height="2" fill="#ff7a3c" />
      <rect x="3" y="6" width="8" height="2" fill="#ff8a4c" />
      <rect x="3" y="7" width="8" height="1" fill="#fff7e7" />
      <rect x="2" y="8" width="10" height="2" fill="#ff7a3c" />
      <rect x="1" y="10" width="12" height="2" fill="#d9531a" />
      <rect x="1" y="11" width="12" height="1" fill="#221a2b" />
    </g>
  );
}

function Barrier() {
  return (
    <g>
      <rect x="2" y="5" width="2" height="7" fill="#6b4a2a" />
      <rect x="12" y="5" width="2" height="7" fill="#6b4a2a" />
      <rect x="0" y="1" width="16" height="4" fill="#fff7e7" />
      <rect x="0" y="1" width="16" height="1" fill="#221a2b" />
      <rect x="0" y="4" width="16" height="1" fill="#221a2b" />
      <rect x="1" y="2" width="3" height="3" fill="#ff5f57" />
      <rect x="7" y="2" width="3" height="3" fill="#ff5f57" />
      <rect x="13" y="2" width="3" height="3" fill="#ff5f57" />
    </g>
  );
}

// 透明带高度：装饰摆在这条带子里，从墙沿探出来、衬在浅色背景上
const WALL_TOP = 24;
const DECO = 1.7;

function Deco({ x, children }: { x: number; children: React.ReactNode }) {
  // 把 16x12 的装饰放大并让底部坐在墙沿(WALL_TOP)上
  return <g transform={`translate(${x},${WALL_TOP - 12 * DECO}) scale(${DECO})`}>{children}</g>;
}

function WallScene({ id, variant }: { id: string; variant: number }) {
  const brickId = `br-${id}`;
  const hazId = `hz-${id}`;
  return (
    <svg className="cwall" aria-hidden="true" shapeRendering="crispEdges" preserveAspectRatio="none">
      <defs>
        <pattern id={brickId} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#5e3a22" />
          {/* 上层砖 */}
          <rect x="1" y="1" width="14" height="6" fill="#c8754a" />
          <rect x="1" y="1" width="14" height="1" fill="#e6a877" />
          <rect x="1" y="1" width="1" height="6" fill="#e6a877" />
          <rect x="1" y="6" width="14" height="1" fill="#8f4a28" />
          <rect x="14" y="1" width="1" height="6" fill="#8f4a28" />
          {/* 下层砖（错缝，颜色略深） */}
          <rect x="9" y="9" width="6" height="6" fill="#bd6a40" />
          <rect x="9" y="9" width="6" height="1" fill="#dc9d6b" />
          <rect x="9" y="9" width="1" height="6" fill="#dc9d6b" />
          <rect x="9" y="14" width="6" height="1" fill="#86421f" />
          <rect x="14" y="9" width="1" height="6" fill="#86421f" />
          <rect x="0" y="9" width="7" height="6" fill="#bd6a40" />
          <rect x="0" y="9" width="7" height="1" fill="#dc9d6b" />
          <rect x="0" y="9" width="1" height="6" fill="#dc9d6b" />
          <rect x="0" y="14" width="7" height="1" fill="#86421f" />
          <rect x="6" y="9" width="1" height="6" fill="#86421f" />
        </pattern>
        <pattern id={hazId} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#ffd044" />
          <rect x="0" y="6" width="2" height="2" fill="#221a2b" />
          <rect x="2" y="4" width="2" height="2" fill="#221a2b" />
          <rect x="4" y="2" width="2" height="2" fill="#221a2b" />
          <rect x="6" y="0" width="2" height="2" fill="#221a2b" />
        </pattern>
      </defs>
      {/* 砖墙：从透明带下方开始，墙体不透字 */}
      <rect x="0" y={WALL_TOP} width="100%" height="400" fill={`url(#${brickId})`} />
      {/* 明确的墙沿 */}
      <rect x="0" y={WALL_TOP} width="100%" height="3" fill="#4a2c18" />
      <rect x="0" y={WALL_TOP + 3} width="100%" height="1" fill="#e6a877" />
      {/* 裂缝 + 青苔，打破重复 */}
      <g transform={`translate(${34 + variant * 14},${WALL_TOP + 18})`} fill="#4a2c18">
        <rect x="0" y="0" width="1" height="2" />
        <rect x="1" y="2" width="1" height="2" />
        <rect x="0" y="4" width="1" height="2" />
        <rect x="2" y="4" width="1" height="2" />
      </g>
      <g transform={`translate(${70 - variant * 11},${WALL_TOP + 30})`} fill="#6fae3a">
        <rect x="0" y="2" width="1" height="1" />
        <rect x="1" y="1" width="1" height="2" />
        <rect x="2" y="0" width="1" height="3" />
        <rect x="3" y="1" width="1" height="2" />
      </g>
      {/* 警示胶带：贴在墙沿上 */}
      <rect x="0" y={WALL_TOP - 1} width="100%" height="7" fill={`url(#${hazId})`} />
      {/* 墙头小装饰：放大、坐在墙沿上探出来 */}
      {variant === 0 && <Deco x={12}><HardHat /></Deco>}
      {variant === 0 && <Deco x={118}><Cone /></Deco>}
      {variant === 1 && <Deco x={14}><Cone /></Deco>}
      {variant === 1 && <Deco x={104}><Barrier /></Deco>}
      {variant === 2 && <Deco x={14}><Barrier /></Deco>}
      {variant === 2 && <Deco x={116}><HardHat /></Deco>}
    </svg>
  );
}

/* ===== i18n 字典：后续新增功能都往这里加 zh / en 两份即可 ===== */
const COPY = {
  zh: {
    langBtn: "EN",
    tag: "后 Web3 · AI 时代 · 二〇二六",
    heroNote: ["它是一张噘嘴的小脸，", "也是一间网络趣味工具铺。"],
    decode: [
      { k: "d b", label: "左右耳朵" },
      { k: "x x", label: "紧闭的眼" },
      { k: "3", label: "噘起的嘴" },
    ],
    intro: [
      "dx3xb 是后 Web3、AI 时代下的网络趣味工具聚集地 —— 这里不谈宏大叙事，只收集好玩、无用、有点幽默感的小工具和小玩具。🧸",
      "更多玩具正在一像素一像素地敲出来。⛏️",
    ],
    toyTitle: "玩具墙",
    trioTag: "★ 招牌挑战",
    trioName: "感官与脑力三件套",
    trioDims: ["👁 感官", "⚡ 反应", "🧠 记忆"],
    trioDesc: "三关连测你的感官辨别、反应控制、短时记忆——集齐解锁专属综合脑力报告，还能叫朋友来比。",
    trioStart: "开始挑战 →",
    trioReport: "我的总报告",
    toySub: "点亮的卡片直接玩；更多实验项目收进同一块施工区 🚧",
    upcomingTitle: (count: number) => `${count} 个新玩具施工中`,
    upcomingDesc: "随机玩法、AI 小魔法和像素实验正在搭建。",
    wallTitle: "玩家做的玩具",
    wallSub: "社区里大家自己做的小测验和小游戏，点开就玩。",
    wallEmpty: "还没有人上墙，",
    wallMake: "来做第一个 →",
    wallMakeBtn: "+ 做个自己的玩具 →",
    wallLatest: "最新",
    wallPopular: "热门",
    soon: "施工中 🚧",
    open: "去玩 →",
    maint: "维护中",
    toyEmpty: "玩具正在路上…",
    pingTitle: "叮我一下",
    pingSub: "有新玩具上架就邮件叮你一下，绝不啰嗦。",
    pingBtn: "叮我",
    pingOk: "🎉 收到！等好玩的东西出来就叮你。",
    pingDup: "😗 你已经在名单里啦。",
    pingErr: "出错了，稍后再试。",
    gbTitle: "留个爪印",
    trioNav: "三件套",
    meNav: "我的空间",
    gbSub: "路过盖个章，说点啥都行。",
    namePh: "名字（可留空）",
    msgPh: "说点什么...",
    stamp: "盖章",
    gbErr: "没发出去，再试一次。",
    gbPending: "已收到，内容正在排队审核。",
    gbEmpty: "还没有人留爪印，来当第一个吧～",
    reply: "回复",
    replyPh: "回复点什么…",
    sendReply: "发送",
    cancel: "取消",
    anon: "匿名小可爱",
    footNote: "用像素和好奇心拼起来的",
    navHome: "回顶",
  },
  en: {
    langBtn: "中",
    tag: "post-web3 · ai era · est. 2026",
    heroNote: ["A pouting little face —", "and a tiny shop of web curiosities."],
    decode: [
      { k: "d b", label: "the ears" },
      { k: "x x", label: "shut eyes" },
      { k: "3", label: "the pout" },
    ],
    intro: [
      "dx3xb is a gathering place for playful, gloriously useless, slightly funny little web toys — built in the age after Web3, in the age of AI. 🧸",
      "More toys are being hammered together, pixel by pixel. ⛏️",
    ],
    toyTitle: "TOY WALL",
    trioTag: "★ SIGNATURE CHALLENGE",
    trioName: "Sensory & Brainpower Trio",
    trioDims: ["👁 SENSE", "⚡ REACT", "🧠 MEMORY"],
    trioDesc: "Three games test your sense, reaction and memory — finish all three to unlock your combined brain report, then dare your friends.",
    trioStart: "START →",
    trioReport: "My report",
    toySub: "Lit cards are playable; upcoming experiments share one construction zone 🚧",
    upcomingTitle: (count: number) => `${count} NEW TOYS IN PROGRESS`,
    upcomingDesc: "Random toys, AI magic and pixel experiments are taking shape.",
    wallTitle: "MADE BY PLAYERS",
    wallSub: "Quizzes & games the community built — tap to play.",
    wallEmpty: "Nothing here yet,",
    wallMake: "make the first →",
    wallMakeBtn: "+ Make your own →",
    wallLatest: "LATEST",
    wallPopular: "POPULAR",
    soon: "BUILDING 🚧",
    open: "OPEN →",
    maint: "MAINTENANCE",
    toyEmpty: "toys are on the way…",
    pingTitle: "PING ME",
    pingSub: "A tiny email when a new toy drops. No spam, ever.",
    pingBtn: "PING",
    pingOk: "🎉 Done — we'll ping you when something fun appears!",
    pingDup: "😗 You're already on the list.",
    pingErr: "Something broke, try again.",
    gbTitle: "GUESTBOOK",
    trioNav: "TRIO",
    meNav: "MY SPACE",
    gbSub: "Leave a paw print, say anything.",
    namePh: "name (optional)",
    msgPh: "say something...",
    stamp: "STAMP",
    gbErr: "Failed to send, try again.",
    gbPending: "Received — this message is waiting for review.",
    gbEmpty: "No paw prints yet — be the first!",
    reply: "Reply",
    replyPh: "Write a reply…",
    sendReply: "Send",
    cancel: "Cancel",
    anon: "Anonymous Cutie",
    footNote: "hammered together with pixels & curiosity",
    navHome: "TOP",
  },
} as const;

function timeAgo(iso: string, lang: Lang) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (lang === "en") {
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
  if (s < 60) return "刚刚";
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function savedLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "zh" || fromUrl === "en") return fromUrl;
  const saved = window.localStorage.getItem("dx3xb_lang");
  return saved === "zh" || saved === "en" ? saved : null;
}

export function HomeClient({ initialLang, initialToys, initialCommunity }: HomeClientProps) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [showNav, setShowNav] = useState(false);
  const [toys, setToys] = useState<PublicToy[]>(initialToys);

  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "ok" | "dup" | "err">("idle");

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [gbState, setGbState] = useState<"idle" | "loading" | "pending" | "err">("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [community, setCommunity] = useState<WallApp[]>(initialCommunity);
  const [wallSort, setWallSort] = useState<"latest" | "popular">("latest");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyName, setReplyName] = useState("");
  const [replyMsg, setReplyMsg] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const guestbookRef = useRef<HTMLElement | null>(null);
  const guestbookLoadedRef = useRef(false);
  const firstWallRenderRef = useRef(initialCommunity.length > 0);

  const t = COPY[lang];
  const upcomingCount = toys.filter((toy) => toy.status === "coming_soon").length;
  const visibleToys: PublicToy[] = [
    ...toys.filter((toy) => toy.status !== "coming_soon"),
    ...(upcomingCount > 0 ? [{
      slug: "upcoming",
      title_zh: COPY.zh.upcomingTitle(upcomingCount),
      title_en: COPY.en.upcomingTitle(upcomingCount),
      desc_zh: COPY.zh.upcomingDesc,
      desc_en: COPY.en.upcomingDesc,
      icon: "🚧",
      type: "internal",
      url: "",
      status: "coming_soon",
    }] : []),
  ];
  const showWallTabs = Math.max(initialCommunity.length, community.length) >= 6;

  // 服务端先输出 URL 指定语言；无参数时再沿用本机偏好。
  useEffect(() => {
    const preferred = savedLang();
    if (preferred) setLang(preferred);
  }, []);

  useEffect(() => {
    if (initialToys.length > 0) return;
    fetch("/api/toys")
      .then((response) => response.json())
      .then((data) => setToys(data.toys ?? []))
      .catch(() => {});
  }, [initialToys.length]);

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      try {
        persistLanguage(next);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", next);
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // 滚动出现导航
  useEffect(() => {
    const onScroll = () => setShowNav(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function loadGuestbook() {
    try {
      const res = await fetch("/api/guestbook", { cache: "no-store" });
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      /* ignore */
    }
  }

  async function loadWall(sort: "latest" | "popular") {
    try {
      const res = await fetch(`/api/wall?sort=${sort}`);
      const d = await res.json();
      setCommunity(d.apps ?? []);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const target = guestbookRef.current;
    const loadOnce = () => {
      if (guestbookLoadedRef.current) return;
      guestbookLoadedRef.current = true;
      void loadGuestbook();
    };
    if (!target || typeof IntersectionObserver === "undefined") {
      loadOnce();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadOnce();
        observer.disconnect();
      }
    }, { rootMargin: "500px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (firstWallRenderRef.current) {
      firstWallRenderRef.current = false;
      return;
    }
    void loadWall(wallSort);
  }, [wallSort]);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setSubState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubState(data.already ? "dup" : "ok");
        setEmail("");
      } else {
        setSubState("err");
      }
    } catch {
      setSubState("err");
    }
  }

  async function sign(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setGbState("loading");
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("");
        setWebsite("");
        setGbState(data.moderated ? "pending" : "idle");
        loadGuestbook();
      } else {
        setGbState("err");
      }
    } catch {
      setGbState("err");
    }
  }

  function openReply(topId: number, atName: string) {
    setReplyTo(topId);
    setReplyName("");
    setReplyMsg(atName ? `@${atName} ` : "");
  }
  async function submitReply() {
    if (!replyMsg.trim() || replyTo == null || replyBusy) return;
    setReplyBusy(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: replyName, message: replyMsg, parent_id: replyTo }),
      });
      const data = await res.json();
      if (data.ok) {
        setReplyTo(null);
        setReplyMsg("");
        setReplyName("");
        loadGuestbook();
      }
    } catch {
      /* ignore */
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <>
      {!showNav && (
        <button className="langtoggle" onClick={toggleLang} aria-label="switch language">
          {t.langBtn}
        </button>
      )}

      <nav className={`topnav ${showNav ? "show" : ""}`}>
        <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          dx3xb
        </button>
        <div className="navgroup">
          <button className="navbtn" onClick={() => scrollToId("toys")}>{t.toyTitle}</button>
          <button className="navbtn" onClick={() => scrollToId("ping")}>{t.pingTitle}</button>
          <button className="navbtn" onClick={() => scrollToId("guestbook")}>{t.gbTitle}</button>
          <a className="navbtn" href={`/trio?lang=${lang}`} style={{ textDecoration: "none" }}>{t.trioNav}</a>
          <a className="navbtn" href={`/me?lang=${lang}`} style={{ textDecoration: "none" }}>{t.meNav}</a>
          <button className="navlang" onClick={toggleLang} aria-label="switch language">{t.langBtn}</button>
        </div>
      </nav>

      <main className="wrap">
        {/* HERO */}
        <section className="hero">
          <div className="tag">{t.tag}</div>
          <div className="face" aria-label="dx3xb pouting face">
            <span className="ear l">d</span>
            <span className="eye l">x</span>
            <span className="mouth">3</span>
            <span className="eye r">x</span>
            <span className="ear r">b</span>
          </div>
          <div className="decode">
            {t.decode.map((c, i) => (
              <span className="chip" key={i}><b>{c.k}</b>{c.label}</span>
            ))}
          </div>
          <p className="note" style={{ marginTop: 20 }}>
            {t.heroNote[0]}<br />{t.heroNote[1]}
          </p>
        </section>

        {/* INTRO */}
        <section className="section">
          <div className="panel">
            {t.intro.map((p, i) => (
              <p key={i} style={{ marginTop: i === 0 ? 0 : 12, marginBottom: 0 }} className={i === 0 ? "" : "note"}>
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* TRIO 招牌挑战 */}
        <section className="section">
          <div className="triohero">
            <span className="triotag pixel">{t.trioTag}</span>
            <h2 className="pixel trioname">{t.trioName}</h2>
            <div className="triodims">
              {t.trioDims.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <p className="triodesc">{t.trioDesc}</p>
            <div className="trioactions">
              <a className="btn" href={`https://color-hunter.dx3xb.com/?lang=${lang}`}>{t.trioStart}</a>
              <a className="btn ghost" href={`/trio?lang=${lang}`}>{t.trioReport}</a>
            </div>
          </div>
        </section>

        {/* TOYS */}
        <section className="section" id="toys">
          <h2 className="h2">{t.toyTitle}</h2>
          <p className="sub">{t.toySub}</p>
          <div className="grid">
            {toys.length === 0 ? (
              <p className="note">{t.toyEmpty}</p>
            ) : (
              visibleToys.map((toy, i) => {
                const title = lang === "zh" ? toy.title_zh : toy.title_en;
                const desc = lang === "zh" ? toy.desc_zh : toy.desc_en;
                const label =
                  toy.status === "live" ? t.open : toy.status === "maintenance" ? t.maint : t.soon;
                const inner = (
                  <>
                    <div className="emoji" style={{ animationDelay: `${i * 0.2}s` }}>{toy.icon}</div>
                    <div className="pixel" style={{ fontSize: 15 }}>{title}</div>
                    {desc ? <div className="note" style={{ fontSize: 15 }}>{desc}</div> : null}
                    <div className="soon">{label}</div>
                  </>
                );
                if (toy.status === "live" && toy.url) {
                  const sep = toy.url.includes("?") ? "&" : "?";
                  const href = `${toy.url}${sep}lang=${lang}`;
                  return (
                    <a className="toy live" href={href} target="_blank" rel="noopener noreferrer" key={toy.slug}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <div className={`toy ${toy.status}`} key={toy.slug}>
                    <WallScene id={toy.slug} variant={i % 3} />
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 玩家做的玩具（社区墙） */}
        <section className="section">
          <h2 className="h2">{t.wallTitle}</h2>
          <p className="sub">{t.wallSub}</p>
          {community.length === 0 ? (
            <p className="note">{t.wallEmpty} <a href={`/studio?lang=${lang}`}>{t.wallMake}</a></p>
          ) : (
            <>
              {showWallTabs && (
                <div className="wall-tabs" role="tablist" aria-label={t.wallTitle}>
                  <button role="tab" aria-selected={wallSort === "latest"} className={wallSort === "latest" ? "on" : ""} onClick={() => setWallSort("latest")}>{t.wallLatest}</button>
                  <button role="tab" aria-selected={wallSort === "popular"} className={wallSort === "popular" ? "on" : ""} onClick={() => setWallSort("popular")}>{t.wallPopular}</button>
                </div>
              )}
              <div className="grid">
                {community.map((a) => <CommunityGameCard app={a} lang={lang} key={a.slug} />)}
              </div>
              <div style={{ marginTop: 14 }}>
                <a className="btn" href={`/studio?lang=${lang}`} style={{ textDecoration: "none", display: "inline-block" }}>{t.wallMakeBtn}</a>
              </div>
            </>
          )}
        </section>

        {/* SUBSCRIBE */}
        <section className="section" id="ping">
          <h2 className="h2">{t.pingTitle}</h2>
          <p className="sub">{t.pingSub}</p>
          <div className="panel">
            <form onSubmit={subscribe} className="row">
              <label className="sr-only" htmlFor="subscribe-email">Email</label>
              <input
                id="subscribe-email"
                className="input grow"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="btn" type="submit" disabled={subState === "loading"}>
                {subState === "loading" ? "..." : t.pingBtn}
              </button>
            </form>
            <div role="status" aria-live="polite">
              {subState === "ok" && <p className="note ok">{t.pingOk}</p>}
              {subState === "dup" && <p className="note ok">{t.pingDup}</p>}
              {subState === "err" && <p className="note err">{t.pingErr}</p>}
            </div>
          </div>
        </section>

        {/* GUESTBOOK */}
        <section className="section" id="guestbook" ref={guestbookRef}>
          <h2 className="h2">{t.gbTitle}</h2>
          <p className="sub">{t.gbSub}</p>
          <div className="panel">
            <form onSubmit={sign}>
              <div className="row" style={{ marginBottom: 10 }}>
                <label className="sr-only" htmlFor="guestbook-name">{t.namePh}</label>
                <input
                  id="guestbook-name"
                  className="input grow"
                  type="text"
                  maxLength={24}
                  placeholder={t.namePh}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <label className="sr-only" htmlFor="guestbook-message">{t.msgPh}</label>
              <textarea
                id="guestbook-message"
                className="textarea"
                maxLength={280}
                placeholder={t.msgPh}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="guestbook-website">Website</label>
                <input
                  id="guestbook-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="note" style={{ fontSize: 15 }}>{message.length}/280</span>
                <button className="btn teal" type="submit" disabled={gbState === "loading" || !message.trim()}>
                  {gbState === "loading" ? "..." : t.stamp}
                </button>
              </div>
            </form>
            <div role="status" aria-live="polite">
              {gbState === "pending" && <p className="note ok">{t.gbPending}</p>}
              {gbState === "err" && <p className="note err">{t.gbErr}</p>}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {messages.length === 0 ? (
              <p className="note">{t.gbEmpty}</p>
            ) : (
              messages
                .filter((m) => !m.parent_id)
                .map((top) => {
                  const replies = messages.filter((m) => m.parent_id === top.id);
                  return (
                    <div className="thread" key={top.id}>
                      <div className="msg">
                        <span className="when">{timeAgo(top.created_at, lang)}</span>
                        <span className="who">{top.name || t.anon}</span>
                        <div className="what">{top.message}</div>
                        <button className="replybtn" onClick={() => openReply(top.id, "")}>↩ {t.reply}</button>
                      </div>
                      {replies.map((rep) => (
                        <div className="msg reply" key={rep.id}>
                          <span className="when">{timeAgo(rep.created_at, lang)}</span>
                          <span className="who">{rep.name || t.anon}</span>
                          <div className="what">{rep.message}</div>
                          <button className="replybtn" onClick={() => openReply(top.id, rep.name || t.anon)}>↩ {t.reply}</button>
                        </div>
                      ))}
                      {replyTo === top.id && (
                        <div className="msg reply replyform">
                          <label className="sr-only" htmlFor={`reply-name-${top.id}`}>{t.namePh}</label>
                          <input id={`reply-name-${top.id}`} className="input" type="text" maxLength={24} placeholder={t.namePh} value={replyName} onChange={(e) => setReplyName(e.target.value)} style={{ marginBottom: 8 }} />
                          <label className="sr-only" htmlFor={`reply-message-${top.id}`}>{t.replyPh}</label>
                          <textarea id={`reply-message-${top.id}`} className="textarea" maxLength={280} placeholder={t.replyPh} value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button className="btn teal" onClick={submitReply} disabled={replyBusy || !replyMsg.trim()}>{t.sendReply}</button>
                            <button className="btn" style={{ background: "#fff", color: "var(--ink)" }} onClick={() => setReplyTo(null)}>{t.cancel}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="bigface">dx3xb</div>
          <p>{t.footNote}</p>
          <p className="note" style={{ fontSize: 15 }}>© 2026 dx3xb.com</p>
        </footer>
      </main>
    </>
  );
}
