export type PublicCreator = {
  handle: string;
  avatarUrl: string;
  joinedAt: string | null;
};

export type PublicMicroappSummary = {
  slug: string;
  title: string;
  template: string;
  plays: number;
  createdAt: string | null;
  creator?: PublicCreator | null;
};

export type PublicCreatorPage = {
  creator: PublicCreator;
  apps: PublicMicroappSummary[];
  totalPlays: number;
};

export function creatorHref(handle: string, lang?: "zh" | "en") {
  const path = `/p/${encodeURIComponent(handle)}`;
  return lang ? `${path}?lang=${lang}` : path;
}
