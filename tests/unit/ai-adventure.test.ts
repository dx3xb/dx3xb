import { describe, expect, it } from "vitest";
import { evaluate, missionForSeed } from "../../data-monster/app/game";
import { evaluatePrompt, finalMastery, missionsForSeed } from "../../prompt-commander/app/game";
import { diversityIndex, freshWeights, interventionScore, updateWeights } from "../../recommendation-tamer/app/game";
import { casesForSeed, metrics, verdictScore } from "../../ai-court/app/game";
import { CLASSROOM_PACKS, safeClassCode } from "../../lib/ai-classrooms";
import { OFFICIAL_REMIXES } from "../../app/_mt/official-remixes";
import { workshopJsPolicyIssue, wsPublishable, wsValidate } from "../../app/_mt/workshop-spec";

describe("AI Adventure phases 2-4", () => {
  it("builds deterministic balanced data-monster missions and computes a real test score", () => {
    const first = missionForSeed("class-a");
    const second = missionForSeed("class-a");
    expect(first).toEqual(second);
    expect(new Set(first.training.map((m) => m.truth)).size).toBe(2);
    const trained = first.training.map((monster) => ({ monster, label: monster.truth }));
    const result = evaluate(trained, first.test);
    expect(result.predictions).toHaveLength(6);
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(100);
  });

  it("scores prompt structure from required information instead of magic words", () => {
    const mission = missionsForSeed("prompt-test")[0];
    const complete = evaluatePrompt(mission, mission.required);
    expect(complete.success).toBe(true);
    expect(complete.pct).toBe(100);
    const noise = mission.chips.find((chip) => chip.kind === "noise");
    if (noise) expect(evaluatePrompt(mission, [noise.id]).pct).toBe(0);
    expect(finalMastery([{ pct: 100 }, { pct: 50 }])).toBe(75);
  });

  it("makes recommender weights react to behavior and rewards active controls", () => {
    const initial = freshWeights();
    const changed = updateWeights(initial, "science", true);
    expect(changed.science).toBeGreaterThan(initial.science);
    expect(diversityIndex(["science", "science", "science"])).toBeLessThan(diversityIndex(["science", "art", "sports", "games", "campus"]));
    expect(interventionScore(["reset", "diverse", "control"])).toBe(100);
    expect(interventionScore(["faster", "block", "auto"])).toBe(0);
  });

  it("keeps court accuracy, group gap and accountability separate", () => {
    const courtCase = casesForSeed("court-test")[0];
    const snapshot = metrics(courtCase, 3);
    expect(snapshot.accuracy).toBeGreaterThanOrEqual(0);
    expect(snapshot.gap).toBe(Math.abs(snapshot.aRate - snapshot.bRate));
    const good = courtCase.safeguards.find((row) => row.good)!;
    const bad = courtCase.safeguards.find((row) => !row.good)!;
    expect(verdictScore(courtCase, 3, good.id).score).toBeGreaterThan(verdictScore(courtCase, 3, bad.id).score);
  });

  it("keeps classroom codes non-identifying and packs bounded", () => {
    expect(safeClassCode("ab-c12")).toBe("");
    expect(safeClassCode("ABC234")).toBe("ABC234");
    expect(CLASSROOM_PACKS["full-adventure"].games).toHaveLength(5);
    expect(CLASSROOM_PACKS["ai-foundations"].minutes).toBeLessThanOrEqual(45);
  });

  it("ships four safe, publishable official remix templates", () => {
    expect(OFFICIAL_REMIXES).toHaveLength(4);
    for (const template of OFFICIAL_REMIXES) {
      for (const lang of ["zh", "en"] as const) {
        const config = wsValidate(template.config[lang]);
        expect(workshopJsPolicyIssue(config.js)).toBeNull();
        expect(wsPublishable(config)).toBe(true);
      }
    }
  });
});
