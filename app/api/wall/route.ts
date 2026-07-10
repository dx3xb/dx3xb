import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getPublicCreators } from "@/lib/public-creators";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const sort = req.nextUrl.searchParams.get("sort") === "popular" ? "popular" : "latest";
    const supabase = getServiceClient();
    const baseQuery = supabase
      .from("dx3xb_microapps")
      .select("slug,title,template,plays,created_at,owner_id")
      .eq("status", "public");
    const query = sort === "popular"
      ? baseQuery.order("plays", { ascending: false }).order("created_at", { ascending: false })
      : baseQuery.order("created_at", { ascending: false }).order("plays", { ascending: false });
    const { data, error } = await query.limit(24);
    if (error) throw error;
    const creators = await getPublicCreators((data ?? []).map((app) => app.owner_id));
    const apps = (data ?? []).map((app) => ({
      slug: app.slug,
      title: app.title,
      template: app.template,
      plays: app.plays,
      createdAt: app.created_at,
      creator: creators.get(app.owner_id) ?? null,
    }));
    return NextResponse.json({ ok: true, sort, apps });
  } catch (e) {
    console.error("wall read", e);
    return NextResponse.json({ ok: false, apps: [] }, { status: 500 });
  }
}
