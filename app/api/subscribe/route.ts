import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { readJson, tooManyRequests } from "@/lib/request-guards";

export const runtime = "nodejs";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (tooManyRequests(request, "subscribe:write", 4, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const parsed = await readJson<{ email?: string }>(request, 1024);
  if (!parsed.ok) return parsed.response;
  const body = parsed.value;

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !emailRe.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_subscribers").insert({ email } as never);

    if (error) {
      // 唯一索引冲突 = 已订阅，当作成功的友好提示
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("subscribe failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
