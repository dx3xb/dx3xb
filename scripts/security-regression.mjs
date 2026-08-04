import { readFile } from "node:fs/promises";

const childFiles = [
  "color-hunter/app/dx3xb-trio.tsx",
  "dont-click-wrong/app/dx3xb-trio.tsx",
  "instant-memory/app/dx3xb-trio.tsx",
  "ai-truth-detective/app/dx3xb-ai.tsx",
  "data-monster/app/dx3xb-ai.tsx",
  "prompt-commander/app/dx3xb-ai.tsx",
  "recommendation-tamer/app/dx3xb-ai.tsx",
  "ai-court/app/dx3xb-ai.tsx",
];

for (const file of childFiles) {
  const source = await readFile(file, "utf8");
  if (/createClient|SUPABASE_(?:URL|ANON_KEY)|cookieStorage|COOKIE_DOMAIN/.test(source)) {
    throw new Error(`${file} must use the main-origin bridge instead of a Supabase session`);
  }
  if (!source.includes("trioBridgeCall")) throw new Error(`${file} is missing the session bridge`);
}

const nextConfig = await readFile("next.config.mjs", "utf8");
for (const origin of [
  "https://color-hunter.dx3xb.com",
  "https://dont-click-wrong.dx3xb.com",
  "https://instant-memory.dx3xb.com",
  "https://ai-detective.dx3xb.com",
  "https://data-monster.dx3xb.com",
  "https://prompt-commander.dx3xb.com",
  "https://recommendation-tamer.dx3xb.com",
  "https://ai-court.dx3xb.com",
]) {
  if (!nextConfig.includes(origin)) throw new Error(`bridge CSP is missing ${origin}`);
}

const classroomApi = await readFile("app/api/classrooms/route.ts", "utf8");
if (!classroomApi.includes("auth.user.is_anonymous") || !classroomApi.includes("daily_room_limit")) {
  throw new Error("classroom creation must require a registered account and enforce a daily room limit");
}
const classroomStats = await readFile("app/api/classrooms/[code]/stats/route.ts", "utf8");
if (!classroomStats.includes("room.owner_id !== auth.user.id") || /select\([^)]*(email|handle)/.test(classroomStats)) {
  throw new Error("teacher stats must be owner-only and exclude student identity fields");
}

const admin = await readFile("app/admin/page.tsx", "utf8");
if (/Authorization\s*:\s*`Bearer|sessionStorage\.setItem\([^)]*dx3xb_admin/.test(admin)) {
  throw new Error("admin credentials must never be persisted or sent as bearer tokens");
}

const workshop = await readFile("app/_mt/workshop-spec.ts", "utf8");
for (const guard of ["sendBeacon", "localStorage", "dynamic_element", "Content-Security-Policy"]) {
  if (!workshop.includes(guard)) throw new Error(`workshop sandbox is missing ${guard} protection`);
}

console.log("security regression checks passed");
