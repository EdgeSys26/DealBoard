import { usd } from "./money";

export function offerCardStatus(offer: {
  status: string;
  price: number;
  counterPrice?: number | null;
}) {
  if (offer.status === "PENDING") return "Offer sent";
  if (offer.status === "COUNTERED") {
    return `Pending counter · ${usd(offer.counterPrice ?? offer.price)}`;
  }
  if (offer.status === "ACCEPTED") return "Accepted";
  if (offer.status === "DECLINED" || offer.status === "REJECTED") return "Declined";
  if (offer.status === "EXPIRED") return "Expired";
  return offer.status;
}

export function offerCardTone(offer: { status: string }) {
  if (offer.status === "PENDING") return "sent";
  if (offer.status === "COUNTERED") return "counter";
  if (offer.status === "ACCEPTED") return "accepted";
  if (offer.status === "DECLINED" || offer.status === "REJECTED" || offer.status === "EXPIRED") {
    return "closed";
  }
  return "sent";
}

export function isoDay(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
