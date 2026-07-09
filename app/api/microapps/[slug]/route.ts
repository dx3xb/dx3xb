import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

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
      .select("id, slug, title, template, config, status, plays, updated_at")
      .eq("slug", slug)
      .in("status", visibleStatuses)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    return NextResponse.json({ ok: true, app: data });
  } catch (error) {
    console.error("microapp read failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
