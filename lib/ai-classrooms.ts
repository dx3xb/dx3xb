export const CLASSROOM_GAME_KEYS = ["ai-truth-detective", "data-monster", "prompt-commander", "recommendation-tamer", "ai-court"] as const;
export type ClassroomGame = (typeof CLASSROOM_GAME_KEYS)[number];
export const CLASSROOM_PACK_KEYS = ["ai-foundations", "algorithms-and-society", "full-adventure"] as const;
export type ClassroomPack = (typeof CLASSROOM_PACK_KEYS)[number];

export const CLASSROOM_GAMES: Record<ClassroomGame, {
  emoji: string;
  url: string;
  name: Record<"zh" | "en", string>;
  skill: Record<"zh" | "en", string>;
  minutes: number;
}> = {
  "ai-truth-detective": { emoji: "🔎", url: "https://ai-detective.dx3xb.com", name: { zh: "AI 侦探社", en: "AI Detective" }, skill: { zh: "核验与证据", en: "Verification & evidence" }, minutes: 8 },
  "data-monster": { emoji: "🧬", url: "https://data-monster.dx3xb.com", name: { zh: "数据怪兽训练营", en: "Data Monster Camp" }, skill: { zh: "数据、标签与测试", en: "Data, labels & testing" }, minutes: 10 },
  "prompt-commander": { emoji: "⌨️", url: "https://prompt-commander.dx3xb.com", name: { zh: "提示词指挥官", en: "Prompt Commander" }, skill: { zh: "任务表达与拆解", en: "Task expression & decomposition" }, minutes: 10 },
  "recommendation-tamer": { emoji: "🧭", url: "https://recommendation-tamer.dx3xb.com", name: { zh: "推荐算法驯兽师", en: "Recommendation Tamer" }, skill: { zh: "反馈循环与信息多元", en: "Feedback loops & diversity" }, minutes: 10 },
  "ai-court": { emoji: "⚖️", url: "https://ai-court.dx3xb.com", name: { zh: "AI 法庭", en: "AI Court" }, skill: { zh: "公平、阈值与责任", en: "Fairness, thresholds & responsibility" }, minutes: 12 },
};

export const CLASSROOM_PACKS: Record<ClassroomPack, {
  name: Record<"zh" | "en", string>;
  desc: Record<"zh" | "en", string>;
  games: ClassroomGame[];
  minutes: number;
}> = {
  "ai-foundations": { name: { zh: "AI 基础三关", en: "AI Foundations Trio" }, desc: { zh: "会判断 → 懂训练 → 能表达，适合一节信息科技课。", en: "Judge → train → express, designed for one class period." }, games: ["ai-truth-detective", "data-monster", "prompt-commander"], minutes: 45 },
  "algorithms-and-society": { name: { zh: "算法与社会双案", en: "Algorithms & Society" }, desc: { zh: "推荐反馈循环与公平决策，适合班会、社团讨论。", en: "Recommendation loops and fair decisions for discussion." }, games: ["recommendation-tamer", "ai-court"], minutes: 35 },
  "full-adventure": { name: { zh: "AI 探险完整活动", en: "Full AI Adventure" }, desc: { zh: "五枚芯片 + 小组讨论 + 工坊改造，适合 90 分钟活动。", en: "Five chips, group discussion and a remix activity." }, games: [...CLASSROOM_GAME_KEYS], minutes: 90 },
};

export function isClassroomPack(value: unknown): value is ClassroomPack {
  return CLASSROOM_PACK_KEYS.includes(value as ClassroomPack);
}
export function safeClassCode(value: unknown) {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[A-Z2-9]{6}$/.test(code) ? code : "";
}

