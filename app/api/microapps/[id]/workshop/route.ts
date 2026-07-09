import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";
import { WORKSHOP_CODE_LIMITS, workshopJsPolicyIssue, wsValidate } from "@/app/_mt/workshop-spec";

export const runtime = "nodejs";

type Body = { prompt?: string; lang?: "zh" | "en"; title?: string };
type WorkshopDraft = { title?: string; intro?: string; html?: string; css?: string; js?: string; note?: string; source?: string };

function cleanId(value: string) {
  return value.replace(/[^a-f0-9-]/gi, "").slice(0, 40);
}

function parseJson(content: unknown): WorkshopDraft | null {
  if (typeof content !== "string") return null;
  const stripped = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  const json = start >= 0 && end > start ? stripped.slice(start, end + 1) : stripped;
  try {
    return JSON.parse(json) as WorkshopDraft;
  } catch {
    return null;
  }
}

function validateGeneratedDraft(draft: WorkshopDraft): { draft: WorkshopDraft; reason: null } | { draft: null; reason: string } {
  const html = String(draft.html ?? "");
  const css = String(draft.css ?? "");
  const js = String(draft.js ?? "");
  if (!html.trim() || !css.trim() || !js.trim()) return { draft: null, reason: "missing_code" };
  if (html.length > WORKSHOP_CODE_LIMITS.html) return { draft: null, reason: "html_too_long" };
  if (css.length > WORKSHOP_CODE_LIMITS.css) return { draft: null, reason: "css_too_long" };
  if (js.length > WORKSHOP_CODE_LIMITS.js) return { draft: null, reason: "js_too_long" };
  const policyIssue = workshopJsPolicyIssue(js);
  if (policyIssue) return { draft: null, reason: policyIssue };

  const checked = wsValidate({ html, css, js });
  try {
    // Compile only; generated code is never executed in the API process.
    new Function(checked.js);
  } catch {
    return { draft: null, reason: "invalid_js" };
  }
  return { draft: { ...draft, html: checked.html, css: checked.css, js: checked.js }, reason: null };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
}

