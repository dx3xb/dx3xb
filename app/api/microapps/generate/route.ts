import { NextRequest, NextResponse } from "next/server";
import { cleanText, readJson, tooManyRequests } from "@/lib/request-guards";
import { getServiceClient } from "@/lib/supabase";
import { aiInputHash, aiRequestId, aiReservationResponse, finishAiRequest, reserveAiRequest } from "@/lib/ai-usage";
import { logGeminiCall } from "@/lib/ai-observability";

export const runtime = "nodejs";

type Body = { template?: string; prompt?: string; lang?: "zh" | "en" };
type Draft = { title: string; config: unknown; meta?: unknown; source?: string };

const TEMPLATES = new Set(["quiz", "knowme", "thisorthat", "higherlower", "madlibs", "escape"]);
const MODEL_TIMEOUT_MS = 28_000;

function titleFrom(prompt: string, lang: "zh" | "en") {
  const p = prompt.replace(/[。.!?？].*$/u, "").trim();
  if (p.length <= 24) return p || (lang === "zh" ? "我的小游戏" : "My Micro Toy");
  return p.slice(0, 24);
}

function localDraft(template: string, prompt: string, lang: "zh" | "en"): Draft {
  const title = titleFrom(prompt, lang);
  const topic = prompt || title;
  if (template === "knowme") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `测测你有多懂：${topic}` : `How well do you know: ${topic}?`,
        questions: [
          { q: lang === "zh" ? `我最喜欢${topic}里的哪一点？` : `What do I like most about ${topic}?`, options: ["A", "B", "C"], correct: 0 },
          { q: lang === "zh" ? `我会把${topic}推荐给谁？` : `Who would I recommend ${topic} to?`, options: ["朋友", "家人", "同学"], correct: 1 },
          { q: lang === "zh" ? `如果只能选一个关键词？` : `If I had to pick one keyword?`, options: ["好玩", "刺激", "温暖"], correct: 0 },
        ],
        results: [
          { min: 80, label: lang === "zh" ? "真懂我" : "You get me", desc: lang === "zh" ? "你很懂作者的脑回路。" : "You really get the creator." },
          { min: 0, label: lang === "zh" ? "再聊聊" : "Keep talking", desc: lang === "zh" ? "还有很多细节值得补课。" : "There is more to discover." },
        ],
      },
    };
  }
  if (template === "thisorthat") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `围绕「${topic}」做选择` : `Pick your side: ${topic}`,
        pairs: [
          { a: lang === "zh" ? "冒险" : "Adventure", b: lang === "zh" ? "稳妥" : "Safe", mine: 0 },
          { a: lang === "zh" ? "搞笑" : "Funny", b: lang === "zh" ? "酷" : "Cool", mine: 0 },
          { a: lang === "zh" ? "速度" : "Speed", b: lang === "zh" ? "细节" : "Details", mine: 1 },
        ],
      },
    };
  }
  if (template === "higherlower") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `猜猜「${topic}」里的大小高低` : `Guess higher or lower: ${topic}`,
        unit: "",
        items: [
          { label: lang === "zh" ? "入门级" : "Starter", value: 10 },
          { label: lang === "zh" ? "进阶级" : "Advanced", value: 30 },
          { label: lang === "zh" ? "专家级" : "Expert", value: 70 },
          { label: lang === "zh" ? "隐藏王者" : "Hidden boss", value: 100 },
        ],
      },
    };
  }
  if (template === "madlibs") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `把「${topic}」改成离谱故事` : `Turn ${topic} into a ridiculous story`,
        story:
          lang === "zh"
            ? `今天我在{地点}遇到了一个和「${topic}」有关的{人物}，他拿着{物品}大喊「{一句话}」，于是我决定{动作}。`
            : `Today at the {place}, a {person} related to "${topic}" held a {thing} and yelled "{quote}", so I decided to {action}.`,
      },
    };
  }
  if (template === "escape") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `逃出「${topic}」谜题房` : `Escape the ${topic} room`,
        riddles: [
          { q: lang === "zh" ? `和「${topic}」最相关的关键词是什么？` : `What keyword fits ${topic} best?`, answer: topic.slice(0, 12) || "answer", hint: lang === "zh" ? "看标题" : "Look at the title" },
          { q: lang === "zh" ? "越分享越多的东西是什么？" : "What grows when you share it?", answer: lang === "zh" ? "快乐|乐趣" : "fun|joy", hint: lang === "zh" ? "不是钱" : "Not money" },
        ],
      },
    };
  }
  if (template === "workshop") {
    return {
      title,
      config: {
        intro: lang === "zh" ? `一个关于「${topic}」的 Canvas 小游戏。` : `A Canvas mini game about ${topic}.`,
        html: `<main class="game"><h1>${title}</h1><p id="score">Score: 0</p><button id="target">⭐</button><p>${lang === "zh" ? "点到 10 分获胜" : "Reach 10 points to win"}</p></main>`,
        css: "body{margin:0;background:#101827;color:white;font-family:ui-monospace,monospace}.game{min-height:100vh;display:grid;place-items:center;align-content:center;gap:16px;text-align:center}button{font-size:64px;border:4px solid white;background:#12b7a6;padding:18px 26px;cursor:pointer}",
        js: "let score=0;const btn=document.getElementById('target');const label=document.getElementById('score');btn.addEventListener('click',()=>{score++;label.textContent='Score: '+score;btn.style.transform=`translate(${Math.random()*100-50}px,${Math.random()*80-40}px)`;if(score>=10){label.textContent='You win!';parent.postMessage({type:'dx3xb-workshop-complete'},'*')}});",
        turnsUsed: 0,
        messages: [],
      },
      meta: { coverEmoji: "🕹️", accent: "#4564ff" },
      source: "local",
    };
  }
  return {
    title,
    config: {
      intro: lang === "zh" ? `5 题测出你和「${topic}」的关系` : `5 questions about ${topic}`,
      results: [
        { key: "a", emoji: "✨", title: lang === "zh" ? "天选玩家" : "Chosen Player", desc: lang === "zh" ? "你就是这个主题的主角。" : "You are the main character here." },
        { key: "b", emoji: "🧩", title: lang === "zh" ? "隐藏高手" : "Hidden Pro", desc: lang === "zh" ? "你有自己的独特玩法。" : "You have your own way to play." },
      ],
      questions: [
        { q: lang === "zh" ? `看到「${topic}」你第一反应是？` : `Your first reaction to ${topic}?`, options: [{ label: lang === "zh" ? "冲" : "Go", scores: { a: 2 } }, { label: lang === "zh" ? "先观察" : "Observe", scores: { b: 2 } }] },
        { q: lang === "zh" ? "你更喜欢哪种体验？" : "Which experience do you prefer?", options: [{ label: lang === "zh" ? "刺激" : "Exciting", scores: { a: 2 } }, { label: lang === "zh" ? "有策略" : "Strategic", scores: { b: 2 } }] },
      ],
    },
  };
}

