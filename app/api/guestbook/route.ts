import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { cleanText, clientIp, looksPromotional, readJson, tooManyRequests } from "@/lib/request-guards";

export const runtime = "nodejs";

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

function visitorKey(req: NextRequest) {
  const ip = clientIp(req);
  if (!ip) return "";
  const secret = process.env.GUESTBOOK_IP_SALT || process.env.SUPABASE_SERVICE_KEY;
  if (!secret) return ip;
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 40);
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
  if (tooManyRequests(request, "guestbook:write", 6, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const parsed = await readJson<{ name?: string; message?: string; parent_id?: number; website?: string }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;
  if (body.website) return NextResponse.json({ ok: true });

  const name = cleanText(body.name, 24);
  const message = cleanText(body.message, 280);
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
    const visitor = visitorKey(request);
    if (visitor) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const { count, error: limitError } = await supabase
        .from("dx3xb_guestbook")
        .select("id", { count: "exact", head: true })
        .eq("ip", visitor)
        .gte("created_at", since);
      if (limitError) throw limitError;
      if ((count ?? 0) >= 6) {
        return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
      }
    }
    if (parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from("dx3xb_guestbook")
        .select("id")
        .eq("id", parent_id)
        .is("parent_id", null)
        .eq("hidden", false)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return NextResponse.json({ ok: false, error: "bad_parent" }, { status: 400 });
    }
    const moderated = looksPromotional(message);
    const { error } = await supabase.from("dx3xb_guestbook").insert({
      name,
      message,
      parent_id,
      ip: visitor,
      country,
      region,
      city: cleanText(city, 64),
      hidden: moderated,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, moderated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("rate_limited")) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    console.error("guestbook write failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
