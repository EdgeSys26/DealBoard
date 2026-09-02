import { describe, expect, it } from "vitest";
import { gradeListing, isAlertLetter, isInArea, leftover } from "./grade";
import { NOBLESVILLE_SQUARE } from "./types";
import { minOfferPrice, assertOfferFloor, tightenFloorPct } from "./offer-floor";
import { daysBetween, haversineMiles } from "./geo";
import { listingDaysCopy, listingDaysLeft, listingMatchesStatusFilter, parseSellerStatusFilter } from "./seller-board";
import { citiesIntersectingCircle, cityAllowed, homeCityChips, mergeExcludedCities } from "./area-cities";
import { priceChangeBody } from "./money";

const demoBox = {
  lat: NOBLESVILLE_SQUARE.lat,
  lng: NOBLESVILLE_SQUARE.lng,
  radiusMiles: 8,
  maxAssignmentPrice: 250_000,
  minBeds: 3,
  minSf: null,
  workLevels: ["MEDIUM", "FULL_GUT"] as const,
  maxRehab: null,
};

const pleasant = {
  lat: 40.0442,
  lng: -86.0189,
  assignmentPrice: 189_000,
  platformAvm: 278_000,
  beds: 3,
  baths: 1,
  sf: 1216,
  workLevel: "MEDIUM" as const,
  rehabEstimate: 12_000,
  verified: true,
  sellerBadge: "SILVER" as const,
  hasWalkthrough: true,
  photoCount: 4,
  daysRemaining: 11,
};

const cicero = {
  lat: 40.0498,
  lng: -86.0134,
  assignmentPrice: 241_000,
  platformAvm: 300_000,
  beds: 3,
  baths: 2,
  sf: 1408,
  workLevel: "MEDIUM" as const,
  rehabEstimate: 35_000,
  verified: true,
  sellerBadge: "SILVER" as const,
  hasWalkthrough: true,
  photoCount: 4,
  daysRemaining: 6,
};

const harbour = {
  lat: 40.0701,
  lng: -86.0588,
  assignmentPrice: 319_000,
  platformAvm: 328_000,
  beds: 2,
  baths: 2,
  sf: 1104,
  workLevel: "PAINT_CARPET" as const,
  rehabEstimate: 8_000,
  verified: false,
  sellerBadge: "GREEN" as const,
  hasWalkthrough: false,
  photoCount: 2,
  daysRemaining: 13,
};

describe("Noblesville fixtures", () => {
  it("grades 1847 Pleasant St as A+", () => {
    const g = gradeListing(pleasant, { ...demoBox, workLevels: [...demoBox.workLevels] });
    expect(g.isFit).toBe(true);
    expect(g.letter).toBe("A+");
    expect(g.score).toBeGreaterThanOrEqual(90);
  });

  it("grades 622 Cicero Ave as B", () => {
    const g = gradeListing(cicero, { ...demoBox, workLevels: [...demoBox.workLevels] });
    expect(g.isFit).toBe(true);
    expect(g.letter).toBe("B");
  });

  it("buries 401 Harbour Trees as No fit", () => {
    const g = gradeListing(harbour, { ...demoBox, workLevels: [...demoBox.workLevels] });
    expect(g.isFit).toBe(false);
    expect(g.letter).toBe("NO_FIT");
    expect(g.gateFails.length).toBeGreaterThan(0);
  });

  it("never awards A/A+ without an AVM", () => {
    const g = gradeListing(
      { ...pleasant, platformAvm: null },
      { ...demoBox, workLevels: [...demoBox.workLevels] },
    );
    expect(g.letter === "A+" || g.letter === "A").toBe(false);
  });

  it("does not use seller ARV in leftover math", () => {
    const math = leftover(278_000, 189_000, 12_000);
    expect(math).toBe(77_000);
  });
});

describe("calendar days", () => {
  it("counts 11 days from Aug 30 to Sep 10", () => {
    expect(
      daysBetween(new Date("2026-08-30T20:00:00Z"), new Date("2026-09-10T21:00:00Z")),
    ).toBe(11);
  });

  it("never shows negative days left", () => {
    const now = new Date("2026-09-02T16:00:00Z");
    const past = new Date("2026-08-01T17:00:00-04:00");
    expect(listingDaysLeft(past, now)).toBe(0);
    expect(listingDaysCopy(past, "ASSIGNED", now)).toBe("Expired");
    expect(listingDaysCopy(past, "EXPIRED", now)).toBe("Expired");
    expect(listingDaysCopy(new Date("2026-09-02T17:00:00Z"), "ACTIVE", now)).toBe("0 days left");
  });
});

