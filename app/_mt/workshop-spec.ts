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

export const WORKSHOP_CODE_LIMITS = {
  html: 18000,
  css: 16000,
  js: 24000,
} as const;

const WORKSHOP_HARD_LIMITS = {
  html: 72000,
  css: 64000,
  js: 96000,
} as const;

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

function cleanCode(value: unknown) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
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

export function workshopJsPolicyIssue(js: string): string | null {
  if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker|sendBeacon)\b/.test(js)) return "network_api";
  if (/\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\s*\.\s*cookie\b/.test(js)) return "storage_api";
  if (/\b(?:(?:window|document|parent|top|opener)\s*\.\s*)?location\b|\bhistory\s*\.|\bwindow\s*\.\s*opener\b|\bwindow\s*\.\s*open\b/.test(js)) return "navigation_api";
  if (/createElement\s*\(\s*["'](?:a|form|iframe|object|embed|script|link)["']\s*\)/i.test(js)) return "dynamic_element";
  if (/\b(?:eval|Function)\s*\(/.test(js)) return "dynamic_code";
  return null;
}

export function wsValidate(input: unknown): WorkshopConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const messagesRaw = (Array.isArray(o.messages) ? o.messages.slice(-10) : []) as Record<string, unknown>[];
  const rawHtml = cleanCode(o.html);
  const rawCss = cleanCode(o.css);
  const rawJs = cleanCode(o.js);
  const codeTooLarge =
    rawHtml.length > WORKSHOP_HARD_LIMITS.html ||
    rawCss.length > WORKSHOP_HARD_LIMITS.css ||
    rawJs.length > WORKSHOP_HARD_LIMITS.js;
  return {
    intro: bounded(o.intro, 240) || "AI Game Workshop",
    html: codeTooLarge ? SAMPLE_HTML : stripDangerousHtml(rawHtml) || SAMPLE_HTML,
    css: codeTooLarge ? SAMPLE_CSS : rawCss || SAMPLE_CSS,
    js: codeTooLarge ? SAMPLE_JS : rawJs || SAMPLE_JS,
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
  const safeCss = cfg.css.replace(/<\/style/gi, "<\\/style");
  const safeJs = cfg.js.replace(/<\/script/gi, "<\\/script");
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
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>${base}</style><style>${safeCss}</style></head><body>${cfg.html}<script>
(function(){
  function report(value){
    var message=String(value&&value.message?value.message:value||'Unknown game error').slice(0,240);
    try{parent.postMessage({type:'dx3xb-workshop-error',message:message},'*')}catch(_){}
    var box=document.getElementById('dx3xb-workshop-error');
    if(!box){box=document.createElement('div');box.id='dx3xb-workshop-error';box.setAttribute('role','alert');box.style.cssText='position:fixed;inset:auto 12px 12px;z-index:2147483647;padding:10px 12px;background:#fff;color:#b42318;border:2px solid #ff5f57;font:14px/1.35 ui-monospace,monospace;box-shadow:4px 4px 0 #ff5f57';document.body.appendChild(box)}
    box.textContent='Game failed to load.';
  }
  Object.defineProperty(window,'__dx3xbReportError',{value:report,writable:false,configurable:false});
  window.addEventListener('error',function(event){report(event.error||event.message)});
  window.addEventListener('unhandledrejection',function(event){report(event.reason)});
  ['fetch','XMLHttpRequest','WebSocket','EventSource','Worker','SharedWorker','open','alert','prompt','confirm'].forEach(function(key){try{Object.defineProperty(window,key,{value:undefined,writable:false,configurable:false})}catch(_){window[key]=undefined}});
  try{Object.defineProperty(navigator,'sendBeacon',{value:undefined,writable:false,configurable:false})}catch(_){}
  document.addEventListener('click',function(event){var node=event.target;while(node&&node.nodeType===1){if(node.tagName==='A'){event.preventDefault();return}node=node.parentElement}},true);
  document.addEventListener('submit',function(event){event.preventDefault()},true);
  var started=false;function reportStart(){if(started)return;started=true;try{parent.postMessage({type:'dx3xb-workshop-start'},'*')}catch(_){}}
  document.addEventListener('pointerdown',reportStart,{capture:true,once:true});
  document.addEventListener('keydown',reportStart,{capture:true,once:true});
})();
</script><script>
try{
${safeJs}
requestAnimationFrame(function(){requestAnimationFrame(function(){
  var root=document.documentElement,body=document.body;
  var overflowX=Math.max(root.scrollWidth,body.scrollWidth)-root.clientWidth;
  var overflowY=Math.max(root.scrollHeight,body.scrollHeight)-root.clientHeight;
  try{parent.postMessage({type:'dx3xb-workshop-ready',overflowX:overflowX,overflowY:overflowY},'*')}catch(_){}
})});
}catch(e){window.__dx3xbReportError(e)}
</script></body></html>`;
}

export type WorkshopCheck = { ok: boolean; viewport?: "desktop" | "mobile"; reason?: "runtime" | "overflow" | "timeout" };

export async function checkWorkshopPlayability(config: WorkshopConfig): Promise<WorkshopCheck> {
  if (typeof document === "undefined") return { ok: false, reason: "runtime" };
  const srcDoc = buildWorkshopSrcDoc(config);
  const viewports = [
    { name: "desktop" as const, width: 960, height: 640 },
    { name: "mobile" as const, width: 390, height: 640 },
  ];

  for (const viewport of viewports) {
    const result = await new Promise<WorkshopCheck>((resolve) => {
      const frame = document.createElement("iframe");
      frame.sandbox.add("allow-scripts");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${viewport.width}px;height:${viewport.height}px;border:0;visibility:hidden`;
      let settled = false;
      const finish = (value: WorkshopCheck) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        frame.remove();
        resolve(value);
      };
      const onMessage = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;
        const data = event.data as { type?: string; overflowX?: number; overflowY?: number };
        if (data?.type === "dx3xb-workshop-error") finish({ ok: false, viewport: viewport.name, reason: "runtime" });
        if (data?.type === "dx3xb-workshop-ready") {
          const overflowing = Number(data.overflowX || 0) > 2 || Number(data.overflowY || 0) > 2;
          finish(overflowing ? { ok: false, viewport: viewport.name, reason: "overflow" } : { ok: true });
        }
      };
      const timer = window.setTimeout(() => finish({ ok: false, viewport: viewport.name, reason: "timeout" }), 5000);
      window.addEventListener("message", onMessage);
      document.body.appendChild(frame);
      frame.srcdoc = srcDoc;
    });
    if (!result.ok) return result;
  }
  return { ok: true };
}
