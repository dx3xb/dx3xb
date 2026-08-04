import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { CLASSROOM_PACKS, isClassroomPack, safeClassCode } from "@/lib/ai-classrooms";
import { readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function bearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}
function cleanTitle(value: unknown) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 60);
}
function randomCode() {
  const bytes = randomBytes(6);
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

export async function GET(req: NextRequest) {
  const code = safeClassCode(req.nextUrl.searchParams.get("code"));
  if (!code) return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  try {
    const db = getServiceClient() as any;
    const { data, error } = await db.from("dx3xb_classrooms").select("code,title,pack,status,expires_at,created_at").eq("code", code).maybeSingle();
    if (error) throw error;
    if (!data || data.status !== "active" || new Date(data.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, classroom: { ...data, games: CLASSROOM_PACKS[data.pack as keyof typeof CLASSROOM_PACKS]?.games ?? [] } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("classroom read failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const parsed = await readJson<{ pack?: string; title?: string }>(req, 2048);
  if (!parsed.ok) return parsed.response;
  if (!isClassroomPack(parsed.value.pack)) return NextResponse.json({ ok: false, error: "invalid_pack" }, { status: 400 });
  const title = cleanTitle(parsed.value.title) || CLASSROOM_PACKS[parsed.value.pack].name.zh;
  try {
    const token = bearer(req);
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const db = getServiceClient() as any;
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user || auth.user.is_anonymous) return NextResponse.json({ ok: false, error: "registered_account_required" }, { status: 403 });

    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count, error: countError } = await db.from("dx3xb_classrooms").select("id", { count: "exact", head: true }).eq("owner_id", auth.user.id).gte("created_at", since);
    if (countError) throw countError;
    if ((count || 0) >= 8) return NextResponse.json({ ok: false, error: "daily_room_limit" }, { status: 429 });

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = randomCode();
      const { data, error } = await db.from("dx3xb_classrooms").insert({
        code,
        owner_id: auth.user.id,
        title,
        pack: parsed.value.pack,
        expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      }).select("code,title,pack,status,expires_at,created_at").single();
      if (!error && data) return NextResponse.json({ ok: true, classroom: { ...data, games: CLASSROOM_PACKS[parsed.value.pack].games } }, { status: 201 });
      if (!String(error?.message || "").toLowerCase().includes("duplicate")) throw error;
    }
    return NextResponse.json({ ok: false, error: "code_generation_failed" }, { status: 503 });
  } catch (error) {
    console.error("classroom create failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

