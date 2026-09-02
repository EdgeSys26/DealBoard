import { describe, expect, it } from "vitest";
import { needsWorkJson, parseNeedsWork } from "./needs-work";
import { parseWorkLevel, parseWorkLevels, WORK_LEVEL_LABEL, WORK_LEVELS } from "./types";

describe("I'll take work levels", () => {
  it("keeps the eight buyer options", () => {
    expect(WORK_LEVELS).toEqual([
      "TURNKEY",
      "PAINT_CARPET",
      "LIGHT_COSMETIC",
      "MEDIUM",
      "HEAVY",
      "FULL_GUT",
      "FIRE_INSURANCE",
      "LAND_TEARDOWN",
    ]);
    expect(WORK_LEVEL_LABEL.LIGHT_COSMETIC).toBe("Light cosmetic");
    expect(WORK_LEVEL_LABEL.LAND_TEARDOWN).toBe("Land / teardown");
  });

  it("filters buy-box multi-select", () => {
    expect(parseWorkLevels(["MEDIUM", "HEAVY", "nope"])).toEqual(["MEDIUM", "HEAVY"]);
    expect(parseWorkLevel("FIRE_INSURANCE")).toBe("FIRE_INSURANCE");
    expect(parseWorkLevel("")).toBe("MEDIUM");
  });
});

describe("needs work punch list", () => {
  it("keeps Roof and Foundation", () => {
    expect(parseNeedsWork(["Roof", "Foundation", "Aliens"])).toEqual(["Roof", "Foundation"]);
    expect(needsWorkJson(["Roof"])).toBe('["Roof"]');
  });
});
