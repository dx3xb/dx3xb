import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authed(req: NextRequest) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = process.env.ADMIN_TOKEN || "";
  if (!admin || !token) return false;
  return timingSafeEqual(digest(token), digest(admin));
}
