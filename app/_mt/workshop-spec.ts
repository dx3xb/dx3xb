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

function codeBounded(value: unknown, max: number) {
  const s = String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  if (s.length <= max) return s;
  // 超限时截到最后一个语句边界（}/;/换行），绝不截在半句——否则括号不平衡会让整段 script 语法错误、事件全部失效。
  const cut = s.slice(0, max);
  const boundary = Math.max(cut.lastIndexOf("}"), cut.lastIndexOf(";"), cut.lastIndexOf("\n"));
  return boundary > max * 0.6 ? cut.slice(0, boundary + 1) : cut;
}

function extractBodyFragment(html: string) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  return body ?? html;
}

function stripDangerousHtml(html: string) {
  return extractBodyFragment(html)
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<\/?(html|head|body|script|style|iframe|object|embed|link|meta|base|form|input|textarea|select|option)[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(src|href|xlink:href|formaction)\s*=\s*(?:"(?:https?:|\/\/|javascript:|data:text\/html)[^"]*"|'(?:https?:|\/\/|javascript:|data:text\/html)[^']*'|(?:https?:|\/\/|javascript:|data:text\/html)[^\s>]*)/gi, "")
    .trim();
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
    html: stripDangerousHtml(codeBounded(o.html, 18000)) || SAMPLE_HTML,
    css: codeBounded(o.css, 16000) || SAMPLE_CSS,
    js: stripDangerousJs(codeBounded(o.js, 24000)) || SAMPLE_JS,
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
  // 注入基线：游戏充满整个画框（height:100%），无双滚动条，深色兜底底，触控友好。
  // 游戏自己的 CSS 在这之后加载，可完全覆盖这些默认值。
  const base = `html,body{height:100%;margin:0;padding:0;overflow:hidden;background:#0d1220;color:#f4f6ff;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}*,*::before,*::after{box-sizing:border-box;}img{max-width:100%;}button,[role=button]{touch-action:manipulation;cursor:pointer;}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${base}</style><style>${cfg.css}</style></head><body>${cfg.html}<script>
window.fetch=undefined;window.XMLHttpRequest=undefined;window.WebSocket=undefined;window.EventSource=undefined;window.open=undefined;window.alert=undefined;window.prompt=undefined;window.confirm=undefined;
try{${cfg.js}}catch(e){document.body.insertAdjacentHTML('beforeend','<pre style="white-space:pre-wrap;color:#ff5f57;background:#fff;padding:8px;border:2px solid #ff5f57">JS error: '+String(e).replace(/[<>&]/g,'')+'</pre>')}
</script></body></html>`;
}
