import { NextRequest, NextResponse } from "next/server";
import { requestFingerprint } from "@/lib/play-session";
import { cleanText, readJsonSchema, tooManyRequests } from "@/lib/request-guards";
import { reportBodySchema } from "@/lib/api-schemas";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function cleanId(value: string) {
  return value.replace(/[^a-f0-9-]/gi, "").slice(0, 40);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (tooManyRequests(req, "microapp:report", 5, 24 * 60 * 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const id = cleanId((await params).key);
  const parsed = await readJsonSchema(req, reportBodySchema, 1024);
  if (!parsed.ok) return parsed.response;
  const reason = cleanText(parsed.value.reason, 200) || "user-report";
  if (!id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  try {
    const supabase = getServiceClient();
    const { data: app } = await supabase.from("dx3xb_microapps").select("id").eq("id", id).maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const { error } = await supabase.from("dx3xb_microapp_reports").insert({
      microapp_id: id,
      reason,
      fingerprint_hash: requestFingerprint(req),
    });
    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("microapp report failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
