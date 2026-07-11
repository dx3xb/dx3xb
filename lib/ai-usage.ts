import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type ReserveStatus = "reserved" | "busy" | "duplicate" | "daily_limit" | "app_limit" | "invalid";

export type AiReservation = {
  ok: boolean;
  status: ReserveStatus;
  requestId: string;
  dailyUsed: number;
  dailyRemaining: number;
  appUsed: number | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function aiRequestId(req: NextRequest) {
  const supplied = (req.headers.get("idempotency-key") || "").trim();
  return UUID_RE.test(supplied) ? supplied.toLowerCase() : randomUUID();
}

export function aiInputHash(...parts: string[]) {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

export async function reserveAiRequest({
  supabase,
  requestId,
  userId,
  scope,
  inputHash,
  dailyLimit,
  microappId,
  appLimit,
}: {
  supabase: SupabaseClient;
  requestId: string;
  userId: string;
  scope: "generate" | "workshop";
  inputHash: string;
  dailyLimit: number;
  microappId?: string;
  appLimit?: number;
}): Promise<AiReservation> {
  const { data, error } = await (supabase as any).rpc("dx3xb_reserve_ai_request", {
    p_request_id: requestId,
    p_user_id: userId,
    p_scope: scope,
    p_input_hash: inputHash,
    p_daily_limit: dailyLimit,
    p_microapp_id: microappId ?? null,
    p_app_limit: appLimit ?? null,
  });
  if (error) throw error;
  const result = (data ?? {}) as Record<string, unknown>;
  return {
    ok: result.ok === true,
    status: String(result.status || "invalid") as ReserveStatus,
    requestId,
    dailyUsed: Math.max(0, Number(result.dailyUsed) || 0),
    dailyRemaining: Math.max(0, Number(result.dailyRemaining) || 0),
    appUsed: result.appUsed == null ? null : Math.max(0, Number(result.appUsed) || 0),
  };
}

export async function finishAiRequest(supabase: SupabaseClient, requestId: string, userId: string, succeeded: boolean) {
  const { error } = await (supabase as any).rpc("dx3xb_finish_ai_request", {
    p_request_id: requestId,
    p_user_id: userId,
    p_status: succeeded ? "succeeded" : "failed",
  });
  if (error) console.error("ai request finalization failed", { requestId, message: error.message });
}

export function aiReservationResponse(reservation: AiReservation) {
  if (reservation.status === "busy") return { error: "generation_busy", status: 409 };
  if (reservation.status === "duplicate") return { error: "duplicate_request", status: 409 };
  if (reservation.status === "app_limit") return { error: "turn_limit", status: 403 };
  if (reservation.status === "daily_limit") return { error: "daily_limit", status: 429 };
  return { error: "generation_unavailable", status: 503 };
}
