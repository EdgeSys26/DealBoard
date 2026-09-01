import { minOfferPrice } from "./offer-floor";

export function bidVsAsking(bid: number, asking: number, floorPct: number) {
  const pct = asking > 0 ? Math.round((bid / asking) * 100) : 0;
  const delta = bid - asking;
  const floor = minOfferPrice(asking, floorPct);
  const tone = bid >= asking ? "green" : bid >= floor ? "yellow" : "red";
  return { pct, delta, floor, tone };
}
