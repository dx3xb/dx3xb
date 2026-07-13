import { readdir, readFile } from "node:fs/promises";

const dir = new URL("../supabase/migrations/", import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
const seen = new Set();
const errors = [];
for (const file of files) {
  const match = /^(\d{14}|\d{3})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) errors.push(`${file}: invalid migration filename`);
  const version = match?.[1];
  if (version && seen.has(version)) errors.push(`${file}: duplicate migration version ${version}`);
  if (version) seen.add(version);
  const sql = await readFile(new URL(file, dir), "utf8");
  if (/\b(drop\s+database|truncate\s+table|drop\s+schema\s+(?!if\s+exists))/i.test(sql)) errors.push(`${file}: destructive SQL requires a reviewed forward migration`);
  if (/security\s+definer/i.test(sql) && !/set\s+search_path/i.test(sql)) errors.push(`${file}: SECURITY DEFINER must set search_path`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`migration checks passed (${files.length} files)`);
