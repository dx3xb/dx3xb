import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";
import { wsValidate } from "@/app/_mt/workshop-spec";

export const runtime = "nodejs";

type Body = { prompt?: string; lang?: "zh" | "en"; title?: string };

function cleanId(value: string) {
  return value.replace(/[^a-f0-9-]/gi, "").slice(0, 40);
}

function parseJson(content: unknown) {
  if (typeof content !== "string") return null;
  const json = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(json) as { title?: string; intro?: string; html?: string; css?: string; js?: string; note?: string };
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
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const instruction = `You are dx3xb AI Game Workshop, a senior game & UI designer. Return only JSON: {"title":string,"intro":string,"html":string,"css":string,"js":string,"note":string}.
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
- Keep total JS comfortably under ~20000 characters and CSS under ~14000: prefer compact, reusable code over sprawling per-level hardcoding, so the game is never truncated. Every event handler and the game loop must be fully defined.
- Language for title/intro/note and all on-screen text: ${lang}.`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${instruction}\n\nCurrent title: ${title}\nCurrent intro: ${current.intro}\nCurrent html:\n${current.html.slice(0, 9000)}\n\nCurrent css:\n${current.css.slice(0, 8000)}\n\nCurrent js:\n${current.js.slice(0, 12000)}\n\nUser request: ${prompt}` }],
      }],
      generationConfig: { temperature: 0.7, responseMimeType: "application/json", maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
  return parseJson(text);
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
    if (!generated?.html || !generated?.css || !generated?.js) {
      return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 502 });
    }

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

    return NextResponse.json({ ok: true, title: nextTitle, config: nextConfig, turnsUsed: nextCount, source: `gemini:${process.env.GEMINI_MODEL || "gemini-3.5-flash"}` });
  } catch (error) {
    console.error("workshop generate failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
