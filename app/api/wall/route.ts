import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_microapps")
      .select("slug, title, template, plays")
      .eq("status", "public")
      .order("plays", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw error;
    return NextResponse.json({ ok: true, apps: data ?? [] });
  } catch (e) {
    console.error("wall read", e);
    return NextResponse.json({ ok: false, apps: [] }, { status: 500 });
  }
}
