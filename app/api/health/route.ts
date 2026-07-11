import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const check = getServiceClient().from("dx3xb_toys").select("id", { head: true, count: "exact" }).limit(1);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("health_timeout")), 3000));
    const { error } = await Promise.race([check, timeout]);
    if (error) throw error;
    return NextResponse.json(
      { ok: true, service: "dx3xb", database: "reachable", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, service: "dx3xb", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
