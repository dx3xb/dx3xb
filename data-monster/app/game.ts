export type Species = "momo" | "spike";
export type Monster = { id: string; round: number; horns: number; spots: number; hue: number; truth: Species };
export type TrainingLabel = { monster: Monster; label: Species };

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: string) {
  let n = hash(seed) || 1;
  return () => { n += 0x6d2b79f5; let t = n; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function speciesOf(m: Omit<Monster, "truth">): Species {
  return m.round * 1.2 + m.spots * 0.17 - m.horns * 0.25 + (m.hue < 0.5 ? 0.12 : -0.08) >= 0.7 ? "momo" : "spike";
}
function makeMonster(random: () => number, id: string): Monster {
  const base = { id, round: Math.round(random() * 100) / 100, horns: Math.floor(random() * 4), spots: Math.floor(random() * 5), hue: Math.round(random() * 100) / 100 };
  return { ...base, truth: speciesOf(base) };
}
function balanced(random: () => number, prefix: string, count: number) {
  const rows: Monster[] = [];
  for (let i = 0; rows.length < count && i < 200; i += 1) {
    const next = makeMonster(random, `${prefix}-${i}`);
    const same = rows.filter((m) => m.truth === next.truth).length;
    if (same < Math.ceil(count / 2)) rows.push(next);
  }
  return rows;
}
export function missionForSeed(seed: string) {
  const random = rng(seed);
  return { training: balanced(random, "train", 8), test: balanced(random, "test", 6) };
}
function distance(a: Monster, b: { round: number; horns: number; spots: number; hue: number }) {
  return Math.hypot((a.round - b.round) * 2, (a.horns - b.horns) / 3, (a.spots - b.spots) / 4, a.hue - b.hue);
}
export function classify(training: TrainingLabel[], monster: Monster): Species {
  const groups: Record<Species, Monster[]> = { momo: [], spike: [] };
  training.forEach((row) => groups[row.label].push(row.monster));
  const centroid = (rows: Monster[]) => rows.length ? ({ round: rows.reduce((s,m)=>s+m.round,0)/rows.length, horns: rows.reduce((s,m)=>s+m.horns,0)/rows.length, spots: rows.reduce((s,m)=>s+m.spots,0)/rows.length, hue: rows.reduce((s,m)=>s+m.hue,0)/rows.length }) : null;
  const a = centroid(groups.momo), b = centroid(groups.spike);
  if (!a) return "spike";
  if (!b) return "momo";
  return distance(monster, a) <= distance(monster, b) ? "momo" : "spike";
}
export function evaluate(training: TrainingLabel[], test: Monster[]) {
  const predictions = test.map((monster) => ({ monster, predicted: classify(training, monster), correct: classify(training, monster) === monster.truth }));
  const correct = predictions.filter((row) => row.correct).length;
  return { predictions, correct, accuracy: Math.round((correct / Math.max(1, test.length)) * 100) };
}
export function mastery(labelCorrect: number, totalLabels: number, accuracy: number) { return Math.round((labelCorrect / Math.max(1,totalLabels)) * 40 + accuracy * 0.6); }
export function resultKey(value: number) { return value >= 85 ? "scientist" : value >= 65 ? "trainer" : "collector"; }

