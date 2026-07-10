import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "dx3xb-avatars";

function cleanHandle(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);
}

function fallback(req: NextRequest) {
  return NextResponse.redirect(new URL("/icon-192.png", req.url), 307);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params;
  const handle = cleanHandle(rawHandle);
  if (!handle) return fallback(req);

  try {
    const supabase = getServiceClient();
    const { data: profiles, error: profileError } = await supabase
      .from("dx3xb_profiles")
      .select("user_id")
      .ilike("handle", handle)
      .limit(1);
    if (profileError) throw profileError;
    const profile = profiles?.[0];
    if (!profile) return fallback(req);

    const { data, error } = await supabase.storage.from(BUCKET).download(`${profile.user_id}/avatar`);
    if (error || !data) return fallback(req);
    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("creator avatar read failed", error);
    return fallback(req);
  }
}
