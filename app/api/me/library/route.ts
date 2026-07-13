import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const supabase = getServiceClient();
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user || auth.user.is_anonymous) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const db = supabase as any;
    const [favorites, recent, notifications] = await Promise.all([
      db.from("dx3xb_microapp_favorites").select("created_at,dx3xb_microapps(slug,title,template,status)").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20),
      db.from("dx3xb_recent_plays").select("played_at,dx3xb_microapps(slug,title,template,status)").eq("user_id", auth.user.id).order("played_at", { ascending: false }).limit(20),
      db.from("dx3xb_creator_notifications").select("id,kind,read_at,created_at,dx3xb_microapps(slug,title,status)").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    const error = favorites.error || recent.error || notifications.error;
    if (error) throw error;
    const visible = (rows: any[]) => (rows || []).filter((row) => row.dx3xb_microapps && row.dx3xb_microapps.status !== "hidden");
    return NextResponse.json({ ok: true, favorites: visible(favorites.data), recent: visible(recent.data), notifications: visible(notifications.data) });
  } catch (error) {
    console.error("library read failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
