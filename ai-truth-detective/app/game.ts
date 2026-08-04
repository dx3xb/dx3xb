export type Lang = "zh" | "en";

type Localized = Record<Lang, string>;

export type DetectiveCase = {
  id: string;
  category: Localized;
  prompt: Localized;
  claims: Record<Lang, readonly [string, string, string]>;
  unreliable: 0 | 1 | 2;
  evidence: Localized;
  explanation: Localized;
  lesson: Localized;
};

export type RoundScoreInput = {
  correct: boolean;
  secondsLeft: number;
  evidenceUsed: boolean;
  previousStreak: number;
};

export const ROUND_SECONDS = 15;
export const CASES_PER_RUN = 5;
export const STARTING_TOKENS = 3;

export const CASES: readonly DetectiveCase[] = [
  {
    id: "next-token",
    category: { zh: "语言模型", en: "LANGUAGE MODEL" },
    prompt: { zh: "AI 正在解释大语言模型。哪一句最不可靠？", en: "AI is explaining large language models. Which claim is least reliable?" },
    claims: {
      zh: ["它会根据上下文预测接下来可能出现的词。", "它能生成读起来很流畅的文字。", "它像人一样亲身经历并理解自己说的每句话。"],
      en: ["It predicts likely next words from context.", "It can generate fluent-sounding text.", "It experiences and understands every sentence exactly like a person."],
    },
    unreliable: 2,
    evidence: { zh: "线索：生成语言依靠模式和概率；流畅不等于拥有人的经历。", en: "CLUE: Language generation uses patterns and probabilities; fluency is not human experience." },
    explanation: { zh: "大语言模型处理的是数据中的模式，不是以人的方式亲历世界。", en: "Large language models process patterns in data; they do not experience the world as people do." },
    lesson: { zh: "别把会说话误认成会亲历。", en: "Do not confuse fluent speech with lived experience." },
  },
  {
    id: "training-data",
    category: { zh: "训练数据", en: "TRAINING DATA" },
    prompt: { zh: "AI 正在介绍训练数据。找出站不住脚的一句。", en: "AI is describing training data. Find the claim that does not hold up." },
    claims: {
      zh: ["带标签的样本可以教分类器区分不同类别。", "数据质量会影响模型在新样本上的表现。", "只要数据数量够多，偏差就一定会自动消失。"],
      en: ["Labeled examples can teach a classifier to separate categories.", "Data quality affects performance on new examples.", "Bias always disappears automatically when the dataset is large enough."],
    },
    unreliable: 2,
    evidence: { zh: "线索：把同一种偏差复制一百万次，它仍然是偏差。", en: "CLUE: Copying the same bias a million times does not remove it." },
    explanation: { zh: "数据量很重要，但代表性、标注方式和采集过程同样决定偏差。", en: "Dataset size matters, but representation, labeling, and collection methods also shape bias." },
    lesson: { zh: "多不等于好，先问数据从哪里来。", en: "More is not automatically better. Ask where the data came from." },
  },
  {
    id: "confidence",
    category: { zh: "置信度", en: "CONFIDENCE" },
    prompt: { zh: "一个识别器给出 0.92 的置信度。哪句解读有问题？", en: "A classifier reports 0.92 confidence. Which interpretation is flawed?" },
    claims: {
      zh: ["这个数通常表示模型对当前预测的信心。", "真实准确率还要在合适的测试数据上评估。", "0.92 能证明这一次预测绝对正确。"],
      en: ["The number usually expresses the model's confidence in this prediction.", "Real accuracy still needs evaluation on suitable test data.", "A score of 0.92 proves this prediction is absolutely correct."],
    },
    unreliable: 2,
    evidence: { zh: "线索：很有信心的人也可能答错，模型同样如此。", en: "CLUE: A very confident answer can still be wrong; models are no exception." },
    explanation: { zh: "置信度不是事实证明，也可能因为数据分布变化而失准。", en: "Confidence is not proof and can be miscalibrated when the data distribution changes." },
    lesson: { zh: "高置信度不是免检通行证。", en: "High confidence is not a pass to skip checking." },
  },
  {
    id: "recommendation-loop",
    category: { zh: "推荐算法", en: "RECOMMENDERS" },
    prompt: { zh: "AI 正在解释短视频推荐。哪一句像是在胡说？", en: "AI is explaining short-video recommendations. Which claim is misleading?" },
    claims: {
      zh: ["停留、点赞和跳过都可能成为反馈信号。", "连续点击同类内容可能让推荐越来越集中。", "推荐页只按发布时间排序，和你的行为完全无关。"],
      en: ["Watch time, likes, and skips can all become feedback signals.", "Repeatedly choosing similar content can narrow future recommendations.", "The feed is only chronological and completely unrelated to your behavior."],
    },
    unreliable: 2,
    evidence: { zh: "线索：推荐系统的核心任务之一，就是利用交互信号排序内容。", en: "CLUE: A core job of recommender systems is ranking content using interaction signals." },
    explanation: { zh: "许多推荐页会根据交互不断更新排序，而不只是按时间排列。", en: "Many recommendation feeds update rankings from interactions rather than using time alone." },
    lesson: { zh: "你在训练推荐器，推荐器也在塑造你看到的世界。", en: "You train the recommender, and it shapes the world you see." },
  },
  {
    id: "citations",
    category: { zh: "来源核验", en: "SOURCE CHECK" },
    prompt: { zh: "AI 给答案加了三条引用。哪一句最危险？", en: "AI added three citations to an answer. Which claim is most dangerous?" },
    claims: {
      zh: ["可以打开原文检查标题、作者和发布日期。", "引用也可能不存在、过时或没有支持对应结论。", "只要格式像参考文献，答案就一定可靠。"],
      en: ["You can open the source and check its title, author, and date.", "A citation can be nonexistent, outdated, or unrelated to the claim.", "If it looks like a formal reference, the answer must be reliable."],
    },
    unreliable: 2,
    evidence: { zh: "线索：引用的外观可以生成，来源是否存在必须另外检查。", en: "CLUE: The appearance of a citation can be generated; its existence must be checked separately." },
    explanation: { zh: "引用格式不是可靠性证明，关键是原文是否存在并真正支持结论。", en: "Citation formatting is not proof; the source must exist and actually support the claim." },
    lesson: { zh: "别数引用，打开引用。", en: "Do not just count citations. Open them." },
  },
  {
    id: "computer-vision",
    category: { zh: "机器视觉", en: "COMPUTER VISION" },
    prompt: { zh: "AI 正在介绍图片识别。哪一句不靠谱？", en: "AI is explaining image recognition. Which claim is unreliable?" },
    claims: {
      zh: ["模型可以从像素中学习与类别相关的特征。", "裁剪、光线或噪点可能改变识别结果。", "模型看图片的方式和人眼完全相同。"],
      en: ["A model can learn category-related features from pixels.", "Cropping, lighting, or noise can change a prediction.", "A model sees an image in exactly the same way a person does."],
    },
    unreliable: 2,
    evidence: { zh: "线索：人和模型可能关注完全不同的像素线索。", en: "CLUE: People and models may rely on very different visual cues." },
    explanation: { zh: "模型从数值特征中计算预测，并不复制人的视觉经验。", en: "Models compute predictions from numerical features; they do not copy human visual experience." },
    lesson: { zh: "AI 的“看见”是一种计算，不是一双人眼。", en: "AI 'seeing' is computation, not a pair of human eyes." },
  },
  {
    id: "private-window",
    category: { zh: "数据隐私", en: "DATA PRIVACY" },
    prompt: { zh: "同学想把秘密发给聊天机器人。哪句建议有问题？", en: "A student wants to send a secret to a chatbot. Which advice is flawed?" },
    claims: {
      zh: ["先查看服务的隐私与数据使用说明。", "不要输入密码、身份证号或别人的隐私。", "使用浏览器无痕模式就能保证内容不会发送给服务商。"],
      en: ["Check the service's privacy and data-use policy first.", "Do not enter passwords, identity numbers, or someone else's private information.", "Incognito mode guarantees the content is never sent to the provider."],
    },
    unreliable: 2,
    evidence: { zh: "线索：无痕模式主要减少本机浏览记录，不会阻止网站接收你提交的数据。", en: "CLUE: Incognito mode mainly reduces local history; it does not stop a website receiving submitted data." },
    explanation: { zh: "无痕模式不等于网络匿名，也不改变服务商的数据处理规则。", en: "Incognito mode is not network anonymity and does not change a provider's data practices." },
    lesson: { zh: "不能写在教室墙上的秘密，也别随手发给 AI。", en: "If it should not go on a classroom wall, do not casually send it to AI." },
  },
  {
    id: "fairness",
    category: { zh: "算法公平", en: "ALGORITHM FAIRNESS" },
    prompt: { zh: "AI 正在评价一个自动评分系统。哪一句不成立？", en: "AI is reviewing an automated scoring system. Which claim does not follow?" },
    claims: {
      zh: ["历史数据可能带有过去的偏差。", "应该分别检查不同群体上的错误情况。", "总体准确率很高就能保证对每个群体都公平。"],
      en: ["Historical data may contain past bias.", "Error rates should be checked across different groups.", "High overall accuracy guarantees fairness for every group."],
    },
    unreliable: 2,
    evidence: { zh: "线索：总体平均数可能掩盖某个小群体上很高的错误率。", en: "CLUE: An overall average can hide a high error rate for a smaller group." },
    explanation: { zh: "总体表现和群体公平不是同一个指标，需要分组检查并保留申诉机制。", en: "Overall performance and group fairness are different; disaggregated checks and appeals matter." },
    lesson: { zh: "平均分很好看，也可能有人一直被算错。", en: "A good average can still hide people who are repeatedly misjudged." },
  },
  {
    id: "prompting",
    category: { zh: "提示词", en: "PROMPTING" },
    prompt: { zh: "AI 正在教人写提示词。找出夸大的建议。", en: "AI is teaching prompting. Find the exaggerated advice." },
    claims: {
      zh: ["说明目标、限制和输出格式通常会更清楚。", "先看结果再补充条件是一种正常迭代。", "提示词越长，结果就一定越准确。"],
      en: ["Stating the goal, constraints, and output format is usually clearer.", "Reviewing a result and adding constraints is normal iteration.", "A longer prompt is always more accurate."],
    },
    unreliable: 2,
    evidence: { zh: "线索：无关信息也会制造歧义，长度不是质量指标。", en: "CLUE: Irrelevant detail can add ambiguity; length is not a quality metric." },
    explanation: { zh: "好的提示词强调清楚、相关和可检查，而不是单纯堆字数。", en: "Good prompts are clear, relevant, and testable—not merely long." },
    lesson: { zh: "把任务说清楚，比把任务说很长更重要。", en: "Clear beats long." },
  },
  {
    id: "search-vs-generation",
    category: { zh: "搜索与生成", en: "SEARCH VS GENERATION" },
    prompt: { zh: "AI 正在比较搜索引擎和聊天模型。哪句需要亮红灯？", en: "AI is comparing search engines and chat models. Which claim needs a red flag?" },
    claims: {
      zh: ["搜索系统通常返回可打开的网页或文档。", "语言模型通常根据学到的模式生成回答。", "聊天模型默认总能看到此刻最新的整个互联网。"],
      en: ["Search systems usually return pages or documents you can open.", "Language models usually generate answers from learned patterns.", "A chatbot can always see the entire live internet by default."],
    },
    unreliable: 2,
    evidence: { zh: "线索：能否联网、数据更新到何时，取决于具体产品和当前工具。", en: "CLUE: Live access and freshness depend on the specific product and tools available." },
    explanation: { zh: "不能从“会聊天”推断“正在浏览最新网页”，需要确认联网能力与来源。", en: "Conversation does not prove live browsing; check tool access and sources." },
    lesson: { zh: "先问它从哪里知道，再决定要不要相信。", en: "Ask where it knows from before deciding whether to trust it." },
  },
  {
    id: "human-review",
    category: { zh: "人机协作", en: "HUMAN REVIEW" },
    prompt: { zh: "学校想用 AI 辅助审核作品。哪句最值得怀疑？", en: "A school wants AI to help review projects. Which claim deserves doubt?" },
    claims: {
      zh: ["AI 可以帮助整理大量材料和标记待检查项。", "重要决定应保留人工复核和申诉渠道。", "自动系统给出的决定永远不需要解释或复查。"],
      en: ["AI can help organize many submissions and flag items for review.", "Important decisions should keep human review and an appeal path.", "Automated decisions never need explanation or review."],
    },
    unreliable: 2,
    evidence: { zh: "线索：模型会出错，重要决定还会影响真实的人。", en: "CLUE: Models make mistakes, and important decisions affect real people." },
    explanation: { zh: "高影响场景需要责任人、解释和纠错渠道，不能把责任交给系统。", en: "High-impact uses need accountable people, explanations, and correction paths." },
    lesson: { zh: "AI 可以给建议，责任不能自动消失。", en: "AI can advise; responsibility cannot disappear." },
  },
  {
    id: "synthetic-media",
    category: { zh: "合成内容", en: "SYNTHETIC MEDIA" },
    prompt: { zh: "看到一张惊人的网络图片，哪句判断最不可靠？", en: "You see a shocking image online. Which judgment is least reliable?" },
    claims: {
      zh: ["可以查找最早来源和其他角度的报道。", "画面细节、上下文和发布者都值得检查。", "只要图片足够清晰逼真，就能证明事件真实发生。"],
      en: ["You can look for the earliest source and reporting from other angles.", "Visual details, context, and the publisher are all worth checking.", "If an image is clear and realistic enough, it proves the event happened."],
    },
    unreliable: 2,
    evidence: { zh: "线索：生成和编辑工具都能制作非常逼真的画面。", en: "CLUE: Generative and editing tools can both create highly realistic images." },
    explanation: { zh: "逼真度不能替代来源核验；真实图片也可能配上错误上下文。", en: "Realism cannot replace source checking; even a real image can be given false context." },
    lesson: { zh: "看起来像证据，不代表已经被证明。", en: "Looking like evidence is not the same as being verified." },
  },
] as const;

