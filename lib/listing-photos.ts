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
export const PHOTO_ZIONSVILLE =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_FISHERS =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_CARMEL =
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_WESTFIELD =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_WHITESTOWN =
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_CICERO_TOWN =
  "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_ARCADIA =
  "https://images.unsplash.com/photo-1572120360619-cc6ba87be411?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_MCCORDSVILLE =
  "https://images.unsplash.com/photo-1502005097973-6a708234d4fb?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_FORTVILLE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_CASTLETON =
  "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1600&q=80";
export const PHOTO_SHERIDAN =
  "https://images.unsplash.com/photo-1600047509358-9dc8cefa3706?auto=format&fit=crop&w=1600&q=80";

const BY_NEEDLE: [string, string[]][] = [
  ["Pleasant St", [PHOTO_PLEASANT]],
  ["Cicero Ave", [PHOTO_CICERO]],
  ["Patriots Landing", [PHOTO_PATRIOTS]],
  ["Harbour Trees", [PHOTO_HARBOUR]],
  ["Persistence Ave", [PHOTO_PERSISTENCE]],
  ["Mulberry St", [PHOTO_ZIONSVILLE]],
  ["Lantern Rd", [PHOTO_FISHERS]],
  ["Ridgeway Dr", [PHOTO_CARMEL]],
  ["Oak Ridge Rd", [PHOTO_WESTFIELD]],
  ["S 700 E", [PHOTO_WHITESTOWN]],
  ["W Jackson St", [PHOTO_CICERO_TOWN]],
  ["E Main St", [PHOTO_ARCADIA]],
  ["N 600 W", [PHOTO_MCCORDSVILLE]],
  ["School St", [PHOTO_FORTVILLE]],
  ["N Shadeland Ave", [PHOTO_CASTLETON]],
  ["E 2nd St", [PHOTO_SHERIDAN]],
];

const BY_ID: Record<string, string[]> = {
  listing_pleasant: [PHOTO_PLEASANT],
  listing_cicero: [PHOTO_CICERO],
  listing_harbour: [PHOTO_HARBOUR],
  listing_patriots: [PHOTO_PATRIOTS],
  listing_persistence: [PHOTO_PERSISTENCE],
  listing_zionsville: [PHOTO_ZIONSVILLE],
  listing_fishers: [PHOTO_FISHERS],
  listing_carmel: [PHOTO_CARMEL],
  listing_westfield: [PHOTO_WESTFIELD],
  listing_whitestown: [PHOTO_WHITESTOWN],
  listing_cicero_town: [PHOTO_CICERO_TOWN],
  listing_arcadia: [PHOTO_ARCADIA],
  listing_mccordsville: [PHOTO_MCCORDSVILLE],
  listing_fortville: [PHOTO_FORTVILLE],
  listing_castleton: [PHOTO_CASTLETON],
  listing_sheridan: [PHOTO_SHERIDAN],
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

const SEED_PHOTOS: Record<string, string[]> = {
  pleasant: [PHOTO_PLEASANT],
  cicero: [PHOTO_CICERO],
  harbour: [PHOTO_HARBOUR],
  patriots: [PHOTO_PATRIOTS],
  persistence: [PHOTO_PERSISTENCE],
  zionsville: [PHOTO_ZIONSVILLE],
  fishers: [PHOTO_FISHERS],
  carmel: [PHOTO_CARMEL],
  westfield: [PHOTO_WESTFIELD],
  whitestown: [PHOTO_WHITESTOWN],
  cicero_town: [PHOTO_CICERO_TOWN],
  arcadia: [PHOTO_ARCADIA],
  mccordsville: [PHOTO_MCCORDSVILLE],
  fortville: [PHOTO_FORTVILLE],
  castleton: [PHOTO_CASTLETON],
  sheridan: [PHOTO_SHERIDAN],
};

export function photosForSeed(kind: string): string[] {
  return SEED_PHOTOS[kind] ?? [PHOTO_NEW];
}

export { BY_NEEDLE as PHOTO_NEEDLES };
