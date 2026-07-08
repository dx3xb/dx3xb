import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLAIM_TTL_MS = 30 * 60_000;

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function cleanHandle(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

function sign(payload: string) {
  const secret = process.env.SUPABASE_SERVICE_KEY || process.env.ADMIN_TOKEN || "";
  if (!secret) throw new Error("Missing claim signing secret");
  return b64url(createHmac("sha256", secret).update(payload).digest());
}

function makeClaimToken(payload: { anonId: string; email: string; handle: string; exp: number }) {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function safeBearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function POST(req: NextRequest) {
  const parsed = await readJson<{ email?: string; handle?: string }>(req, 2048);
  if (!parsed.ok) return parsed.response;

  const email = String(parsed.value.email ?? "").trim().toLowerCase();
  const handle = cleanHandle(parsed.value.handle);
  if (!email || email.length > 254 || !emailRe.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }
  if (!handle) {
    return NextResponse.json({ ok: false, error: "missing_handle" }, { status: 400 });
  }

  try {
    const token = safeBearer(req);
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const { data: existingHandle, error: handleError } = await supabase
      .from("dx3xb_profiles")
      .select("user_id")
      .ilike("handle", handle)
      .neq("user_id", data.user.id)
      .maybeSingle();
    if (handleError) throw handleError;
    if (existingHandle) {
      return NextResponse.json({ ok: false, error: "handle_taken" }, { status: 409 });
    }

    const claim = makeClaimToken({
      anonId: data.user.id,
      email,
      handle,
      exp: Date.now() + CLAIM_TTL_MS,
    });
    const redirectTo = `${req.nextUrl.origin}/me?claim=${encodeURIComponent(claim)}`;
    return NextResponse.json({ ok: true, redirectTo });
  } catch (error) {
    console.error("claim prepare failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
