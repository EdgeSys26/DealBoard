import { describe, expect, it } from "vitest";
import {
  canHotBadge,
  evaluateHot,
  hotCooldownUntil,
  hotPlan,
  isListingHot,
} from "./hot";

const now = new Date("2026-09-02T16:00:00Z");

const ready = {
  badge: "SILVER",
  strikeCount: 0,
  verified: true,
  status: "ACTIVE",
  hasTitle: true,
  listingHot: false,
  sellerHasLiveHot: false,
  cooldownUntil: null as Date | null,
  now,
};

describe("Hot plans", () => {
  it("is not cheap", () => {
    expect(hotPlan(48)).toEqual({ hours: 48, dollars: 99, label: "48h" });
    expect(hotPlan(72)).toEqual({ hours: 72, dollars: 179, label: "72h" });
    expect(hotPlan(24)).toBe(null);
  });
});

describe("Hot eligibility", () => {
  it("lets Silver or Gold through when verified, titled, and clean", () => {
    expect(canHotBadge("GREEN")).toBe(false);
    expect(canHotBadge("SILVER")).toBe(true);
    expect(evaluateHot(ready).ok).toBe(true);
    expect(evaluateHot({ ...ready, badge: "GOLD" }).ok).toBe(true);
  });

  it("blocks Green, unverified, no title, strike, and a second Hot", () => {
    expect(evaluateHot({ ...ready, badge: "GREEN" }).reason).toBe("Green cannot Hot");
    expect(evaluateHot({ ...ready, verified: false }).reason).toBe("Contract not verified");
    expect(evaluateHot({ ...ready, hasTitle: false }).reason).toBe("Title on file required");
    expect(evaluateHot({ ...ready, strikeCount: 1 }).reason).toBe("Open strike");
    expect(evaluateHot({ ...ready, sellerHasLiveHot: true }).reason).toBe("One Hot per seller");
  });

  it("enforces a 7-day cooldown after Hot ends", () => {
    const ended = new Date("2026-08-28T16:00:00Z");
    const until = hotCooldownUntil(ended);
    expect(until?.getTime()).toBe(ended.getTime() + 7 * 86_400_000);
    expect(
      evaluateHot({ ...ready, cooldownUntil: until, now: new Date("2026-09-02T16:00:00Z") }).ok,
    ).toBe(false);
    expect(
      evaluateHot({ ...ready, cooldownUntil: until, now: new Date("2026-09-04T16:00:01Z") }).ok,
    ).toBe(true);
  });

  it("treats hotUntil in the future as live", () => {
    expect(isListingHot({ hotUntil: new Date("2026-09-03T16:00:00Z") }, now)).toBe(true);
    expect(isListingHot({ hotUntil: new Date("2026-09-02T15:00:00Z") }, now)).toBe(false);
  });
});
