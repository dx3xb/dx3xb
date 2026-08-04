"use client";

import { useEffect } from "react";
import { dx3xb, ensureSession, getAiGameStats, getAiQuestProgress, getProfileHandle, getTrioProgress, recordRun, type AiQuestGame, type RunPayload, type TrioGame } from "@/app/dx3xb-trio";

const ALLOWED_ORIGINS = new Set([
  "https://color-hunter.dx3xb.com",
  "https://dont-click-wrong.dx3xb.com",
  "https://instant-memory.dx3xb.com",
  "https://ai-detective.dx3xb.com",
  "https://data-monster.dx3xb.com",
  "https://prompt-commander.dx3xb.com",
  "https://recommendation-tamer.dx3xb.com",
  "https://ai-court.dx3xb.com",
]);

const AI_GAME_BY_ORIGIN: Record<string, AiQuestGame> = {
  "https://ai-detective.dx3xb.com": "ai-truth-detective",
  "https://data-monster.dx3xb.com": "data-monster",
  "https://prompt-commander.dx3xb.com": "prompt-commander",
  "https://recommendation-tamer.dx3xb.com": "recommendation-tamer",
  "https://ai-court.dx3xb.com": "ai-court",
};

type BridgeRequest = {
  channel?: string;
  id?: string;
  method?: "session" | "recordRun" | "progress" | "profile" | "recordAiRun" | "aiProgress" | "aiGameStats";
  params?: Record<string, unknown>;
};

export default function TrioBridge() {
  useEffect(() => {
    const onMessage = async (event: MessageEvent<BridgeRequest>) => {
      if (!ALLOWED_ORIGINS.has(event.origin) || event.source !== window.parent) return;
      const request = event.data;
      if (request?.channel !== "dx3xb-trio-v1" || typeof request.id !== "string") return;
      let result: unknown;
      let error: string | undefined;
      try {
        if (request.method === "session") {
          result = { userId: await ensureSession() };
        } else if (request.method === "recordRun") {
          await recordRun(request.params?.game as TrioGame, request.params?.run as RunPayload);
          result = { ok: true };
        } else if (request.method === "progress") {
          result = await getTrioProgress();
        } else if (request.method === "profile") {
          await ensureSession();
          const [{ data }, handle] = await Promise.all([dx3xb().auth.getUser(), getProfileHandle()]);
          result = { handle, email: data.user?.email ?? null, isAnonymous: data.user?.is_anonymous !== false };
        } else if (request.method === "recordAiRun") {
          const game = AI_GAME_BY_ORIGIN[event.origin];
          if (!game) throw new Error("unsupported_ai_origin");
          await recordRun(game, request.params?.run as RunPayload);
          result = { ok: true };
        } else if (request.method === "aiProgress") {
          result = await getAiQuestProgress();
        } else if (request.method === "aiGameStats") {
          const game = AI_GAME_BY_ORIGIN[event.origin];
          if (!game) throw new Error("unsupported_ai_origin");
          result = await getAiGameStats(game);
        } else {
          error = "unsupported_method";
        }
      } catch {
        error = "bridge_failed";
      }
      event.source?.postMessage({ channel: "dx3xb-trio-v1", id: request.id, result, error }, { targetOrigin: event.origin });
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ channel: "dx3xb-trio-v1", ready: true }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
