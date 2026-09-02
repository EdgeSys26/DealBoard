import { describe, expect, it } from "vitest";
import { computeBadge, parseBadgeOverride } from "./badge";

describe("computeBadge", () => {
  it("is Green when new", () => {
    expect(
      computeBadge({ fundedCloses: 0, fundedLast12Months: 0, openStrikes: 0 }),
    ).toBe("GREEN");
  });

  it("is Silver at one funded close", () => {
    expect(
      computeBadge({ fundedCloses: 1, fundedLast12Months: 1, openStrikes: 0 }),
    ).toBe("SILVER");
  });

  it("is Gold at five funded closes in 12 months with no open strike", () => {
    expect(
      computeBadge({ fundedCloses: 5, fundedLast12Months: 5, openStrikes: 0 }),
    ).toBe("GOLD");
  });

  it("drops Gold to Silver when a strike is open", () => {
    expect(
      computeBadge({ fundedCloses: 5, fundedLast12Months: 5, openStrikes: 1 }),
    ).toBe("SILVER");
  });

  it("stays Green with a strike and no funded close — no auto-ban", () => {
    expect(
      computeBadge({ fundedCloses: 0, fundedLast12Months: 0, openStrikes: 2 }),
    ).toBe("GREEN");
  });

  it("stays Silver if five lifetime closes are older than 12 months", () => {
    expect(
      computeBadge({ fundedCloses: 5, fundedLast12Months: 4, openStrikes: 0 }),
    ).toBe("SILVER");
  });
});

describe("parseBadgeOverride", () => {
  it("accepts Auto and the three badges", () => {
    expect(parseBadgeOverride("auto")).toBe("AUTO");
    expect(parseBadgeOverride("Gold")).toBe("GOLD");
    expect(parseBadgeOverride("nope")).toBe(null);
  });
});
