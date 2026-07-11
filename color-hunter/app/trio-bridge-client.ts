"use client";

const BRIDGE_ORIGIN = "https://dx3xb.com";
const BRIDGE_URL = `${BRIDGE_ORIGIN}/trio/bridge`;
const CHANNEL = "dx3xb-trio-v1";
const STORAGE_KEY = "dx3xb-auth";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: number };
const pending = new Map<string, Pending>();
let frame: HTMLIFrameElement | null = null;
let ready: Promise<void> | null = null;

function clearLegacyCookies() {
  const names = [STORAGE_KEY, ...Array.from({ length: 8 }, (_, i) => `${STORAGE_KEY}.${i}`)];
  for (const name of names) {
    document.cookie = `${name}=; path=/; max-age=0`;
    document.cookie = `${name}=; path=/; max-age=0; domain=.dx3xb.com; Secure; SameSite=Lax`;
  }
}

function bridgeReady() {
  if (ready) return ready;
  ready = new Promise<void>((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== BRIDGE_ORIGIN || event.source !== frame?.contentWindow || event.data?.channel !== CHANNEL) return;
      if (event.data.ready) {
        resolve();
        return;
      }
      const request = pending.get(event.data.id);
      if (!request) return;
      window.clearTimeout(request.timer);
      pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error));
      else {
        clearLegacyCookies();
        request.resolve(event.data.result);
      }
    };
    window.addEventListener("message", onMessage);
    frame = document.createElement("iframe");
    frame.src = BRIDGE_URL;
    frame.title = "";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.display = "none";
    frame.addEventListener("error", () => reject(new Error("bridge_unavailable")), { once: true });
    document.body.appendChild(frame);
  });
  return ready;
}

export async function trioBridgeCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  await bridgeReady();
  const id = crypto.randomUUID();
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error("bridge_timeout"));
    }, 10_000);
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer });
    frame?.contentWindow?.postMessage({ channel: CHANNEL, id, method, params }, BRIDGE_ORIGIN);
  });
}

