import { describe, expect, it } from "vitest";
import { citiesIntersectingCircle } from "./area-cities";
import { resolveBuyBoxPin } from "./geo-pins";
import { NOBLESVILLE_SQUARE } from "./types";

describe("resolveBuyBoxPin", () => {
  it("pins a zip to that zip's city, not Noblesville", () => {
    const zionsville = resolveBuyBoxPin({ zip: "46077" });
    expect(zionsville.matched).toBe(true);
    expect(zionsville.label).toBe("Zionsville");
    expect(zionsville.lat).not.toBe(NOBLESVILLE_SQUARE.lat);
    expect(zionsville.lng).not.toBe(NOBLESVILLE_SQUARE.lng);

    const at8 = citiesIntersectingCircle(zionsville, 8);
    const noblesville8 = citiesIntersectingCircle(NOBLESVILLE_SQUARE, 8);
    expect(at8).toContain("Zionsville");
    expect(at8).toContain("Whitestown");
    expect(at8).not.toContain("Cicero");
    expect(at8).not.toContain("Arcadia");
    expect(at8).not.toEqual(noblesville8);

    const at20 = citiesIntersectingCircle(zionsville, 20);
    expect(at20).toContain("Avon");
    expect(at20).toContain("Brownsburg");
    expect(at20).toContain("Lebanon");
    expect(citiesIntersectingCircle(NOBLESVILLE_SQUARE, 20)).not.toContain("Avon");
  });

  it("moves Indianapolis 46250 off the 46060 city set", () => {
    const noblesville = citiesIntersectingCircle(NOBLESVILLE_SQUARE, 8);
    const castleton = resolveBuyBoxPin({ zip: "46250" });
    const cities = citiesIntersectingCircle(castleton, 8);
    expect(castleton.label).toBe("Indianapolis");
    expect(cities).toContain("Indianapolis");
    expect(cities).toContain("Fishers");
    expect(cities).toContain("McCordsville");
    expect(cities).not.toEqual(noblesville);
    expect(cities).not.toContain("Cicero");
    expect(cities).not.toContain("Arcadia");
  });

  it("resolves a city name typed in the pin field", () => {
    const pin = resolveBuyBoxPin({ centerLabel: "Carmel", zip: "" });
    expect(pin.matched).toBe(true);
    expect(pin.zip).toBe("46032");
    expect(citiesIntersectingCircle(pin, 8)).toContain("Carmel");
  });
});
