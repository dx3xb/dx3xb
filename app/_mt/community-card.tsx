"use client";

import type { MouseEventHandler } from "react";
import { trackMicroappEvent } from "../dx3xb-apps";
import { creatorHref, type PublicCreator, type PublicMicroappSummary } from "./creator-types";
import type { Lang } from "./types";

const DEFAULT_AVATAR = "/icon-192.png";
const TEMPLATE_EMOJI: Record<string, string> = {
  quiz: "🐱",
  knowme: "💘",
  thisorthat: "⚔️",
  higherlower: "📈",
  madlibs: "📖",
  escape: "🔐",
  workshop: "🕹️",
};

export function CreatorLink({
  creator,
  lang,
  sourceSlug,
  compact = false,
  className = "",
}: {
  creator?: PublicCreator | null;
  lang: Lang;
  sourceSlug?: string;
  compact?: boolean;
  className?: string;
}) {
  const label = lang === "zh" ? "创作者" : "CREATOR";
  const anonymous = lang === "zh" ? "匿名创作者" : "anonymous creator";
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="creator-avatar"
        src={creator?.avatarUrl || DEFAULT_AVATAR}
        alt=""
        onError={(event) => {
          if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) event.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
      <span className="creator-copy">
        {!compact && <small>{label}</small>}
        <b>{creator ? `@${creator.handle}` : anonymous}</b>
      </span>
    </>
  );

  if (!creator) return <span className={`creator-link anonymous ${compact ? "compact" : ""} ${className}`}>{content}</span>;
  return (
    <a
      className={`creator-link ${compact ? "compact" : ""} ${className}`}
      href={creatorHref(creator.handle, lang)}
      onClick={() => {
        if (sourceSlug) void trackMicroappEvent(sourceSlug, "creator_link_click");
      }}
    >
      {content}
    </a>
  );
}

export function CommunityGameCard({
  app,
  lang,
  context = "wall",
  showCreator = true,
}: {
  app: PublicMicroappSummary;
  lang: Lang;
  context?: "wall" | "creator" | "more";
  showCreator?: boolean;
}) {
  const onGameClick: MouseEventHandler<HTMLAnchorElement> = () => {
    if (context !== "wall") void trackMicroappEvent(app.slug, "creator_work_click");
  };
  return (
    <article className="toy live community-card">
      <a className="community-game-link" href={`/u/${app.slug}?lang=${lang}`} onClick={onGameClick}>
        <span className="emoji" aria-hidden="true">{TEMPLATE_EMOJI[app.template] || "🎲"}</span>
        <span className="pixel community-title">{app.title || (lang === "zh" ? "未命名游戏" : "Untitled game")}</span>
        <span className="soon">▶ {app.plays}</span>
      </a>
      {showCreator && <CreatorLink creator={app.creator} lang={lang} sourceSlug={app.slug} compact />}
    </article>
  );
}
