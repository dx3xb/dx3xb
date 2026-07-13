import { NextRequest, NextResponse } from "next/server";
import { readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (tooManyRequests(req, "funnel", 30, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = await readJson<{ event?: string; microappId?: string }>(req, 1024);
  if (!parsed.ok || parsed.value.event !== "workshop_enter") return NextResponse.json({ ok: false }, { status: 400 });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const supabase = getServiceClient();
  const { data } = await supabase.auth.getUser(token);
  if (!data.user || data.user.is_anonymous) return NextResponse.json({ ok: false }, { status: 401 });
  const microappId = String(parsed.value.microappId || "");
  const { data: app } = await supabase.from("dx3xb_microapps").select("id").eq("id", microappId).eq("owner_id", data.user.id).maybeSingle();
  if (!app) return NextResponse.json({ ok: false }, { status: 404 });
  await supabase.rpc("dx3xb_record_funnel_event", { p_event: "workshop_enter", p_user_id: data.user.id, p_microapp_id: app.id });
  return NextResponse.json({ ok: true });
}
