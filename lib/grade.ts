import { clamp, haversineMiles } from "./geo";
import type {
  Badge,
  BuyBoxInput,
  GradeBars,
  GradeResult,
  Letter,
  ListingGradeInput,
  WorkLevel,
} from "./types";

export const BAR_WEIGHTS = {
  discount: 0.35,
  rehab: 0.2,
  layout: 0.15,
  trust: 0.2,
  time: 0.1,
} as const;

export function scoreDiscount(
  assignment: number,
  avm: number | null,
): number {
  if (!avm || avm <= 0) return 0;
  const pct = (avm - assignment) / avm;
  return clamp((pct / 0.32) * 100, 0, 100);
}

export function scoreRehab(rehabEstimate: number, avm: number | null): number {
  if (!avm || avm <= 0) return 50;
  const ratio = rehabEstimate / avm;
  return clamp(100 - (ratio / 0.22) * 100, 0, 100);
}

export function scoreLayout(beds: number, baths: number, sf: number): number {
  let score = 38;
  if (beds >= 3) score += 22;
  else if (beds >= 2) score += 10;
  if (baths >= 2) score += 22;
  else if (baths >= 1.5) score += 12;
  else if (baths >= 1) score += 4;
  if (sf >= 1400) score += 18;
  else if (sf >= 1200) score += 14;
  else if (sf >= 1000) score += 8;
  return clamp(score, 0, 100);
}

export function scoreTrust(input: {
  verified: boolean;
  sellerBadge: Badge;
  hasWalkthrough: boolean;
  photoCount: number;
}): number {
  let score = 16;
  if (input.verified) score += 30;
  if (input.sellerBadge === "GOLD") score += 28;
  else if (input.sellerBadge === "SILVER") score += 22;
  else score += 8;
  if (input.hasWalkthrough) score += 18;
  score += Math.min(14, input.photoCount * 3);
  return clamp(score, 0, 100);
}

export function scoreTime(daysRemaining: number): number {
  return clamp(20 + (daysRemaining / 14) * 80, 20, 100);
}

export function letterFromScore(score: number, hasAvm: boolean): Letter {
  if (score >= 90) return hasAvm ? "A+" : "B";
  if (score >= 80) return hasAvm ? "A" : "B";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function isWorkCompatible(
  listingLevel: WorkLevel,
  buyerLevels: WorkLevel[],
): boolean {
  return buyerLevels.includes(listingLevel);
}

export function gradeListing(
  listing: ListingGradeInput,
  box: BuyBoxInput,
): GradeResult {
  const gateFails: string[] = [];
  const miles = haversineMiles(box, listing);
  if (miles > box.radiusMiles + 0.05) {
    gateFails.push("Outside buy-box radius");
  }
  if (listing.assignmentPrice > box.maxAssignmentPrice) {
    gateFails.push("Assignment above max price");
  }
  if (box.minBeds != null && listing.beds < box.minBeds) {
    gateFails.push("Below minimum beds");
  }
  if (box.minSf != null && listing.sf < box.minSf) {
    gateFails.push("Below minimum square feet");
  }
  if (!isWorkCompatible(listing.workLevel, box.workLevels)) {
    gateFails.push("Work not a match");
  }
  if (box.maxRehab != null && listing.rehabEstimate > box.maxRehab) {
    gateFails.push("Rehab above max");
  }

  const hasAvm = listing.platformAvm != null && listing.platformAvm > 0;
  const bars: GradeBars = {
    discount: scoreDiscount(listing.assignmentPrice, listing.platformAvm),
    rehab: scoreRehab(listing.rehabEstimate, listing.platformAvm),
    layout: scoreLayout(listing.beds, listing.baths, listing.sf),
    trust: scoreTrust(listing),
    time: scoreTime(listing.daysRemaining),
  };

  const score =
    bars.discount * BAR_WEIGHTS.discount +
    bars.rehab * BAR_WEIGHTS.rehab +
    bars.layout * BAR_WEIGHTS.layout +
    bars.trust * BAR_WEIGHTS.trust +
    bars.time * BAR_WEIGHTS.time;

  if (gateFails.length > 0) {
    return {
      letter: "NO_FIT",
      score: Math.round(score * 10) / 10,
      isFit: false,
      bars,
      gateFails,
      hasAvm,
    };
  }

  return {
    letter: letterFromScore(score, hasAvm),
    score: Math.round(score * 10) / 10,
    isFit: true,
    bars,
    gateFails,
    hasAvm,
  };
}

export function leftover(
  avm: number | null,
  offer: number,
  rehabGuess: number,
): number | null {
  if (avm == null) return null;
  return avm - offer - rehabGuess;
}

export function isHomeVisible(letter: Letter): boolean {
  return letter === "A+" || letter === "A" || letter === "B";
}

export function isInArea(
  listing: { lat: number; lng: number },
  box: { lat: number; lng: number; radiusMiles: number },
): boolean {
  return haversineMiles(box, listing) <= box.radiusMiles + 0.05;
}

/** Pushes page A/B (or A only). Never C, D, or no-fit. */
export function isAlertLetter(letter: Letter, alertMode = "A_AND_B"): boolean {
  if (alertMode === "APP_ONLY") return false;
  if (letter === "A+" || letter === "A") return true;
  if (letter === "B") return alertMode !== "A_ONLY";
  return false;
}
