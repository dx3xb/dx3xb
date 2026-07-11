import { readFile } from "node:fs/promises";

const childFiles = [
  "color-hunter/app/dx3xb-trio.tsx",
  "dont-click-wrong/app/dx3xb-trio.tsx",
  "instant-memory/app/dx3xb-trio.tsx",
];

for (const file of childFiles) {
  const source = await readFile(file, "utf8");
  if (/createClient|SUPABASE_(?:URL|ANON_KEY)|cookieStorage|COOKIE_DOMAIN/.test(source)) {
    throw new Error(`${file} must use the main-origin bridge instead of a Supabase session`);
  }
  if (!source.includes("trioBridgeCall")) throw new Error(`${file} is missing the session bridge`);
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
