import "server-only";
import { getServiceClient } from "./supabase";
import type { PublicCreator, PublicCreatorPage, PublicMicroappSummary } from "@/app/_mt/creator-types";

const AVATAR_BUCKET = "dx3xb-avatars";

function cleanHandle(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

function avatarUrl(supabase: ReturnType<typeof getServiceClient>, userId: string) {
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(`${userId}/avatar`);
  return data.publicUrl;
}

export async function getPublicCreators(ownerIds: string[]) {
  const ids = Array.from(new Set(ownerIds.filter(Boolean)));
  const result = new Map<string, PublicCreator>();
  if (ids.length === 0) return result;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("dx3xb_profiles")
    .select("user_id,handle,created_at")
    .in("user_id", ids);
  if (error) throw error;

  for (const profile of data ?? []) {
    const handle = cleanHandle(profile.handle);
    if (!handle) continue;
    result.set(profile.user_id, {
      handle,
      avatarUrl: avatarUrl(supabase, profile.user_id),
      joinedAt: profile.created_at,
    });
  }
  return result;
}

export async function getPublicCreatorPage(handleInput: string): Promise<PublicCreatorPage | null> {
  const handle = cleanHandle(handleInput);
  if (!handle) return null;

  const supabase = getServiceClient();
  const { data: profiles, error: profileError } = await supabase
    .from("dx3xb_profiles")
    .select("user_id,handle,created_at")
    .ilike("handle", handle)
    .limit(1);
  if (profileError) throw profileError;
  const profile = profiles?.[0];
  const publicHandle = cleanHandle(profile?.handle);
  if (!profile || !publicHandle) return null;

  const { data: apps, error: appsError } = await supabase
    .from("dx3xb_microapps")
    .select("slug,title,template,plays,created_at")
    .eq("owner_id", profile.user_id)
    .eq("status", "public")
    .order("created_at", { ascending: false });
  if (appsError) throw appsError;

  const summaries = (apps ?? []).map((app) => ({
    slug: app.slug,
    title: app.title,
    template: app.template,
    plays: app.plays,
    createdAt: app.created_at,
  }));
  return {
    creator: {
      handle: publicHandle,
      avatarUrl: avatarUrl(supabase, profile.user_id),
      joinedAt: profile.created_at,
    },
    apps: summaries,
    totalPlays: summaries.reduce((sum, app) => sum + app.plays, 0),
  };
}
