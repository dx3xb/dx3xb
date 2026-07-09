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
  const instruction = `You are dx3xb AI Game Workshop. Return only JSON: {"title":string,"intro":string,"html":string,"css":string,"js":string,"note":string}.
Build a self-contained browser mini game for a sandbox iframe.
Rules:
- Return fragments only, not a full HTML document.
- No script tags in html. Put all JavaScript in js.
- No external URLs, fetch, XHR, websocket, workers, storage, cookies, forms, iframes, object/embed, page navigation, top/opener access, or ads.
- Keep code compact and readable. No libraries.
- Use mobile-friendly controls.
- The note field is user-facing: describe the visual/gameplay change in plain language only. Do not include code, tags, snippets, file names, or implementation details.
- If the game can be completed, call parent.postMessage({type:"dx3xb-workshop-complete"},"*").
- Language: ${lang}.`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${instruction}\n\nCurrent title: ${title}\nCurrent intro: ${current.intro}\nCurrent html:\n${current.html.slice(0, 5000)}\n\nCurrent css:\n${current.css.slice(0, 3500)}\n\nCurrent js:\n${current.js.slice(0, 3500)}\n\nUser request: ${prompt}` }],
      }],
      generationConfig: { temperature: 0.75, responseMimeType: "application/json" },
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