function parseJsonDraft(content: unknown) {
  if (typeof content !== "string") return null;
  const json = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(json) as { title?: string; config?: unknown; meta?: unknown };
}

async function geminiDraft(template: string, prompt: string, lang: "zh" | "en", requestId: string) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const instruction = `Return only JSON: {"title":string,"config":object,"meta":{"coverEmoji":string,"accent":"#RRGGBB"}}.
Template: ${template}. Language: ${lang}. Make safe, playful content for a no-code micro-game. Keep arrays valid and small.
For quiz config use {intro, results:[{key,emoji,title,desc}], questions:[{q,options:[{label,scores}]}]}.
For knowme use {intro, questions:[{q,options,correct}], results:[{min,label,desc}]}.
For thisorthat use {intro,pairs:[{a,b,mine}]}.
For higherlower use {intro,unit,items:[{label,value}]}.
For madlibs use {intro,story} with blanks like {地点}.
For escape use {intro,riddles:[{q,answer,hint}]}.`;
  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${instruction}\n\nUser prompt: ${prompt}` }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
    });
  } catch (error) {
    logGeminiCall({ requestId, route: "generate", model, attempt: 1, durationMs: Date.now() - startedAt, status: 0, outcome: error instanceof DOMException && error.name === "TimeoutError" ? "timeout" : "network_error" });
    throw error;
  }
  if (!res.ok) {
    logGeminiCall({ requestId, route: "generate", model, attempt: 1, durationMs: Date.now() - startedAt, status: res.status, outcome: "http_error" });
    return null;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("");
  const draft = parseJsonDraft(text);
  logGeminiCall({ requestId, route: "generate", model, attempt: 1, durationMs: Date.now() - startedAt, status: res.status, outcome: draft ? "success" : "invalid_output", usage: data?.usageMetadata });
  return draft ? { ...draft, source: `gemini:${model}` } : null;
}

async function openaiDraft(template: string, prompt: string, lang: "zh" | "en") {
  if (!process.env.OPENAI_API_KEY) return null;
  const instruction = `Return only JSON: {"title":string,"config":object,"meta":{"coverEmoji":string,"accent":"#RRGGBB"}}.
Template: ${template}. Language: ${lang}. Make safe, playful content for a no-code micro-game. Keep all arrays small and valid.`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  const draft = parseJsonDraft(content);
  return draft ? { ...draft, source: `openai:${process.env.OPENAI_MODEL || "gpt-4o-mini"}` } : null;
}

async function modelDraft(template: string, prompt: string, lang: "zh" | "en", requestId: string) {
  return (await geminiDraft(template, prompt, lang, requestId)) ?? (await openaiDraft(template, prompt, lang));
}

export async function POST(req: NextRequest) {
  if (tooManyRequests(req, "microapp:generate", 12, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const parsed = await readJson<Body>(req, 2048);
  if (!parsed.ok) return parsed.response;
  const template = cleanText(parsed.value.template, 24);
  const prompt = cleanText(parsed.value.prompt, 240);
  const lang = parsed.value.lang === "zh" ? "zh" : "en";
  if (!TEMPLATES.has(template) || !prompt) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const requestId = aiRequestId(req);
    const reservation = await reserveAiRequest({
      supabase,
      requestId,
      userId: data.user.id,
      scope: "generate",
      inputHash: aiInputHash(template, prompt, lang),
      dailyLimit: data.user.is_anonymous ? 5 : 20,
    });
    if (!reservation.ok) {
      const blocked = aiReservationResponse(reservation);
      return NextResponse.json({ ok: false, error: blocked.error }, { status: blocked.status });
    }
    let succeeded = false;
    try {
      const draft = (await modelDraft(template, prompt, lang, requestId).catch(() => null)) ?? localDraft(template, prompt, lang);
      const fallback = localDraft(template, prompt, lang);
      succeeded = true;
      return NextResponse.json({
        ok: true,
        title: cleanText(draft.title || fallback.title, 60),
        config: draft.config || fallback.config,
        meta: draft.meta || { coverEmoji: "🎮", accent: "#12b7a6" },
        source: draft.source || "local",
        quotaRemaining: reservation.dailyRemaining,
      });
    } finally {
      await finishAiRequest(supabase, requestId, data.user.id, succeeded);
    }
  } catch (error) {
    console.error("microapp generate failed", error);
    const fallback = localDraft(template, prompt, lang);
    return NextResponse.json({ ok: true, ...fallback, meta: { coverEmoji: "🎮", accent: "#12b7a6" }, source: "local" });
  }
}
