import { describe, expect, it } from "vitest";
import { looksPromotional } from "@/lib/request-guards";

describe("request guards", () => {
  it("flags multi-signal sales outreach", () => {
    expect(looksPromotional("We make explainer videos to showcase your product.")).toBe(true);
    expect(looksPromotional("SEO help: https://spam.example")).toBe(true);
    expect(looksPromotional("提供营销推广和商务合作服务")).toBe(true);
  });

  it("keeps ordinary guestbook messages visible", () => {
    expect(looksPromotional("这个像素小游戏很好玩，希望继续更新！")).toBe(false);
    expect(looksPromotional("I made it to level 8 — fun toy!")).toBe(false);
  });
});
