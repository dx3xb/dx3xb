import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function bearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function context(req: NextRequest, handle: string) {
  const token = bearer(req);
  if (!token) return null;
  const supabase = getServiceClient();
  const [{ data: auth }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(token),
    supabase.from("dx3xb_profiles").select("user_id").ilike("handle", handle).maybeSingle(),
  ]);
  if (!auth.user || auth.user.is_anonymous || !profile) return null;
  return { supabase, followerId: auth.user.id, creatorId: profile.user_id };
}

export async function GET(req: NextRequest) {
  const handle = cleanText(req.nextUrl.searchParams.get("handle"), 24);
  const ctx = await context(req, handle);
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const { data } = await (ctx.supabase as any).from("dx3xb_creator_follows").select("creator_id").eq("follower_id", ctx.followerId).eq("creator_id", ctx.creatorId).maybeSingle();
  return NextResponse.json({ ok: true, following: Boolean(data) });
}

export async function POST(req: NextRequest) {
  if (tooManyRequests(req, "social:follow", 20, 60_000)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  const parsed = await readJson<{ handle?: string; active?: boolean }>(req, 1024);
  if (!parsed.ok) return parsed.response;
  const ctx = await context(req, cleanText(parsed.value.handle, 24));
  if (!ctx) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (ctx.followerId === ctx.creatorId) return NextResponse.json({ ok: false, error: "self_follow" }, { status: 400 });
  const query = parsed.value.active
    ? (ctx.supabase as any).from("dx3xb_creator_follows").upsert({ follower_id: ctx.followerId, creator_id: ctx.creatorId })
    : (ctx.supabase as any).from("dx3xb_creator_follows").delete().eq("follower_id", ctx.followerId).eq("creator_id", ctx.creatorId);
  const { error } = await query;
  if (error) throw error;
  return NextResponse.json({ ok: true, following: Boolean(parsed.value.active) });
}
