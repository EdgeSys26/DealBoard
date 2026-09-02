import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { displayGradeLabel, getBuyerBoard, letterTone } from "@/lib/queries";
import { saveBuyBoxAction, toggleLookingAction } from "@/lib/actions";
import {
  acceptCounterAction,
  declineCounterAction,
  hideListingAction,
  unhideListingAction,
} from "@/lib/deal-actions";
import { BuyerNav } from "@/components/Nav";
import { SaveStar } from "@/components/SaveStar";
import { listingPhotos } from "@/lib/listing-photos";
import { compactUsd, usd } from "@/lib/money";
import { offerCardStatus } from "@/lib/offer-status";
import {
  BADGE_LABEL,
  NOBLESVILLE_SQUARE,
  WORK_LEVEL_LABEL,
  type Letter,
  type WorkLevel,
} from "@/lib/types";
import { daysBetween } from "@/lib/geo";
import { formatSlot } from "@/lib/dates";

export const dynamic = "force-dynamic";

function buyerTab(raw: string | undefined) {
  if (raw === "held" || raw === "offers" || raw === "title" || raw === "saved" || raw === "hidden") {
    return raw;
  }
  return "matches";
}

function closeDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; pane?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "SELLER") redirect("/seller");
  if (user.role === "ADMIN") redirect("/admin");

  const params = await searchParams;
  const tab = buyerTab(params.tab);
  const { box, cards, looking, holds, offers, saved, savedSellers, hidden } = await getBuyerBoard(user);
  const savedPane = params.pane === "sellers" ? "sellers" : "listings";
  const titleRows = offers.filter((o) => o.status === "ACCEPTED");

  return (
    <div className="min-h-svh flex flex-col dash-page">
      <main className="flex-1 px-4 pb-4 space-y-2 pt-2">
        {tab === "matches" ? (
          <>
            <div className="card matches-head-card">
              <div className="matches-head">
                <div className="active-row">
                  <span className="text-sm font-semibold tracking-tight">Active</span>
                  <form action={toggleLookingAction}>
                    <button
                      className="active-switch"
                      data-on={looking ? "true" : "false"}
                      type="submit"
                      aria-pressed={looking}
                      aria-label={looking ? "Active, alerts on" : "Paused, no alerts"}
                    >
                      <span className="active-knob" />
                    </button>
                  </form>
                </div>
                <details className="filters-menu">
                  <summary className="chip">Filters</summary>
                  <form action={saveBuyBoxAction} className="filters-form">
                    {box?.maxRehab != null ? (
                      <input type="hidden" name="maxRehab" value={box.maxRehab} />
                    ) : null}
                    <label className="field">
                      Pin or zip
                      <input
                        name="centerLabel"
                        defaultValue={box?.centerLabel ?? NOBLESVILLE_SQUARE.label}
                      />
                    </label>
                    <label className="field">
                      Zip
                      <input name="zip" defaultValue={box?.zip ?? NOBLESVILLE_SQUARE.zip} />
                    </label>
                    <label className="field">
                      Radius (mi)
                      <input
                        name="radiusMiles"
                        type="number"
                        step="0.5"
                        defaultValue={box?.radiusMiles ?? 8}
                      />
                    </label>
                    <label className="field">
                      Max price
                      <input
                        name="maxAssignmentPrice"
                        type="number"
                        defaultValue={box?.maxAssignmentPrice ?? 250000}
                      />
                    </label>
                    <label className="field">
                      Min beds
                      <input name="minBeds" type="number" defaultValue={box?.minBeds ?? ""} />
                    </label>
                    <label className="field">
                      Min sqft
                      <input name="minSf" type="number" defaultValue={box?.minSf ?? ""} />
                    </label>
                    <fieldset className="filters-work">
                      <legend>Work level</legend>
                      {(
                        [
                          ["TURNKEY", "Turnkey"],
                          ["PAINT_CARPET", "Paint & carpet"],
                          ["MEDIUM", "Medium"],
                          ["FULL_GUT", "Full gut"],
                        ] as const
                      ).map(([value, label]) => (
                        <label key={value}>
                          <input
                            type="checkbox"
                            name="workLevels"
                            value={value}
                            defaultChecked={(box
                              ? (JSON.parse(box.workLevels) as string[])
                              : ["MEDIUM", "FULL_GUT"]
                            ).includes(value)}
                          />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <label className="field">
                      Alerts
                      <select
                        name="alertMode"
                        defaultValue={box?.alertMode === "A_ONLY" ? "A_ONLY" : "A_AND_B"}
                      >
                        <option value="A_AND_B">A / B</option>
                        <option value="A_ONLY">A only</option>
                      </select>
                    </label>
                    <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                      Save
                    </button>
                  </form>
                </details>
              </div>
            </div>

            {user.quietHours ? (
              <p className="text-[11px] text-muted px-1">
                Quiet hours 9pm–7am. Alerts stay in the app until morning.
              </p>
            ) : null}

            <div className="match-grid">
              {cards.map(({ listing, grade, offer, saved: listingSaved }) => {
                const photos = listingPhotos(listing);
                const days = Math.max(0, daysBetween(new Date(), listing.contractExpiresAt));
                const letter = (grade?.letter ?? "?") as Letter;
                return (
                  <article key={listing.id} className="card overflow-hidden">
                    <Link href={`/listings/${listing.id}`} className="block">
                      <div className="relative h-40 bg-canvas">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                        <span className={`grade-pill ${letterTone(letter)}`}>{displayGradeLabel(letter)}</span>
                        {listing.verified ? (
                          <span className="absolute top-2 right-2 text-[11px] font-bold bg-white/90 px-2 py-1 rounded-full">
                            Verified
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    <div className="px-3 pt-3">
                      <div className="flex justify-between gap-2">
                        <Link href={`/listings/${listing.id}`} className="font-semibold tracking-tight leading-tight">
                          {listing.address}
                        </Link>
                        <p className="price-with-star">
                          <Link href={`/listings/${listing.id}`} className="font-semibold text-accent">
                            {compactUsd(listing.assignmentPrice)}
                          </Link>
                          <SaveStar listingId={listing.id} saved={listingSaved} />
                        </p>
                      </div>
                      <Link href={`/listings/${listing.id}`} className="block">
                        <p className="text-xs text-muted mt-1">
                          {listing.city} {listing.zip} · {listing.beds}/{listing.baths} · {listing.sf} sf ·{" "}
                          {WORK_LEVEL_LABEL[listing.workLevel as WorkLevel]} ·{" "}
                          {BADGE_LABEL[listing.seller.badge as "GREEN" | "SILVER" | "GOLD"]}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          AVM {listing.platformAvm ? usd(listing.platformAvm) : "none"} · {days} days
                        </p>
                        {offer ? (
                          <p className="text-xs font-semibold mt-1">{offerCardStatus(offer)}</p>
                        ) : null}
                        {listing.id === "listing_pleasant" && !offer ? (
                          <p className="text-xs font-semibold text-accent mt-1">2-hour hold on this card</p>
                        ) : null}
                      </Link>
                    </div>
                    <form action={hideListingAction.bind(null, listing.id)} className="px-3 pb-3 pt-2">
                      <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                        Hide
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>

            {cards.length === 0 ? (
              <div className="card p-4">
                <p className="font-semibold">No A or B deals right now</p>
                <p className="text-sm text-muted mt-1">C and below stay buried. Widen the box or wait for a blast.</p>
              </div>
            ) : null}
          </>
        ) : null}

        {tab === "held" ? (
          holds.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">Nothing on hold</p>
              <p className="text-sm text-muted mt-1">A 2-hour hold from a match lands here.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Price</th>
                    <th>Hold until</th>
                  </tr>
                </thead>
                <tbody>
                  {holds.map((hold) => (
                    <tr key={hold.id}>
                      <td>
                        <Link href={`/listings/${hold.listingId}`} className="font-semibold">
                          {hold.listing.address}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">{usd(hold.listing.assignmentPrice)}</td>
                      <td className="whitespace-nowrap text-sm text-muted">
                        {hold.expiresAt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "offers" ? (
          offers.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">No offers yet</p>
              <p className="text-sm text-muted mt-1">Bids you place show up in this list.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Price</th>
                    <th>Close</th>
                    <th>Deposit</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td>
                        <Link href={`/listings/${offer.listingId}`} className="font-semibold">
                          {offer.listing.address}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">{usd(offer.counterPrice ?? offer.price)}</td>
                      <td className="whitespace-nowrap">
                        {closeDay(offer.counterCloseDate ?? offer.closeDate)}
                      </td>
                      <td className="whitespace-nowrap text-sm">{usd(offer.deposit)}</td>
                      <td className="whitespace-nowrap text-sm font-semibold">{offerCardStatus(offer)}</td>
                      <td>
                        {offer.status === "COUNTERED" ? (
                          <div className="flex flex-wrap gap-1">
                            <form action={acceptCounterAction.bind(null, offer.id)}>
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Accept
                              </button>
                            </form>
                            <form action={declineCounterAction.bind(null, offer.id)}>
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Decline
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-sm text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "title" ? (
          titleRows.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">No title appointments</p>
              <p className="text-sm text-muted mt-1">Accepted bids open a title card here.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Price</th>
                    <th>Deposit</th>
                    <th>Appointment</th>
                  </tr>
                </thead>
                <tbody>
                  {titleRows.map((offer) => {
                    const title = offer.listing.titleFile;
                    const slot = title?.slots.find((s) => s.selected);
                    return (
                      <tr key={offer.id}>
                        <td>
                          <Link href={`/listings/${offer.listingId}`} className="font-semibold">
                            {offer.listing.address}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap">{usd(offer.price)}</td>
                        <td className="whitespace-nowrap">{usd(offer.deposit)}</td>
                        <td className="text-sm text-muted">
                          {slot
                            ? `${formatSlot(slot.startsAt)} · ${slot.location}`
                            : title
                              ? `${title.company} · pick a slot`
                              : "Title card after accept"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "saved" ? (
          <>
            <div className="flex flex-wrap gap-1">
              <Link
                href="/home?tab=saved"
                className="chip"
                data-on={savedPane === "listings" ? "true" : "false"}
              >
                Listings
              </Link>
              <Link
                href="/home?tab=saved&pane=sellers"
                className="chip"
                data-on={savedPane === "sellers" ? "true" : "false"}
              >
                Sellers
              </Link>
            </div>
            {savedPane === "listings" ? (
              saved.length === 0 ? (
                <div className="card p-4">
                  <p className="font-semibold">No saved listings</p>
                  <p className="text-sm text-muted mt-1">
                    Star a listing next to the price to keep it here.
                  </p>
                </div>
              ) : (
                <div className="card overflow-x-auto">
                  <table className="board-table">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saved.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <Link href={`/listings/${row.listingId}`} className="font-semibold">
                              {row.listing.address}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap">{usd(row.listing.assignmentPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : savedSellers.length === 0 ? (
              <div className="card p-4">
                <p className="font-semibold">No saved sellers</p>
                <p className="text-sm text-muted mt-1">Favorite a seller from a listing to keep them here.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="board-table">
                  <thead>
                    <tr>
                      <th>Seller</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedSellers.map((row) => (
                      <tr key={row.sellerId}>
                        <td className="font-semibold">{row.name}</td>
                        <td>
                          <Link href={`/listings/${row.listingId}`} className="text-sm text-accent font-semibold">
                            Open listing
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === "hidden" ? (
          hidden.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">Nothing hidden</p>
              <p className="text-sm text-muted mt-1">Hide a match to park it here. It leaves Matches and stops alerts.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {hidden.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/listings/${row.listingId}`} className="font-semibold">
                          {row.listing.address}
                        </Link>
                      </td>
                      <td>
                        <form action={unhideListingAction.bind(null, row.listingId)}>
                          <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                            Unhide
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </main>
      <BuyerNav />
    </div>
  );
}
