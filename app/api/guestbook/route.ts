import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function ipOf(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "";
}
function geoOf(req: NextRequest) {
  let city = req.headers.get("x-vercel-ip-city") || "";
  try {
    city = decodeURIComponent(city);
  } catch {
    /* ignore */
  }
  return {
    country: req.headers.get("x-vercel-ip-country") || "",
    region: req.headers.get("x-vercel-ip-country-region") || "",
    city,
  };
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_guestbook")
      .select("id, name, message, created_at, parent_id")
      .eq("hidden", false)
      .order("created_at", { ascending: true })
      .limit(300);

    if (error) throw error;
    return NextResponse.json({ ok: true, messages: data ?? [] });
  } catch (error) {
    console.error("guestbook read failed", error);
    return NextResponse.json({ ok: false, messages: [], error: "server_error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: { name?: string; message?: string; parent_id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const name = clean(body.name, 24);
  const message = clean(body.message, 280);
  const parent_id = Number.isInteger(body.parent_id) && Number(body.parent_id) > 0 ? Number(body.parent_id) : null;

  if (!message) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }
  // 链接刷屏拦截
  if ((message.match(/https?:\/\/|www\./gi) || []).length >= 3) {
    return NextResponse.json({ ok: false, error: "spam" }, { status: 400 });
  }

  try {
    const { country, region, city } = geoOf(request);
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_guestbook").insert({
      name,
      message,
      parent_id,
      ip: ipOf(request).slice(0, 64),
      country,
      region,
      city: clean(city, 64),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("rate_limited")) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    console.error("guestbook write failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
