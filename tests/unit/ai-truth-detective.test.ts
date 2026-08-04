import { describe, expect, it } from "vitest";
import {
  CASES_PER_RUN,
  ROUND_SECONDS,
  STARTING_TOKENS,
  casesForSeed,
  masteryScore,
  resultKey,
  safeChallengeName,
  scoreRound,
} from "../../ai-truth-detective/app/game";

describe("AI truth detective game rules", () => {
  it("replays the same cases and answers for the same seed", () => {
    const first = casesForSeed("same-classroom-case");
    const second = casesForSeed("same-classroom-case");
    expect(first.map((item) => [item.id, item.unreliable])).toEqual(second.map((item) => [item.id, item.unreliable]));
    expect(new Set(first.map((item) => item.id)).size).toBe(CASES_PER_RUN);
  });

  it("keeps Chinese and English on the same answer key", () => {
    for (const item of casesForSeed("bilingual")) {
      expect(item.claims.zh).toHaveLength(3);
      expect(item.claims.en).toHaveLength(3);
      expect(item.claims.zh[item.unreliable]).toBeTruthy();
      expect(item.claims.en[item.unreliable]).toBeTruthy();
    }
  });

  it("scores only correct answers and clamps the speed bonus", () => {
    expect(scoreRound({ correct: false, secondsLeft: ROUND_SECONDS, evidenceUsed: false, previousStreak: 4 })).toBe(0);
    expect(scoreRound({ correct: true, secondsLeft: 999, evidenceUsed: false, previousStreak: 1 })).toBe(390);
    expect(scoreRound({ correct: true, secondsLeft: -4, evidenceUsed: true, previousStreak: 0 })).toBe(200);
  });

  it("keeps mastery and titles inside the learning scale", () => {
    expect(masteryScore(0, 0)).toBe(0);
    expect(masteryScore(CASES_PER_RUN, STARTING_TOKENS)).toBe(100);
    expect(masteryScore(99, 99)).toBe(100);
    expect(resultKey(CASES_PER_RUN, 2)).toBe("evidence_hunter");
    expect(resultKey(2, 0)).toBe("pause_before_nodding");
  });

  it("sanitizes challenge labels as short plain text", () => {
    expect(safeChallengeName("  <b>小侦探</b>\u0000  ")).toBe("b小侦探/b");
    expect(safeChallengeName("x".repeat(80))).toHaveLength(24);
  });
});
