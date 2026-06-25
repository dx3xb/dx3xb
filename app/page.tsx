"use client";

import { useEffect, useState } from "react";

type Msg = { name: string; message: string; created_at: string };
type Lang = "zh" | "en";
type Toy = {
  slug: string;
  title_zh: string;
  title_en: string;
  desc_zh: string;
  desc_en: string;
  icon: string;
  type: string;
  url: string;
  status: string;
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
    toySub: "点亮的卡片直接玩；砌着像素砖墙的还在施工中 🚧",
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
    gbEmpty: "还没有人留爪印，来当第一个吧～",
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
    toySub: "Lit cards are playable; the ones behind a pixel brick wall are still under construction 🚧",
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
    gbEmpty: "No paw prints yet — be the first!",
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

export default function Home() {
  const [lang, setLang] = useState<Lang>("en"); // 默认英文，访客可切换并记忆
  const [showNav, setShowNav] = useState(false);
  const [toys, setToys] = useState<Toy[]>([]);

  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "ok" | "dup" | "err">("idle");

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [gbState, setGbState] = useState<"idle" | "loading" | "err">("idle");
  const [messages, setMessages] = useState<Msg[]>([]);

  const t = COPY[lang];

  // 默认英文；若访客之前切过语言则沿用其选择
  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("dx3xb_lang")) as Lang | null;
    if (saved === "zh" || saved === "en") setLang(saved);
  }, []);

  // 读取玩具墙目录
  useEffect(() => {
    fetch("/api/toys", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setToys(d.toys ?? []))
      .catch(() => {});
  }, []);

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      try {
        localStorage.setItem("dx3xb_lang", next);
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

  useEffect(() => {
    loadGuestbook();
  }, []);

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
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("");
        setGbState("idle");
        loadGuestbook();
      } else {
        setGbState("err");
      }
    } catch {
      setGbState("err");
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
          <a className="navbtn" href="/trio" style={{ textDecoration: "none" }}>{t.trioNav}</a>
          <a className="navbtn" href="/me" style={{ textDecoration: "none" }}>{t.meNav}</a>
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

        {/* TOYS */}
        <section className="section" id="toys">
          <h2 className="h2">{t.toyTitle}</h2>
          <p className="sub">{t.toySub}</p>
          <div className="grid">
            {toys.length === 0 ? (
              <p className="note">{t.toyEmpty}</p>
            ) : (
              toys.map((toy, i) => {
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

        {/* SUBSCRIBE */}
        <section className="section" id="ping">
          <h2 className="h2">{t.pingTitle}</h2>
          <p className="sub">{t.pingSub}</p>
          <div className="panel">
            <form onSubmit={subscribe} className="row">
              <input
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
            {subState === "ok" && <p className="note ok">{t.pingOk}</p>}
            {subState === "dup" && <p className="note ok">{t.pingDup}</p>}
            {subState === "err" && <p className="note err">{t.pingErr}</p>}
          </div>
        </section>

        {/* GUESTBOOK */}
        <section className="section" id="guestbook">
          <h2 className="h2">{t.gbTitle}</h2>
          <p className="sub">{t.gbSub}</p>
          <div className="panel">
            <form onSubmit={sign}>
              <div className="row" style={{ marginBottom: 10 }}>
                <input
                  className="input grow"
                  type="text"
                  maxLength={24}
                  placeholder={t.namePh}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <textarea
                className="textarea"
                maxLength={280}
                placeholder={t.msgPh}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="note" style={{ fontSize: 15 }}>{message.length}/280</span>
                <button className="btn teal" type="submit" disabled={gbState === "loading" || !message.trim()}>
                  {gbState === "loading" ? "..." : t.stamp}
                </button>
              </div>
            </form>
            {gbState === "err" && <p className="note err">{t.gbErr}</p>}
          </div>

          <div style={{ marginTop: 16 }}>
            {messages.length === 0 ? (
              <p className="note">{t.gbEmpty}</p>
            ) : (
              messages.map((m, i) => (
                <div className="msg" key={i}>
                  <span className="when">{timeAgo(m.created_at, lang)}</span>
                  <span className="who">{m.name || t.anon}</span>
                  <div className="what">{m.message}</div>
                </div>
              ))
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
