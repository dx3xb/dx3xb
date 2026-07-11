import { NextRequest, NextResponse } from "next/server";
import { adminRequestIsSameOrigin, authed, clearAdminSession, setAdminSession, validAdminPassword } from "@/lib/admin-auth";
import { readJson, tooManyRequests } from "@/lib/request-guards";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: authed(req) }, { status: authed(req) ? 200 : 401 });
}

export async function POST(req: NextRequest) {
  if (!adminRequestIsSameOrigin(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (tooManyRequests(req, "admin:login", 5, 15 * 60_000)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 429 });
  }
  const parsed = await readJson<{ password?: string }>(req, 1024);
  if (!parsed.ok) return parsed.response;
  if (!validAdminPassword(String(parsed.value.password || ""))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  setAdminSession(response);
  return response;
}

export async function DELETE(req: NextRequest) {
  if (!adminRequestIsSameOrigin(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  clearAdminSession(response);
  return response;
}
