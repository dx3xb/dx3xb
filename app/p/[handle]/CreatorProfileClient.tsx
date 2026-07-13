"use client";

import { useEffect, useMemo, useState } from "react";
import { CommunityGameCard } from "../../_mt/community-card";
import type { PublicCreatorPage } from "../../_mt/creator-types";
import { trackMicroappEvent } from "../../dx3xb-apps";
import { dx3xb } from "../../dx3xb-trio";

type Lang = "zh" | "en";

const C = {
  zh: {
    back: "← dx3xb",
    make: "做个游戏 →",
    switch: "EN",
    space: "创作者空间",
    works: "公开作品",
    plays: "总游玩",
    joined: "加入时间",
    latest: "最新",
    popular: "热门",
    games: "TA 的游戏",
    empty: "还没有公开作品。",
    follow: "关注",
    following: "已关注",
  },
  en: {
    back: "← dx3xb",
    make: "Make a game →",
    switch: "中",
    space: "CREATOR SPACE",
    works: "PUBLISHED",
    plays: "TOTAL PLAYS",
    joined: "JOINED",
    latest: "LATEST",
    popular: "POPULAR",
    games: "CREATIONS",
    empty: "No public games yet.",
    follow: "Follow",
    following: "Following",
  },
} as const;

export function CreatorProfileClient({ data, lang }: { data: PublicCreatorPage; lang: Lang }) {
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [following, setFollowing] = useState(false);
  const t = C[lang];
  const apps = useMemo(() => {
    const next = [...data.apps];
    if (sort === "popular") return next.sort((a, b) => b.plays - a.plays);
    return next.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }, [data.apps, sort]);
  const joined = data.creator.joinedAt
    ? new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en", { year: "numeric", month: "short" }).format(new Date(data.creator.joinedAt))
    : "—";

  useEffect(() => {
    const anchor = data.apps[0]?.slug;
    if (anchor) void trackMicroappEvent(anchor, "creator_profile_view");
  }, [data.apps]);

  useEffect(() => {
    void (async () => {
      const { data: session } = await dx3xb().auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/social/follow?handle=${encodeURIComponent(data.creator.handle)}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => null);
      if (res.ok) setFollowing(Boolean(body?.following));
    })();
  }, [data.creator.handle]);

  async function toggleFollow() {
    const { data: session } = await dx3xb().auth.getSession();
    const token = session.session?.access_token;
    if (!token) {
      window.location.href = `/me?lang=${lang}`;
      return;
    }
    const res = await fetch("/api/social/follow", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ handle: data.creator.handle, active: !following }) });
    if (res.ok) setFollowing(!following);
    else if (res.status === 401) window.location.href = `/me?lang=${lang}`;
  }

  return (
    <main className="creator-page">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <nav className="creator-bar" aria-label="creator navigation">
        <a className="creator-btn" href={`/?lang=${lang}`}>{t.back}</a>
        <div className="creator-actions">
          <a className="creator-btn yellow" href={`?lang=${lang === "zh" ? "en" : "zh"}`}>{t.switch}</a>
          <a className="creator-btn coral" href={`/studio?lang=${lang}`}>{t.make}</a>
        </div>
      </nav>

      <header className="creator-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.creator.avatarUrl || "/icon-192.png"}
          alt={`@${data.creator.handle}`}
          onError={(event) => {
            if (!event.currentTarget.src.endsWith("/icon-192.png")) event.currentTarget.src = "/icon-192.png";
          }}
        />
        <div className="creator-identity">
          <span>{t.space}</span>
          <h1>@{data.creator.handle}</h1>
          <button className="creator-follow" aria-pressed={following} onClick={toggleFollow}>{following ? `✓ ${t.following}` : `+ ${t.follow}`}</button>
        </div>
        <div className="creator-stats">
          <div><b>{data.apps.length}</b><span>{t.works}</span></div>
          <div><b>{data.totalPlays}</b><span>{t.plays}</span></div>
          <div><b>{joined}</b><span>{t.joined}</span></div>
        </div>
      </header>

      <section className="creator-works">
        <div className="creator-works-head">
          <h2>{t.games}</h2>
          <div className="wall-tabs" role="tablist" aria-label={t.games}>
            <button role="tab" aria-selected={sort === "latest"} className={sort === "latest" ? "on" : ""} onClick={() => setSort("latest")}>{t.latest}</button>
            <button role="tab" aria-selected={sort === "popular"} className={sort === "popular" ? "on" : ""} onClick={() => setSort("popular")}>{t.popular}</button>
          </div>
        </div>
        {apps.length === 0 ? (
          <p className="creator-empty">{t.empty}</p>
        ) : (
          <div className="grid creator-grid">
            {apps.map((app) => <CommunityGameCard key={app.slug} app={{ ...app, creator: data.creator }} lang={lang} context="creator" />)}
          </div>
        )}
      </section>
    </main>
  );
}

