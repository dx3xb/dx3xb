import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function authed(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = process.env.ADMIN_TOKEN || "";
  return admin.length > 0 && token === admin;
}
function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_guestbook")
      .select("id, name, message, created_at, parent_id, ip, country, region, city, hidden")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return NextResponse.json({ ok: true, messages: data ?? [] });
  } catch (e) {
    console.error("admin gb read", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { id?: number; name?: string; message?: string; hidden?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!Number.isInteger(body.id)) return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = clean(body.name, 24);
  if (body.message !== undefined) patch.message = clean(body.message, 280);
  if (body.hidden !== undefined) patch.hidden = !!body.hidden;
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_guestbook").update(patch).eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin gb patch", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let body: { id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!Number.isInteger(body.id)) return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  try {
    const supabase = getServiceClient();
    // 删除该留言及其所有回复
    await supabase.from("dx3xb_guestbook").delete().eq("parent_id", body.id);
    const { error } = await supabase.from("dx3xb_guestbook").delete().eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin gb delete", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
