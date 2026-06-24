import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !emailRe.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("dx3xb_subscribers").insert({ email });

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