function seedHash(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = seedHash(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function casesForSeed(seed: string, count = CASES_PER_RUN): DetectiveCase[] {
  const random = seededRandom(seed || "dx3xb-detective");
  const pool = [...CASES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}

export function scoreRound({ correct, secondsLeft, evidenceUsed, previousStreak }: RoundScoreInput) {
  if (!correct) return 0;
  const safeSeconds = Math.max(0, Math.min(ROUND_SECONDS, Math.round(secondsLeft)));
  const speed = Math.round((safeSeconds / ROUND_SECONDS) * 100);
  return 200 + speed + (evidenceUsed ? 0 : 60) + (previousStreak > 0 ? 30 : 0);
}

export function masteryScore(correct: number, tokensLeft: number) {
  const accuracyPart = (Math.max(0, Math.min(CASES_PER_RUN, correct)) / CASES_PER_RUN) * 80;
  const evidencePart = (Math.max(0, Math.min(STARTING_TOKENS, tokensLeft)) / STARTING_TOKENS) * 20;
  return Math.round(accuracyPart + evidencePart);
}

export function resultKey(correct: number, tokensLeft: number) {
  if (correct === CASES_PER_RUN && tokensLeft >= 2) return "evidence_hunter";
  if (correct >= 4) return "calm_verifier";
  if (correct >= 3) return "clue_collector";
  return "pause_before_nodding";
}

export function makeSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export function safeChallengeName(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, 24);
}
