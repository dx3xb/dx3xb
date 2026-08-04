"use client";

import { useEffect } from "react";
import { AI_QUEST_GAMES, dx3xb, ensureSession, getAiQuestProgress, getProfileHandle, getTrioProgress, recordRun, type RunPayload, type TrioGame } from "@/app/dx3xb-trio";

const ALLOWED_ORIGINS = new Set([
  "https://color-hunter.dx3xb.com",
  "https://dont-click-wrong.dx3xb.com",
  "https://instant-memory.dx3xb.com",
  "https://ai-detective.dx3xb.com",
]);

type BridgeRequest = {
  channel?: string;
  id?: string;
  method?: "session" | "recordRun" | "progress" | "profile" | "recordAiRun" | "aiProgress";
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
          await recordRun(AI_QUEST_GAMES[0], request.params?.run as RunPayload);
          result = { ok: true };
        } else if (request.method === "aiProgress") {
          result = await getAiQuestProgress();
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
