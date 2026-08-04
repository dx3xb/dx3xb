import { NextRequest, NextResponse } from "next/server";
import { getPublicWall } from "@/lib/public-home";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const sort = req.nextUrl.searchParams.get("sort") === "popular" ? "popular" : "latest";
    const apps = await getPublicWall(sort);
    return NextResponse.json(
      { ok: true, sort, apps },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
    );
  } catch (e) {
    console.error("wall read", e);
    return NextResponse.json({ ok: false, apps: [] }, { status: 500 });
  }
}