function numberFromPrompt(prompt: string, re: RegExp, fallback: number, min: number, max: number) {
  const n = Number(prompt.match(re)?.[1]);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function localPlayableWorkshop(prompt: string, lang: "zh" | "en", title: string): Required<WorkshopDraft> {
  const levelCount = numberFromPrompt(prompt, /(\d{1,2})\s*(?:个)?(?:关卡|关|levels?|stages?)/i, 5, 2, 8);
  const lives = numberFromPrompt(prompt, /(\d{1,2})\s*(?:条)?(?:命|lives?)/i, 3, 1, 5);
  const plainTitle = (title || (lang === "zh" ? "AI 闯关小游戏" : "AI Mini Game")).slice(0, 60);
  const safeTitle = escapeHtml(plainTitle);
  const isZh = lang === "zh";
  const levels = Array.from({ length: levelCount }, (_, i) => ({
    name: isZh ? `第 ${i + 1} 关` : `Level ${i + 1}`,
    target: Math.min(8 + i * 2, 20),
    speed: 850 - Math.min(i * 70, 420),
  }));
  return {
    title: plainTitle,
    intro: isZh ? `${levelCount} 个关卡、${lives} 条命的轻量闯关游戏。` : `${levelCount} levels, ${lives} lives, quick arcade challenge.`,
    html: `<main class="game"><section id="screen" class="panel"></section></main>`,
    css: `body{margin:0;background:#101827;color:#fff;font-family:ui-monospace,monospace}.game{min-height:100vh;display:grid;place-items:center;padding:18px;background:radial-gradient(circle at 20% 10%,#2dd4bf55,transparent 32%),radial-gradient(circle at 85% 20%,#fb718555,transparent 30%),linear-gradient(135deg,#0f172a,#111827 52%,#27113f)}.panel{width:min(720px,100%);min-height:min(620px,92vh);border:3px solid #fff;border-radius:26px;padding:22px;box-shadow:0 24px 80px #0008,inset 0 0 0 4px #ffffff18;background:#0b1025cc;display:grid;align-content:center;gap:16px;text-align:center}.title{font-size:clamp(28px,7vw,56px);margin:0;text-shadow:0 4px 0 #000}.hud{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.pill{border:2px solid #fff;border-radius:999px;padding:8px 13px;background:#ffffff18;font-weight:900}.arena{position:relative;height:clamp(240px,48vh,410px);border:2px solid #ffffff80;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#1e293b,#020617)}.orb{position:absolute;width:58px;height:58px;border:0;border-radius:50%;font-size:30px;background:#2dd4bf;box-shadow:0 0 28px #2dd4bf;transform:translate(-50%,-50%);touch-action:manipulation}.bad{background:#fb7185;box-shadow:0 0 28px #fb7185}.big{font:900 18px ui-monospace,monospace;border:3px solid #fff;border-radius:16px;background:#facc15;color:#111827;padding:14px 22px;box-shadow:6px 6px 0 #000;cursor:pointer}.big:active,.orb:active{transform:translate(-50%,-50%) scale(.92)}.big:active{transform:translate(4px,4px);box-shadow:none}.flash{animation:pop .22s ease}@keyframes pop{50%{filter:brightness(1.8);transform:scale(1.03)}}`,
    js: `const cfg=${JSON.stringify({ title: safeTitle, levels, lives, start: isZh ? "开始游戏" : "Start", again: isZh ? "再玩一次" : "Play again", win: isZh ? "通关成功！" : "You cleared it!", over: isZh ? "游戏结束" : "Game over", tap: isZh ? "点绿色星星，避开红色炸弹" : "Tap green stars, avoid red bombs" })};let level=0,score=0,lives=cfg.lives,timer=0,active=false;const s=document.getElementById('screen');function drawHome(msg){active=false;clearTimeout(timer);s.innerHTML='<h1 class="title">'+cfg.title+'</h1><p>'+cfg.tap+'</p>'+(msg?'<p class="pill">'+msg+'</p>':'')+'<div class="hud"><span class="pill">'+cfg.levels.length+' levels</span><span class="pill">'+cfg.lives+' lives</span></div><button id="start" class="big">'+cfg.start+'</button>';document.getElementById('start').onclick=()=>{level=0;score=0;lives=cfg.lives;play()}}function play(){active=true;clearTimeout(timer);const L=cfg.levels[level];s.innerHTML='<div class="hud"><span class="pill">'+L.name+'</span><span class="pill">Score '+score+'/'+L.target+'</span><span class="pill">Lives '+lives+'</span></div><div id="arena" class="arena"></div>';spawn()}function spawn(){if(!active)return;const a=document.getElementById('arena');if(!a)return;const bad=Math.random()<.28;const b=document.createElement('button');b.className='orb '+(bad?'bad':'');b.textContent=bad?'💥':'⭐';b.style.left=(12+Math.random()*76)+'%';b.style.top=(15+Math.random()*70)+'%';b.onclick=()=>{if(!active)return;if(bad){lives--;s.classList.add('flash');setTimeout(()=>s.classList.remove('flash'),220);if(lives<=0)return drawHome(cfg.over)}else{score++;if(score>=L.target){level++;score=0;if(level>=cfg.levels.length){parent.postMessage({type:'dx3xb-workshop-complete'},'*');return drawHome(cfg.win)}}}play()};a.appendChild(b);timer=setTimeout(()=>{if(active){if(!bad)lives--;if(lives<=0)return drawHome(cfg.over);play()}},L.speed)}drawHome('');`,
    note: isZh ? `已生成一个 ${levelCount} 关、${lives} 条命的可玩闯关游戏。绿色目标加分，红色陷阱会扣命。` : `Generated a playable ${levelCount}-level game with ${lives} lives. Green targets score, red traps cost lives.`,
    source: "local:fallback",
  };
}

async function generateWorkshop({
  prompt,
  lang,
  title,
  current,
}: {
  prompt: string;
  lang: "zh" | "en";
  title: string;
  current: ReturnType<typeof wsValidate>;
}) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return localPlayableWorkshop(prompt, lang, title);
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const buildInstruction = (compact = false) => `You are dx3xb AI Game Workshop, a senior game & UI designer. Return only JSON: {"title":string,"intro":string,"html":string,"css":string,"js":string,"note":string}.
Build ONE polished, self-contained browser mini game that runs inside a fixed-size sandbox iframe (a framed canvas box, landscape on desktop and portrait on mobile).

VISUAL QUALITY (this is what makes it feel premium — do not skip):
- Cohesive palette: pick a theme (neon-on-dark, warm pastel, retro arcade...) with a real background gradient, not flat gray. Strong contrast, readable text.
- Finish: rounded corners, soft shadows/glows, clear type hierarchy (big bold score, clean labels), generous spacing.
- Motion & feedback: animate every interaction — press/hover scale, score pops, hit flashes, small particle bursts or shakes on key events, smooth CSS transitions / requestAnimationFrame. No abrupt state jumps.
- Aim for something a player would screenshot.

LAYOUT (must fill the frame on BOTH mobile and desktop):
- Fill the container with 100%/100vh/100vw and flex/grid centering — NEVER hard-code pixel canvas sizes like 400x600. If you use <canvas>, size it to its container in JS (clientWidth/clientHeight) and handle resize.
- Title, score, controls and play area must be fully visible inside the frame with no scrolling or zooming, on a phone and a laptop.
- Large tap targets (~44px+). Support BOTH mouse and touch. Never require keyboard-only controls, hover-only interaction, focus tricks, text input, or hidden controls.

STRUCTURE:
- Clear game loop with states: a start/title screen with a big Start button, active play, and a game-over/win screen showing the result with a big Play-again button.
- If the game can be won or ended, call parent.postMessage({type:"dx3xb-workshop-complete"},"*").

CONSTRAINTS:
- Return fragments only, not a full HTML document. No <script> or <style> tags in html — all JS in js, all CSS in css.
- No external URLs, fonts, images, libraries, fetch, XHR, websocket, workers, storage, cookies, forms, iframes, object/embed, navigation, or top/opener access. Make art with CSS/emoji/canvas only.
- No alert/prompt/confirm, downloads, file inputs, or UI asking users to copy code.
- Compact, readable, robust code (guard against null elements; wrap risky logic in try).
- When editing an existing game, keep what works, apply the requested change, and keep the same theme unless the user asks to change it.
- The note field is user-facing: warmly describe the visible gameplay and look in plain language. No code, tags, file names, implementation details, or mention of removed/blocked mechanics.
- Keep total JS comfortably under ${compact ? "~9000" : "~18000"} characters and CSS under ${compact ? "~7000" : "~12000"}: prefer compact, reusable code over sprawling per-level hardcoding, so the game is never truncated. Every event handler and the game loop must be fully defined.
- If the user asks for many levels, implement them data-driven in arrays/loops instead of writing each level by hand.
- JSON must be complete and parseable. Do not stop mid-string or mid-function.
- Language for title/intro/note and all on-screen text: ${lang}.`;
  const callGemini = async (compact = false) => {
    const instruction = buildInstruction(compact);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${instruction}\n\nCurrent title: ${title}\nCurrent intro: ${current.intro}\nCurrent html:\n${current.html.slice(0, 9000)}\n\nCurrent css:\n${current.css.slice(0, 8000)}\n\nCurrent js:\n${current.js.slice(0, 12000)}\n\nUser request: ${prompt}` }],
      }],
      generationConfig: { temperature: compact ? 0.55 : 0.7, responseMimeType: "application/json", maxOutputTokens: compact ? 16384 : 24576 },
    }),
  });
    if (!res.ok) {
      console.warn("workshop gemini http failed", { status: res.status });
      return null;
    }
    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";
    const draft = parseJson(text);
    if (!draft) {
      console.warn("workshop gemini parse failed", { finishReason: candidate?.finishReason, textLength: text.length, compact });
      return null;
    }
    const checked = validateGeneratedDraft(draft);
    if (!checked.draft) {
      console.warn("workshop gemini draft rejected", { finishReason: candidate?.finishReason, textLength: text.length, compact, reason: checked.reason });
      return null;
    }
    return { ...checked.draft, source: `gemini:${model}` };
  };
  return (await callGemini(false)) ?? (await callGemini(true)) ?? localPlayableWorkshop(prompt, lang, title);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (tooManyRequests(req, "microapp:workshop", 20, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const parsed = await readJson<Body>(req, 2048);
  if (!parsed.ok) return parsed.response;
  const prompt = cleanText(parsed.value.prompt, 600);
  const lang = parsed.value.lang === "zh" ? "zh" : "en";
  const title = cleanText(parsed.value.title, 60);
  if (!prompt) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const { id: rawId } = await params;
  const id = cleanId(rawId);
  if (!id) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  try {
    const supabase = getServiceClient();
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    if (auth.user.is_anonymous || !auth.user.email) return NextResponse.json({ ok: false, error: "registered_required" }, { status: 403 });

    const { data: app, error: appError } = await supabase
      .from("dx3xb_microapps")
      .select("id,owner_id,title,template,config,status")
      .eq("id", id)
      .maybeSingle();
    if (appError) throw appError;
    if (!app || app.owner_id !== auth.user.id || app.template !== "workshop") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const { data: turnRow } = await (supabase as any).from("dx3xb_workshop_turns").select("count").eq("microapp_id", id).maybeSingle();
    const count = Math.max(Number(turnRow?.count) || 0, wsValidate(app.config).turnsUsed || 0);
    if (count >= 10) return NextResponse.json({ ok: false, error: "turn_limit" }, { status: 403 });

    const current = wsValidate({ ...(app.config as Record<string, unknown>), turnsUsed: count });
    const generated = await generateWorkshop({ prompt, lang, title: title || String(app.title || ""), current });
    if (!generated?.html || !generated?.css || !generated?.js) return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 502 });

    const nextCount = count + 1;
    const nextConfig = wsValidate({
      ...current,
      intro: generated.intro || current.intro,
      html: generated.html,
      css: generated.css,
      js: generated.js,
      turnsUsed: nextCount,
      messages: [
        ...current.messages,
        { role: "user", text: prompt },
        { role: "ai", text: cleanText(generated.note || (lang === "zh" ? "已更新 Canvas 游戏。" : "Canvas game updated."), 500) },
      ].slice(-10),
    });
    const nextTitle = cleanText(generated.title || title || String(app.title || ""), 60);

    const { error: turnError } = await (supabase as any)
      .from("dx3xb_workshop_turns")
      .upsert({ microapp_id: id, count: nextCount, updated_at: new Date().toISOString() });
    if (turnError) throw turnError;

    const { error: updateError } = await supabase
      .from("dx3xb_microapps")
      .update({
        title: nextTitle,
        config: nextConfig as any,
        status: app.status === "public" ? "pending" : app.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, title: nextTitle, config: nextConfig, turnsUsed: nextCount, source: generated.source || `gemini:${process.env.GEMINI_MODEL || "gemini-3.5-flash"}` });
  } catch (error) {
    console.error("workshop generate failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
