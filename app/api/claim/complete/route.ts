import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

type ClaimPayload = {
  anonId: string;
  email: string;
  handle: string;
  exp: number;
};

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  const secret = process.env.SUPABASE_SERVICE_KEY || process.env.ADMIN_TOKEN || "";
  if (!secret) throw new Error("Missing claim signing secret");
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function parseClaimToken(token: string): ClaimPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, sign(body))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ClaimPayload;
  if (!payload.anonId || !payload.email || !payload.handle || !payload.exp) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

function safeBearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function POST(req: NextRequest) {
  const parsed = await readJson<{ claim?: string }>(req, 4096);
  if (!parsed.ok) return parsed.response;

  try {
    const claim = parseClaimToken(String(parsed.value.claim ?? ""));
    if (!claim) return NextResponse.json({ ok: false, error: "bad_or_expired_claim" }, { status: 400 });

    const token = safeBearer(req);
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const currentEmail = (data.user.email ?? "").toLowerCase();
    if (currentEmail !== claim.email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "email_mismatch" }, { status: 403 });
    }

    const targetId = data.user.id;
    const sourceId = claim.anonId;
    let movedRuns = 0;
    let movedApps = 0;

    const { data: existingHandle, error: handleError } = await supabase
      .from("dx3xb_profiles")
      .select("user_id")
      .ilike("handle", claim.handle)
      .neq("user_id", targetId)
      .maybeSingle();
    if (handleError) throw handleError;
    if (existingHandle) {
      return NextResponse.json({ ok: false, error: "handle_taken" }, { status: 409 });
    }

    if (sourceId !== targetId) {
      const { data: runs, error: runsError } = await supabase
        .from("dx3xb_runs")
        .update({ user_id: targetId })
        .eq("user_id", sourceId)
        .select("id");
      if (runsError) throw runsError;
      movedRuns = runs?.length ?? 0;

      const { data: apps, error: appsError } = await supabase
        .from("dx3xb_microapps")
        .update({ owner_id: targetId })
        .eq("owner_id", sourceId)
        .select("id");
      if (appsError) throw appsError;
      movedApps = apps?.length ?? 0;

      await supabase.from("dx3xb_profiles").delete().eq("user_id", sourceId);
    }

    const { error: profileError } = await supabase
      .from("dx3xb_profiles")
      .upsert({ user_id: targetId, handle: claim.handle }, { onConflict: "user_id" });
    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, movedRuns, movedApps, userId: targetId });
  } catch (error) {
    console.error("claim complete failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
