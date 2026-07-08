import { NextRequest, NextResponse } from "next/server";
import { authed } from "@/lib/admin-auth";
import { cleanText, readJson } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

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
  const parsed = await readJson<{ id?: number; name?: string; message?: string; hidden?: boolean }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const id = body.id;
  if (typeof id !== "number" || !Number.isInteger(id)) return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = cleanText(body.name, 24);
  if (body.message !== undefined) patch.message = cleanText(body.message, 280);
  if (body.hidden !== undefined) patch.hidden = !!body.hidden;
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, error: "empty_patch" }, { status: 400 });
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_guestbook").update(patch as never).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin gb patch", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const parsed = await readJson<{ id?: number }>(req, 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  const id = body.id;
  if (typeof id !== "number" || !Number.isInteger(id)) return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
  try {
    const supabase = getServiceClient();
    // 删除该留言及其所有回复
    const { error: childError } = await supabase.from("dx3xb_guestbook").delete().eq("parent_id", id);
    if (childError) throw childError;
    const { error } = await supabase.from("dx3xb_guestbook").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin gb delete", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
