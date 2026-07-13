import { describe, expect, it } from "vitest";
import { followBodySchema, generateBodySchema, playEventBodySchema, playResultBodySchema, workshopBodySchema } from "@/lib/api-schemas";

describe("API schemas", () => {
  it("rejects unknown and oversized AI input", () => {
    expect(generateBodySchema.safeParse({ template: "quiz", prompt: "ok", extra: true }).success).toBe(false);
    expect(workshopBodySchema.safeParse({ prompt: "x".repeat(601) }).success).toBe(false);
  });

  it("requires signed-session events and bounded results", () => {
    expect(playEventBodySchema.safeParse({ event: "start" }).success).toBe(false);
    expect(playResultBodySchema.safeParse({ playToken: "short", score: 2_000_000_000 }).success).toBe(false);
  });

  it("requires an explicit follow state", () => {
    expect(followBodySchema.safeParse({ handle: "maker" }).success).toBe(false);
    expect(followBodySchema.safeParse({ handle: "maker", active: true }).success).toBe(true);
  });
});
