type GeminiUsage = { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
import { getServiceClient } from "@/lib/supabase";

function finite(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function logGeminiCall(input: {
  requestId: string;
  route: "generate" | "workshop";
  model: string;
  attempt: number;
  durationMs: number;
  status: number;
  outcome: string;
  usage?: GeminiUsage;
}) {
  const inputTokens = finite(input.usage?.promptTokenCount);
  const outputTokens = finite(input.usage?.candidatesTokenCount);
  const totalTokens = finite(input.usage?.totalTokenCount) || inputTokens + outputTokens;
  const inputRate = finite(process.env.GEMINI_INPUT_USD_PER_MILLION);
  const outputRate = finite(process.env.GEMINI_OUTPUT_USD_PER_MILLION);
  const estimatedCostUsd = inputRate || outputRate
    ? Number(((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000).toFixed(8))
    : null;
  console.info(JSON.stringify({
    event: "gemini_call",
    requestId: input.requestId,
    route: input.route,
    model: input.model,
    attempt: input.attempt,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    status: input.status,
    outcome: input.outcome,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd,
  }));
  void getServiceClient().rpc("dx3xb_record_ai_call", {
    p_request_id: input.requestId,
    p_route: input.route,
    p_model: input.model,
    p_attempt: input.attempt,
    p_duration_ms: Math.max(0, Math.round(input.durationMs)),
    p_http_status: input.status,
    p_outcome: input.outcome,
    p_input_tokens: inputTokens,
    p_output_tokens: outputTokens,
    p_total_tokens: totalTokens,
    p_estimated_cost_usd: estimatedCostUsd ?? 0,
  }).then(({ error }) => { if (error) console.error("ai cost log failed", { requestId: input.requestId, message: error.message }); });
}
