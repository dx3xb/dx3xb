import { clean, type Lang } from "./types";

export type WorkshopMessage = { role: "user" | "ai"; text: string };
export type WorkshopConfig = {
  intro: string;
  html: string;
  css: string;
  js: string;
  turnsUsed: number;
  messages: WorkshopMessage[];
};

const SAMPLE_HTML = `<main class="game">
  <h1>Star Catch</h1>
  <p id="score">Score: 0</p>
  <button id="star">⭐</button>
  <p>Tap the star 10 times to win.</p>
</main>`;

const SAMPLE_CSS = `body { margin: 0; font-family: ui-monospace, monospace; background: #101827; color: white; }
.game { min-height: 100vh; display: grid; place-items: center; align-content: center; gap: 16px; }
button { font-size: 64px; border: 4px solid white; background: #12b7a6; padding: 18px 26px; cursor: pointer; }`;

const SAMPLE_JS = `let score = 0;
const star = document.getElementById("star");
const label = document.getElementById("score");
star.addEventListener("click", () => {
  score += 1;
  label.textContent = "Score: " + score;
  star.style.transform = "translate(" + (Math.random() * 80 - 40) + "px," + (Math.random() * 80 - 40) + "px)";
  if (score >= 10) {
    parent.postMessage({ type: "dx3xb-workshop-complete" }, "*");
    label.textContent = "You win!";
  }
});`;

export function wsEmpty(lang: Lang = "zh"): WorkshopConfig {
  return {
    intro: lang === "zh" ? "用 AI 生成或手动编辑一个安全沙盒里的 HTML 小游戏。" : "Generate or edit a sandboxed HTML mini game.",
    html: SAMPLE_HTML,
    css: SAMPLE_CSS,
    js: SAMPLE_JS,
    turnsUsed: 0,
    messages: [],
  };
}

function bounded(value: unknown, max: number) {
  return clean(value, max);
}

function stripDangerousHtml(html: string) {
  return html
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(html|head|body|script|iframe|object|embed|link|meta|base|form)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(src|href)\s*=\s*(['"])\s*(https?:|\/\/|javascript:).*?\2/gi, "");
}

function stripDangerousJs(js: string) {
  return js
    .replace(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker)\b/g, "/* blocked */")
    .replace(/\b(localStorage|sessionStorage|indexedDB|cookie)\b/g, "/* blocked */")
    .replace(/\b(top|opener|parent\.location|window\.location)\b/g, "/* blocked */");
}

export function wsValidate(input: unknown): WorkshopConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const messagesRaw = (Array.isArray(o.messages) ? o.messages.slice(-10) : []) as Record<string, unknown>[];
  return {
    intro: bounded(o.intro, 240) || "AI Game Workshop",
    html: stripDangerousHtml(bounded(o.html, 12000)) || SAMPLE_HTML,
    css: bounded(o.css, 9000) || SAMPLE_CSS,
    js: stripDangerousJs(bounded(o.js, 10000)) || SAMPLE_JS,
    turnsUsed: Math.max(0, Math.min(10, Math.round(Number(o.turnsUsed) || 0))),
    messages: messagesRaw.map((m): WorkshopMessage => ({
      role: m.role === "ai" ? "ai" : "user",
      text: bounded(m.text, 500),
    })).filter((m) => m.text.trim()),
  };
}

export function wsPublishable(c: WorkshopConfig): boolean {
  const cfg = wsValidate(c);
  return cfg.html.trim().length >= 20 && (cfg.css.trim().length >= 4 || cfg.js.trim().length >= 4);
}

export function buildWorkshopSrcDoc(config: WorkshopConfig) {
  const cfg = wsValidate(config);
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data:",
    "connect-src 'none'",
    "media-src data:",
    "object-src 'none'",
    "frame-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join("; ");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${cfg.css}</style></head><body>${cfg.html}<script>
window.fetch=undefined;window.XMLHttpRequest=undefined;window.WebSocket=undefined;window.EventSource=undefined;window.open=undefined;
try{${cfg.js}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="white-space:pre-wrap;color:#ff5f57;background:#fff;padding:8px;border:2px solid #ff5f57">JS error: '+String(e).replace(/[<>&]/g,'')+'</pre>')}
</script></body></html>`;
}
