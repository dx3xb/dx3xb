import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const EVENTS = new Set([
  "view",
  "start",
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

function sessionId(req: NextRequest, event: string) {
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";
  const secret = process.env.EVENT_HASH_SECRET || process.env.SUPABASE_SERVICE_KEY || "dx3xb-events";
  const digest = createHmac("sha256", secret).update(`${ip}:${ua}`.slice(0, 180)).digest("base64url").slice(0, 40);
  return CREATOR_EVENTS.has(event) ? `${event}:${digest}`.slice(0, 64) : digest;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (tooManyRequests(req, "microapp:event", 120, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const { slug: rawSlug } = await params;
  const slug = cleanSlug(rawSlug);
  const parsed = await readJson<{ event?: string }>(req, 512);
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

    // The existing database constraint accepts the original event enum only.
    // Creator events stay distinguishable by the session prefix until the analytics table is migrated.
    const storedEvent = CREATOR_EVENTS.has(event) ? "view" : event;
    const { error } = await (supabase as any).from("dx3xb_microapp_events").insert({
      microapp_id: app.id,
      event: storedEvent,
      session_id: sessionId(req, event),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("microapp event failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
