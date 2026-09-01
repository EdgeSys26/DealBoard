import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { displayGradeLabel, getBuyerBoard, letterTone } from "@/lib/queries";
import { toggleLookingAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { DashTabs } from "@/components/DashTabs";
import { compactUsd, usd } from "@/lib/money";
import { BADGE_LABEL, WORK_LEVEL_LABEL, type Letter, type WorkLevel } from "@/lib/types";
import { daysBetween } from "@/lib/geo";
import { formatSlot } from "@/lib/dates";

export const dynamic = "force-dynamic";

const BUYER_TABS = [
  { id: "matches", href: "/home?tab=matches", label: "Matches" },
  { id: "held", href: "/home?tab=held", label: "Held" },
  { id: "offers", href: "/home?tab=offers", label: "Offers" },
  { id: "title", href: "/home?tab=title", label: "Title" },
  { id: "saved", href: "/home?tab=saved", label: "Saved" },
] as const;

type BuyerTab = (typeof BUYER_TABS)[number]["id"];

function buyerTab(raw: string | undefined): BuyerTab {
  if (raw === "held" || raw === "offers" || raw === "title" || raw === "saved") return raw;
  return "matches";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "SELLER") redirect("/seller");
  if (user.role === "ADMIN") redirect("/admin");

  const tab = buyerTab((await searchParams).tab);
  const { box, cards, looking, holds, offers, saved } = await getBuyerBoard(user);
  const titleRows = offers.filter((o) => o.status === "ACCEPTED");

  return (
    <div className="min-h-svh flex flex-col dash-page">
      <TopBar user={user} title={looking ? "Looking" : "Paused"} />
      <DashTabs items={[...BUYER_TABS]} active={tab} />
      <main className="flex-1 px-4 pb-4 space-y-3 pt-3">
        {tab === "matches" ? (
          <>
            <div className="card p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {looking ? "Looking — alerts on" : "Paused — no pushes"}
                </p>
                <p className="text-xs text-muted">
                  {box
                    ? `${box.centerLabel} · ${box.radiusMiles} mi · max ${usd(box.maxAssignmentPrice)}`
                    : "Set a buy box to grade deals"}
                </p>
              </div>
              <form action={toggleLookingAction}>
                <button className="chip" data-on={looking ? "true" : "false"} type="submit">
                  {looking ? "Looking" : "Paused"}
                </button>
              </form>
            </div>

            {user.quietHours ? (
              <p className="text-[11px] text-muted px-1">
                Quiet hours 9pm–7am. Alerts stay in the app until morning.
              </p>
            ) : null}

            {!box ? (
              <Link href="/buy-box" className="card p-5 block">
                <p className="font-semibold">Set your buy box</p>
                <p className="text-sm text-muted mt-1">
                  Four questions. Then we only show A and B range.
                </p>
              </Link>
            ) : null}

            <div className="match-grid">
              {cards.map(({ listing, grade }) => {
                const photos = JSON.parse(listing.photosJson) as string[];
                const days = Math.max(0, daysBetween(new Date(), listing.contractExpiresAt));
                const letter = (grade?.letter ?? "?") as Letter;
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="card overflow-hidden block">
                    <div className="relative h-44 bg-canvas">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                      <span className={`grade-pill ${letterTone(letter)}`}>{displayGradeLabel(letter)}</span>
                      {listing.verified ? (
                        <span className="absolute top-2 right-2 text-[11px] font-bold bg-white/90 px-2 py-1 rounded-full">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold leading-tight">{listing.address}</p>
                        <p className="font-semibold text-accent">{compactUsd(listing.assignmentPrice)}</p>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {listing.city} {listing.zip} · {listing.beds}/{listing.baths} · {listing.sf} sf
                      </p>
                      <p className="text-xs text-muted mt-1">
                        AVM {listing.platformAvm ? usd(listing.platformAvm) : "none"} · {days} days ·{" "}
                        {WORK_LEVEL_LABEL[listing.workLevel as WorkLevel]} ·{" "}
                        {BADGE_LABEL[listing.seller.badge as "GREEN" | "SILVER" | "GOLD"]}
                      </p>
                      {listing.id === "listing_pleasant" ? (
                        <p className="text-xs font-semibold text-accent mt-2">2-hour hold on this card</p>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>

            {cards.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">No A or B deals right now</p>
                <p className="text-sm text-muted mt-1">
                  C and below stay buried. Widen the box or wait for a blast.
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {tab === "held" ? (
          <>
            {holds.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">Nothing on hold</p>
                <p className="text-sm text-muted mt-1">A 2-hour hold from a match lands here.</p>
              </div>
            ) : (
              holds.map((hold) => (
                <Link key={hold.id} href={`/listings/${hold.listingId}`} className="card p-4 block">
                  <p className="font-semibold">{hold.listing.address}</p>
                  <p className="text-sm text-muted">
                    {usd(hold.listing.assignmentPrice)} · until {hold.expiresAt.toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </>
        ) : null}

        {tab === "offers" ? (
          <>
            {offers.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">No offers yet</p>
                <p className="text-sm text-muted mt-1">Bids you place show up in this list.</p>
              </div>
            ) : (
              offers.map((offer) => (
                <Link key={offer.id} href={`/listings/${offer.listingId}`} className="card p-4 block">
                  <p className="font-semibold">{offer.listing.address}</p>
                  <p className="text-sm text-muted">
                    {usd(offer.price)} · deposit {usd(offer.deposit)} · {offer.status.toLowerCase()}
                  </p>
                </Link>
              ))
            )}
          </>
        ) : null}

        {tab === "title" ? (
          <>
            {titleRows.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">No title appointments</p>
                <p className="text-sm text-muted mt-1">
                  Accepted bids open a title card and appointment list here.
                </p>
              </div>
            ) : (
              titleRows.map((offer) => {
                const title = offer.listing.titleFile;
                const slot = title?.slots.find((s) => s.selected);
                return (
                  <article key={offer.id} className="card p-4 space-y-2">
                    <Link href={`/listings/${offer.listingId}`} className="font-semibold">
                      {offer.listing.address}
                    </Link>
                    <p className="text-sm text-muted">
                      {usd(offer.price)} · deposit {usd(offer.deposit)}
                    </p>
                    {title ? (
                      <div className="rounded-xl surface-accent p-3 text-sm space-y-1">
                        <p className="font-semibold">{title.company}</p>
                        <p>File #{title.fileNumber}</p>
                        <p>{usd(title.depositAmount)} to title</p>
                        {slot ? (
                          <p>
                            {formatSlot(slot.startsAt)} · {slot.location}
                          </p>
                        ) : (
                          <p className="text-muted">Pick a slot on the listing.</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">Title card opens after accept.</p>
                    )}
                  </article>
                );
              })
            )}
          </>
        ) : null}

        {tab === "saved" ? (
          <>
            {saved.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">Nothing saved</p>
                <p className="text-sm text-muted mt-1">Favorite a seller from a listing to keep them here.</p>
              </div>
            ) : (
              saved.map((row) => (
                <Link key={row.id} href={`/listings/${row.listingId}`} className="card p-4 block">
                  <p className="font-semibold">{row.listing.address}</p>
                  <p className="text-xs text-muted">
                    {row.kind === "FAVORITE"
                      ? "Favorite seller — their A/B jump the line"
                      : "Don't show"}
                  </p>
                </Link>
              ))
            )}
          </>
        ) : null}
      </main>
      <BuyerNav />
    </div>
  );
}
