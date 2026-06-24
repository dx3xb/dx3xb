import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 返回玩具墙目录（排除 hidden）。前端按 status 决定卡片是否可点。
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_toys")
      .select("slug, title_zh, title_en, desc_zh, desc_en, icon, type, url, status")
      .neq("status", "hidden")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ ok: true, toys: data ?? [] });
  } catch (error) {
    console.error("toys read failed", error);
    return NextResponse.json({ ok: false, toys: [] }, { status: 500 });
  }
}
