import { NextRequest, NextResponse } from "next/server";
import { authed } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get("days")) || 30));
  const { data, error } = await getServiceClient().rpc("dx3xb_ai_cost_summary", { p_days: days });
  if (error) return NextResponse.json({ ok: false, error: "read_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, summary: data });
}
