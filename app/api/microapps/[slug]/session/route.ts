import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { issuePlayToken, requestFingerprint } from "@/lib/play-session";
import { tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function cleanSlug(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "").slice(0, 32);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (tooManyRequests(req, "microapp:play-session", 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const slug = cleanSlug((await params).slug);
  if (!slug) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
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

    const sessionId = randomUUID();
    const expiresAt = Date.now() + 2 * 60 * 60_000;
    const { data: created, error: sessionError } = await (supabase as any).rpc("dx3xb_create_play_session", {
      p_session_id: sessionId,
      p_microapp_id: app.id,
      p_fingerprint_hash: requestFingerprint(req),
      p_expires_at: new Date(expiresAt).toISOString(),
    });
    if (sessionError) throw sessionError;
    if (!created) return NextResponse.json({ ok: false, error: "session_rejected" }, { status: 409 });
    return NextResponse.json({ ok: true, token: issuePlayToken(sessionId, app.id, expiresAt), expiresAt });
  } catch (error) {
    console.error("play session create failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
