import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJsonSchema, tooManyRequests } from "@/lib/request-guards";
import { playResultBodySchema } from "@/lib/api-schemas";
import { getServiceClient } from "@/lib/supabase";
import { verifyPlayToken } from "@/lib/play-session";

export const runtime = "nodejs";

const WINDOW = "24 hours";

function cleanId(value: string) {
  return value.replace(/[^a-f0-9-]/gi, "").slice(0, 40);
}

type Body = { label?: string; score?: number; playToken?: string };

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (tooManyRequests(req, "microapp:result", 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const parsed = await readJsonSchema(req, playResultBodySchema, 1024);
  if (!parsed.ok) return parsed.response;
  const label = cleanText(parsed.value.label, 60);
  const scoreRaw = Number(parsed.value.score);
  const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : null;
  if (!label) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const { key: rawId } = await params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  try {
    const supabase = getServiceClient();
    const { data: app } = await supabase.from("dx3xb_microapps").select("id").eq("id", id).maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const play = verifyPlayToken(parsed.value.playToken);
    if (!play || play.app !== id) return NextResponse.json({ ok: false, error: "invalid_play_session" }, { status: 401 });
    const { data: saved, error } = await supabase.rpc("dx3xb_save_play_result", {
      p_session_id: play.sid,
      p_microapp_id: id,
      p_label: label,
      p_score: score ?? 0,
    });
    if (error) throw error;
    if (!saved) return NextResponse.json({ ok: false, error: "invalid_play_session" }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("play result save failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { key: rawId } = await params;
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
