export const PHOTO_PLEASANT =
  "https://images.unsplash.com/photo-1592595896551-12b371d546d5?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_CICERO =
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_PATRIOTS =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_HARBOUR =
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_NEW =
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_PERSISTENCE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80";

const BY_NEEDLE: [string, string[]][] = [
  ["Pleasant St", [PHOTO_PLEASANT]],
  ["Cicero Ave", [PHOTO_CICERO]],
  ["Patriots Landing", [PHOTO_PATRIOTS]],
  ["Harbour Trees", [PHOTO_HARBOUR]],
  ["Persistence Ave", [PHOTO_PERSISTENCE]],
];

const BY_ID: Record<string, string[]> = {
  listing_pleasant: [PHOTO_PLEASANT],
  listing_cicero: [PHOTO_CICERO],
  listing_harbour: [PHOTO_HARBOUR],
  listing_patriots: [PHOTO_PATRIOTS],
  listing_persistence: [PHOTO_PERSISTENCE],
};

export function listingPhotos(listing: { id: string; address: string; photosJson: string }): string[] {
  const byAddress = BY_NEEDLE.find(([needle]) => listing.address.includes(needle));
  if (byAddress) return byAddress[1];
  if (BY_ID[listing.id]) return BY_ID[listing.id];
  try {
    const parsed = JSON.parse(listing.photosJson) as string[];
    if (parsed.length && !parsed.some((p) => p.endsWith(".svg"))) return parsed;
  } catch {
    // fall through
  }
  return [PHOTO_NEW];
}

export function photosForSeed(
  kind: "pleasant" | "cicero" | "harbour" | "patriots" | "persistence",
): string[] {
  if (kind === "pleasant") return [PHOTO_PLEASANT];
  if (kind === "cicero") return [PHOTO_CICERO];
  if (kind === "patriots") return [PHOTO_PATRIOTS];
  if (kind === "persistence") return [PHOTO_PERSISTENCE];
  return [PHOTO_HARBOUR];
}

export { BY_NEEDLE as PHOTO_NEEDLES };
