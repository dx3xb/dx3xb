import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_guestbook")
      .select("name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ ok: true, messages: data ?? [] });
  } catch (error) {
    console.error("guestbook read failed", error);
    return NextResponse.json({ ok: false, messages: [], error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: { name?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const name = clean(body.name, 24) || "匿名小可爱";
  const message = clean(body.message, 280);

  if (!message) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_guestbook").insert({ name, message });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("guestbook write failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
