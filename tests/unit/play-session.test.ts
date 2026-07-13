import { afterEach, describe, expect, it } from "vitest";
import { issuePlayToken, verifyPlayToken } from "@/lib/play-session";

const previous = process.env.PLAY_SESSION_SECRET;
afterEach(() => { process.env.PLAY_SESSION_SECRET = previous; });

describe("play session token", () => {
  it("accepts an intact token and rejects tampering", () => {
    process.env.PLAY_SESSION_SECRET = "test-secret-with-enough-entropy";
    const token = issuePlayToken("123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001", Date.now() + 60_000);
    expect(verifyPlayToken(token)?.sid).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(verifyPlayToken(`${token.slice(0, -1)}x`)).toBeNull();
  });
});
