import { describe, expect, it } from "vitest";
import { occupancyChip, parseOccupancy, TRESPASS_NOTICE } from "./occupancy";

describe("occupancy", () => {
  it("normalizes create/edit values", () => {
    expect(parseOccupancy("Owner occupied")).toBe("Owner occupied");
    expect(parseOccupancy("Tenant")).toBe("Tenant");
    expect(parseOccupancy("Vacant")).toBe("Vacant");
    expect(parseOccupancy("Tenant month-to-month")).toBe("Tenant");
    expect(parseOccupancy("occupied")).toBe("Owner occupied");
    expect(parseOccupancy("")).toBe("Vacant");
  });

  it("maps buyer chips", () => {
    expect(occupancyChip("Owner occupied")).toBe("Occupied");
    expect(occupancyChip("Tenant")).toBe("Tenant");
    expect(occupancyChip("Vacant")).toBe("Vacant");
  });

  it("keeps the trespass line", () => {
    expect(TRESPASS_NOTICE).toBe(
      "Listing information is not permission to visit, enter, or contact occupants. Do not trespass.",
    );
  });
});
