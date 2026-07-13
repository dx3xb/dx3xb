import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export type PlaySessionPayload = { sid: string; app: string; exp: number };

function secret() {
  return process.env.PLAY_SESSION_SECRET || process.env.EVENT_HASH_SECRET || process.env.SUPABASE_SERVICE_KEY || "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(`dx3xb-play-v1:${payload}`).digest("base64url");
}

function equal(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function issuePlayToken(sessionId: string, appId: string, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ sid: sessionId, app: appId, exp: expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyPlayToken(token: unknown): PlaySessionPayload | null {
  if (!secret() || typeof token !== "string" || token.length > 512) return null;
  const dot = token.indexOf(".");
  if (dot < 1 || !equal(token.slice(dot + 1), sign(token.slice(0, dot)))) return null;
  try {
    const value = JSON.parse(Buffer.from(token.slice(0, dot), "base64url").toString("utf8")) as PlaySessionPayload;
    if (!/^[0-9a-f-]{36}$/i.test(value.sid) || !/^[0-9a-f-]{36}$/i.test(value.app) || value.exp <= Date.now()) return null;
    return value;
  } catch {
    return null;
  }
}

export function requestFingerprint(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  const ua = req.headers.get("user-agent") || "";
  return createHash("sha256").update(`${secret()}:${ip}:${ua}`.slice(0, 512)).digest("hex");
}
