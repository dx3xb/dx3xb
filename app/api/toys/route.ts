import { NextResponse } from "next/server";
import { getPublicToys } from "@/lib/public-home";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

// 返回玩具墙目录（排除 hidden）。前端按 status 决定卡片是否可点。
export async function GET() {
  try {
    const toys = await getPublicToys();
    return NextResponse.json(
      { ok: true, toys },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (error) {
    console.error("toys read failed", error);
    return NextResponse.json({ ok: false, toys: [] }, { status: 500 });
  }
}
