import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "dx3xb_admin_session";
const SESSION_SECONDS = 4 * 60 * 60;

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secret() {
  return process.env.ADMIN_TOKEN || "";
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(`dx3xb-admin-v1:${payload}`).digest("base64url");
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.nextUrl.host && new URL(origin).protocol === req.nextUrl.protocol;
  } catch {
    return false;
  }
}

export function validAdminPassword(password: string) {
  const admin = secret();
  return !!admin && !!password && equal(password, admin);
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function setAdminSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export function clearAdminSession(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
}

export function authed(req: NextRequest) {
  if (!secret() || (req.method !== "GET" && !sameOrigin(req))) return false;
  const token = req.cookies.get(COOKIE_NAME)?.value || "";
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  if (!equal(token.slice(dot + 1), signature(payload))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return Number(parsed.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function adminRequestIsSameOrigin(req: NextRequest) {
  return sameOrigin(req);
}
