import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function cleanHandle(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

function safeBearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

export async function POST(req: NextRequest) {
  const parsed = await readJson<{ handle?: string }>(req, 1024);
  if (!parsed.ok) return parsed.response;

  const handle = cleanHandle(parsed.value.handle);
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

    const { error: profileError } = await supabase
      .from("dx3xb_profiles")
      .upsert({ user_id: data.user.id, handle }, { onConflict: "user_id" });
    if (profileError) throw profileError;

    return NextResponse.json({ ok: true, handle });
  } catch (error) {
    console.error("profile handle update failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