const STYLE = `
.creator-page { max-width: 1040px; margin: 0 auto; padding: 22px 16px 64px; }
.creator-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 28px; }
.creator-actions { display: flex; gap: 8px; }
.creator-btn { color: var(--ink); text-decoration: none; background: #fff; border: 3px solid var(--line); box-shadow: 3px 3px 0 var(--ink);
  padding: 9px 12px; font-family: var(--font-press), "FpxCJK", monospace; font-size: 10px; }
.creator-btn.yellow { background: var(--yellow); }
.creator-btn.coral { background: var(--coral); color: #fff; }
.creator-hero { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 18px; align-items: center; padding: 0 0 24px; border-bottom: 4px solid var(--line); }
.creator-hero > img { width: 112px; height: 112px; object-fit: cover; background: #fff; border: 4px solid var(--line); box-shadow: 7px 7px 0 var(--teal); }
.creator-identity { min-width: 0; }
.creator-identity > span { font-family: var(--font-press), "FpxCJK", monospace; font-size: 10px; color: var(--coral); }
.creator-identity h1 { margin: 8px 0 0; font-size: 36px; line-height: 1.15; overflow-wrap: anywhere; }
.creator-follow { margin-top: 12px; padding: 8px 12px; border: 3px solid var(--line); background: var(--teal); color: #fff; box-shadow: 3px 3px 0 var(--ink); font-family: var(--font-press), "FpxCJK", monospace; font-size: 9px; cursor: pointer; }
.creator-stats { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); border: 3px solid var(--line); background: #fff; }
.creator-stats > div { min-width: 0; padding: 12px; display: grid; gap: 3px; text-align: center; }
.creator-stats > div + div { border-left: 3px solid var(--line); }
.creator-stats b { font-family: var(--font-press), "FpxCJK", monospace; font-size: 13px; overflow-wrap: anywhere; }
.creator-stats span { color: var(--ink-soft); font-size: 14px; }
.creator-works { margin-top: 30px; }
.creator-works-head { display: flex; justify-content: space-between; align-items: end; gap: 12px; margin-bottom: 12px; }
.creator-works h2 { margin: 0; font-family: var(--font-press), "FpxCJK", monospace; font-size: 14px; }
.creator-works .wall-tabs { margin: 0; }
.creator-grid { grid-template-columns: repeat(auto-fill,minmax(210px,1fr)); }
.creator-empty { color: var(--ink-soft); }
@media (max-width: 560px) {
  .creator-page { padding-top: 14px; }
  .creator-bar { align-items: flex-start; }
  .creator-actions { flex-wrap: wrap; justify-content: flex-end; }
  .creator-hero { grid-template-columns: 82px minmax(0,1fr); gap: 14px; }
  .creator-hero > img { width: 82px; height: 82px; box-shadow: 5px 5px 0 var(--teal); }
  .creator-identity h1 { font-size: 27px; }
  .creator-stats { grid-template-columns: 1fr; }
  .creator-stats > div + div { border-left: 0; border-top: 3px solid var(--line); }
  .creator-works-head { align-items: center; }
}
`;
