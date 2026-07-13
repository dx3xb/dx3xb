import "server-only";
import { logGeminiCall } from "@/lib/ai-observability";

type RouteName = "generate" | "workshop";
type Usage = { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };

export type GeminiResponse = { model: string; status: number; durationMs: number; text: string; usage?: Usage; finishReason?: string };

export async function requestGeminiJson(input: { route: RouteName; requestId: string; attempt: number; prompt: string; temperature: number; maxOutputTokens?: number; timeoutMs: number }): Promise<GeminiResponse | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(input.timeoutMs),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: { temperature: input.temperature, responseMimeType: "application/json", ...(input.maxOutputTokens ? { maxOutputTokens: input.maxOutputTokens } : {}) },
      }),
    });
  } catch (error) {
    logGeminiCall({ requestId: input.requestId, route: input.route, model, attempt: input.attempt, durationMs: Date.now() - startedAt, status: 0, outcome: error instanceof DOMException && error.name === "TimeoutError" ? "timeout" : "network_error" });
    return null;
  }
  const durationMs = Date.now() - startedAt;
  if (!response.ok) {
    logGeminiCall({ requestId: input.requestId, route: input.route, model, attempt: input.attempt, durationMs, status: response.status, outcome: "http_error" });
    return null;
  }
  const data = await response.json();
  const candidate = data?.candidates?.[0];
  return { model, status: response.status, durationMs, text: candidate?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "", usage: data?.usageMetadata, finishReason: candidate?.finishReason };
}

export function recordGeminiOutcome(input: { response: GeminiResponse; route: RouteName; requestId: string; attempt: number; outcome: string }) {
  logGeminiCall({ requestId: input.requestId, route: input.route, model: input.response.model, attempt: input.attempt, durationMs: input.response.durationMs, status: input.response.status, outcome: input.outcome, usage: input.response.usage });
}