describe("price change copy", () => {
  it("notifies Price changed · $X", () => {
    expect(priceChangeBody(189_000)).toBe("Price changed · $189,000");
  });
});

describe("seller status filters", () => {
  it("defaults to All and maps Pending/Sold", () => {
    expect(parseSellerStatusFilter(undefined)).toBe("all");
    expect(listingMatchesStatusFilter("UNDER_CONTRACT", "pending")).toBe(true);
    expect(listingMatchesStatusFilter("ASSIGNED", "sold")).toBe(true);
    expect(listingMatchesStatusFilter("DRAFT", "active")).toBe(false);
  });
});

describe("city chips", () => {
  it("lists cities that intersect the pin + radius", () => {
    const at8 = citiesIntersectingCircle(NOBLESVILLE_SQUARE, 8);
    expect(at8).toContain("Noblesville");
    expect(at8).toContain("Carmel");
    expect(at8).toContain("Westfield");
    expect(at8).not.toContain("Zionsville");
    expect(at8).not.toContain("Indianapolis");
    const at20 = citiesIntersectingCircle(NOBLESVILLE_SQUARE, 20);
    expect(at20).toContain("Zionsville");
    expect(at20).toContain("Fishers");
    expect(at20).toContain("Sheridan");
    expect(at20).toContain("Arcadia");
  });

  it("hides a deselected city and keeps others on by default", () => {
    expect(cityAllowed("Noblesville", [])).toBe(true);
    expect(cityAllowed("Noblesville", ["Noblesville"])).toBe(false);
    expect(mergeExcludedCities([], ["Noblesville", "Carmel"], ["Noblesville"])).toEqual(["Carmel"]);
  });

  it("omits deselected cities from the home chip row", () => {
    expect(homeCityChips(["Noblesville", "Whitestown", "Sheridan"], ["Whitestown", "Sheridan"])).toEqual([
      "Noblesville",
    ]);
  });
});

describe("geo", () => {
  it("places all three fixtures inside an 8-mile Noblesville box", () => {
    for (const p of [pleasant, cicero, harbour]) {
      expect(haversineMiles(NOBLESVILLE_SQUARE, p)).toBeLessThan(8);
    }
  });
});

describe("offer floor", () => {
  it("blocks more than 10% below asking", () => {
    expect(minOfferPrice(189_000)).toBe(170_100);
    expect(assertOfferFloor(170_000, 189_000).ok).toBe(false);
    expect(assertOfferFloor(170_100, 189_000).ok).toBe(true);
    expect(assertOfferFloor(250_000, 189_000).ok).toBe(true);
  });

  it("lets the seller tighten but not loosen the floor", () => {
    expect(tightenFloorPct(10, 5)).toBe(5);
    expect(tightenFloorPct(5, 10)).toBe(5);
  });
});

describe("alerts stay A/B", () => {
  it("never pages C, D, or no-fit", () => {
    expect(isAlertLetter("C")).toBe(false);
    expect(isAlertLetter("D")).toBe(false);
    expect(isAlertLetter("NO_FIT")).toBe(false);
    expect(isAlertLetter("B")).toBe(true);
    expect(isAlertLetter("B", "A_ONLY")).toBe(false);
    expect(isAlertLetter("A")).toBe(true);
    expect(isAlertLetter("A+", "A_ONLY")).toBe(true);
  });
});

describe("all in area", () => {
  it("keeps Harbour inside the 8-mile circle even when it is no-fit", () => {
    expect(isInArea(harbour, demoBox)).toBe(true);
    expect(isInArea({ lat: 41.5, lng: -87.7 }, demoBox)).toBe(false);
  });

  it("puts 355 Mulberry St Zionsville 46077 outside 8 miles and inside 20", () => {
    const zionsville = { lat: 39.9509, lng: -86.2619 };
    expect(isInArea(zionsville, demoBox)).toBe(false);
    expect(isInArea(zionsville, { ...demoBox, radiusMiles: 20 })).toBe(true);
  });
});
