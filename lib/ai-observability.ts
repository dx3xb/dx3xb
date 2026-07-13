type GeminiUsage = { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };

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
}
