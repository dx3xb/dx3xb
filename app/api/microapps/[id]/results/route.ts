import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// 玩家测试结果：只保留 24 小时。无 pg_cron，采用读写双侧惰性清理——
// 过期行在任何一次写入/读取时被物理删除，且查询侧永远带时间窗过滤。
const WINDOW = "24 hours";

function cleanId(value: string) {
  return value.replace(/[^a-f0-9-]/gi, "").slice(0, 40);
}

async function purgeExpired(supabase: ReturnType<typeof getServiceClient>) {
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  await (supabase as any).from("dx3xb_play_results").delete().lt("created_at", cutoff);
}

type Body = { label?: string; score?: number };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (tooManyRequests(req, "microapp:result", 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const parsed = await readJson<Body>(req, 1024);
  if (!parsed.ok) return parsed.response;
  const label = cleanText(parsed.value.label, 60);
  const scoreRaw = Number(parsed.value.score);
  const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : null;
  if (!label) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const { id: rawId } = await params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  try {
    const supabase = getServiceClient();
    const { data: app } = await supabase.from("dx3xb_microapps").select("id").eq("id", id).maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    await purgeExpired(supabase);
    const { error } = await (supabase as any).from("dx3xb_play_results").insert({ microapp_id: id, label, score });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("play result save failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { id: rawId } = await params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  try {
    const supabase = getServiceClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const { data: app } = await supabase.from("dx3xb_microapps").select("id,owner_id,title").eq("id", id).maybeSingle();
    if (!app || app.owner_id !== auth.user.id) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    await purgeExpired(supabase);
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data, error } = await (supabase as any)
      .from("dx3xb_play_results")
      .select("label,score,created_at")
      .eq("microapp_id", id)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    return NextResponse.json({ ok: true, title: app.title, window: WINDOW, items: data ?? [] });
  } catch (error) {
    console.error("play results read failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
