import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getPublicCreators } from "@/lib/public-creators";

export const runtime = "nodejs";

const visibleStatuses = ["unlisted", "pending", "public"];

function cleanSlug(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "").slice(0, 32);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = cleanSlug(rawSlug);
  if (!slug) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("dx3xb_microapps")
      .select("id,slug,title,template,config,status,plays,created_at,updated_at,owner_id")
      .eq("slug", slug)
      .in("status", visibleStatuses)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    const [creators, moreResult] = await Promise.all([
      getPublicCreators([data.owner_id]),
      supabase
        .from("dx3xb_microapps")
        .select("slug,title,template,plays,created_at")
        .eq("owner_id", data.owner_id)
        .eq("status", "public")
        .neq("slug", data.slug)
        .order("plays", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4),
    ]);
    if (moreResult.error) throw moreResult.error;
    const creator = creators.get(data.owner_id) ?? null;
    const moreByCreator = (moreResult.data ?? []).map((app) => ({
      slug: app.slug,
      title: app.title,
      template: app.template,
      plays: app.plays,
      createdAt: app.created_at,
      creator,
    }));
    const safeApp = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      template: data.template,
      config: data.config,
      status: data.status,
      plays: data.plays,
      updated_at: data.updated_at,
    };
    return NextResponse.json({ ok: true, app: { ...safeApp, creator, moreByCreator } });
  } catch (error) {
    console.error("microapp read failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
