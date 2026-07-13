import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";

type JsonResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse };

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
let hitsSinceSweep = 0;

export function cleanText(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

export function clientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim().slice(0, 64) || "";
  return (req.headers.get("x-real-ip") || "").slice(0, 64);
}

export function tooManyRequests(req: NextRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientIp(req) || "unknown"}`;
  const bucket = buckets.get(key);

  hitsSinceSweep += 1;
  if (hitsSinceSweep > 200) {
    hitsSinceSweep = 0;
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
  }

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

export async function readJson<T>(req: NextRequest, maxBytes = 4096): Promise<JsonResult<T>> {
  const len = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(len) && len > maxBytes) {
    return { ok: false, response: NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 }) };
  }

  try {
    return { ok: true, value: (await req.json()) as T };
  } catch {
    return { ok: false, response: NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }) };
  }
}

export async function readJsonSchema<T>(req: NextRequest, schema: ZodType<T>, maxBytes = 4096): Promise<JsonResult<T>> {
  const parsed = await readJson<unknown>(req, maxBytes);
  if (!parsed.ok) return parsed;
  const result = schema.safeParse(parsed.value);
  if (!result.success) {
    return { ok: false, response: NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }) };
  }
  return { ok: true, value: result.data };
}
