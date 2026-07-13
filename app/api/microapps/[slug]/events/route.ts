import { NextRequest, NextResponse } from "next/server";
import { readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";
import { requestFingerprint, verifyPlayToken } from "@/lib/play-session";

export const runtime = "nodejs";

const EVENTS = new Set([
  "view",
  "complete",
  "share",
  "creator_link_click",
  "creator_profile_view",
  "creator_work_click",
]);
const CREATOR_EVENTS = new Set(["creator_link_click", "creator_profile_view", "creator_work_click"]);

function cleanSlug(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "").slice(0, 32);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (tooManyRequests(req, "microapp:event", 120, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const { slug: rawSlug } = await params;
  const slug = cleanSlug(rawSlug);
  const parsed = await readJson<{ event?: string; playToken?: string }>(req, 1024);
  if (!parsed.ok) return parsed.response;
  const event = parsed.value.event;
  if (!slug || typeof event !== "string" || !EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { data: app, error: appError } = await supabase
      .from("dx3xb_microapps")
      .select("id")
      .eq("slug", slug)
      .in("status", ["unlisted", "pending", "public"])
      .maybeSingle();
    if (appError) throw appError;
    if (!app) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    if (event === "complete" || event === "share") {
      const play = verifyPlayToken(parsed.value.playToken);
      if (!play || play.app !== app.id) return NextResponse.json({ ok: false, error: "invalid_play_session" }, { status: 401 });
      const { data: accepted, error } = await (supabase as any).rpc("dx3xb_accept_play_event", {
        p_session_id: play.sid,
        p_microapp_id: app.id,
        p_event: event,
      });
      if (error) throw error;
      if (!accepted) return NextResponse.json({ ok: false, error: "invalid_play_session" }, { status: 401 });
      return NextResponse.json({ ok: true });
    }

    const storedEvent = CREATOR_EVENTS.has(event) ? "view" : event;
    const { error } = await (supabase as any).from("dx3xb_microapp_events").insert({
      microapp_id: app.id,
      event: storedEvent,
      session_id: CREATOR_EVENTS.has(event) ? `${event}:${requestFingerprint(req)}`.slice(0, 64) : requestFingerprint(req).slice(0, 64),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("microapp event failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
