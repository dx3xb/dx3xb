import { NextRequest, NextResponse } from "next/server";
import { authed } from "@/lib/admin-auth";
import { readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";
import { extractMicroMeta, summarizeMicroConfig } from "@/app/_mt/micro-meta";

export const runtime = "nodejs";

const ALLOWED = ["draft", "unlisted", "pending", "public", "hidden"];
type AdminMicroapp = {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: string;
  plays: number;
  created_at: string;
  updated_at: string | null;
  config: unknown;
};

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const supabase = getServiceClient();
    const { data: apps, error } = await supabase
      .from("dx3xb_microapps")
      .select("id, slug, title, template, status, plays, created_at, updated_at, config")
      .in("status", ["pending", "public", "hidden"])
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    const { data: reports } = await supabase.from("dx3xb_microapp_reports").select("microapp_id");
    const counts: Record<string, number> = {};
    for (const r of reports ?? []) counts[(r as { microapp_id: string }).microapp_id] = (counts[(r as { microapp_id: string }).microapp_id] ?? 0) + 1;
    const { data: events } = await (supabase as any).from("dx3xb_microapp_events").select("microapp_id,event").limit(20000);
    const eventCounts: Record<string, Record<string, number>> = {};
    for (const e of events ?? []) {
      const id = String(e.microapp_id);
      const event = String(e.event);
      eventCounts[id] = eventCounts[id] ?? {};
      eventCounts[id][event] = (eventCounts[id][event] ?? 0) + 1;
    }
    const out = ((apps ?? []) as AdminMicroapp[]).map((a) => {
      const ev = eventCounts[a.id] ?? {};
      const views = ev.view ?? 0;
      const completes = ev.complete ?? 0;
      return {
        ...a,
        reports: counts[a.id] ?? 0,
        views,
        starts: ev.start ?? 0,
        completes,
        shares: ev.share ?? 0,
        completionRate: views > 0 ? Math.round((completes / views) * 100) : 0,
        meta: extractMicroMeta(a.config),
        configSummary: summarizeMicroConfig(a.template, a.config, "zh"),
      };
    });
    // pending 优先排前
    out.sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
    return NextResponse.json({ ok: true, apps: out });
  } catch (e) {
    console.error("admin ma read", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const parsed = await readJson<{ id?: string; status?: string }>(req, 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const { id, status } = body;
  if (typeof id !== "string" || typeof status !== "string" || !ALLOWED.includes(status))
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_microapps").update({ status }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin ma patch", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
