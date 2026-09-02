import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/queries";
import { sendBlastAction } from "@/lib/actions";
import { acceptOfferAction, counterOfferAction, markSellerOffersSeenAction } from "@/lib/deal-actions";
import { SellerNav } from "@/components/Nav";
import { SellerListingRow } from "@/components/SellerListingRow";
import { bidVsAsking } from "@/lib/bid-tone";
import { isoDay, offerCardStatus } from "@/lib/offer-status";
import { minOfferPrice } from "@/lib/offer-floor";
import { usd } from "@/lib/money";
import { formatSlot } from "@/lib/dates";

export const dynamic = "force-dynamic";

function sellerTab(raw: string | undefined) {
  if (raw === "offers" || raw === "title" || raw === "billing") return raw;
  return "listings";
}

function closeDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function SellerHome({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");
  const tab = sellerTab((await searchParams).tab);
  const sellerId = user.role === "ADMIN" ? "user_seller" : user.id;
  if (tab === "offers") await markSellerOffersSeenAction();
  const { listings, meter, blasts, platformDeposit, levers, stats } = await getSellerDashboard(
    sellerId,
  );
  const incoming = listings.flatMap((listing) =>
    listing.offers.map((offer) => ({ listing, offer })),
  );
  const appointments = listings.flatMap((listing) =>
    listing.titleSlots.map((slot) => ({ listing, slot })),
  );
  const active = listings.filter((l) => l.status === "ACTIVE");
  const free = listings.filter((l) => l.status === "ON_HOLD" || l.status === "UNDER_CONTRACT");

  return (
    <div className="min-h-svh flex flex-col dash-page">
      <main className="flex-1 px-4 pb-6 space-y-2 pt-2">
        <p className="stat-row">
          <span>
            For sale <b>{stats.forSale}</b>
          </span>
          <span>
            On hold/pending <b>{stats.parked}</b>
          </span>
          <span>
            Open offers <b>{stats.openOffers}</b>
          </span>
          <span>
            Sold <b>{stats.sold}</b>
          </span>
          <span>
            Next expiry{" "}
            <b>{stats.nextExpiry ? closeDay(stats.nextExpiry) : "—"}</b>
          </span>
        </p>
        {tab === "listings" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight">Listings</p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/seller/new" className="btn-secondary w-auto px-3 py-1.5 text-sm">
                  New listing
                </Link>
                <details className="blast-menu relative">
                  <summary className="btn-secondary w-auto px-3 py-1.5 text-sm cursor-pointer">
                    Blast
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-[min(100vw-2rem,360px)] card p-3 space-y-2">
                    <form action={sendBlastAction} className="space-y-2">
                      <select name="listingId" defaultValue={listings[0]?.id ?? ""}>
                        {listings.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.address}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="message"
                        rows={2}
                        placeholder="A/B buyers in the box — 1847 just hit a 2-hour hold."
                      />
                      <button className="btn-primary" type="submit">
                        Send blast
                      </button>
                    </form>
                    {blasts.map((b) => (
                      <p key={b.id} className="text-xs text-muted">
                        {b.createdAt.toLocaleString()} · {b.message}
                      </p>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="card p-4">
                <p className="font-semibold">No listings yet</p>
                <p className="text-sm text-muted mt-1">Publish one to show it on the board.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="board-table listings-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Address</th>
                      <th>Contract</th>
                      <th>Asking</th>
                      <th>Status</th>
                      <th>Floor</th>
                      <th>Deposit</th>
                      <th>Activity</th>
                      <th>Verified</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <SellerListingRow
                        key={listing.id}
                        listing={listing}
                        platformDeposit={platformDeposit}
                        maxFloor={levers.defaultOfferFloorPct}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === "offers" ? (
          incoming.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">No incoming bids</p>
              <p className="text-sm text-muted mt-1">Offers land here when a buyer bids.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Asking</th>
                    <th>Bid</th>
                    <th>%</th>
                    <th>Vs asking</th>
                    <th>Close</th>
                    <th>Buyer</th>
                    <th>POF / status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map(({ listing, offer }) => {
                    const vs = bidVsAsking(offer.price, listing.assignmentPrice, listing.offerFloorPct);
                    const vsCopy =
                      vs.delta === 0
                        ? `${usd(0)} even`
                        : vs.delta > 0
                          ? `${usd(vs.delta)} over`
                          : `${usd(-vs.delta)} under`;
                    return (
                      <tr key={offer.id} className={`offer-bid-row tone-${vs.tone}`}>
                        <td>
                          <Link href={`/listings/${listing.id}`} className="font-semibold">
                            {listing.address}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap">{usd(listing.assignmentPrice)}</td>
                        <td className="whitespace-nowrap font-semibold">{usd(offer.price)}</td>
                        <td className="whitespace-nowrap">
                          <span className={`bid-pct ${vs.tone}`}>{vs.pct}%</span>
                        </td>
                        <td className="whitespace-nowrap">{vsCopy}</td>
                        <td className="whitespace-nowrap">{closeDay(offer.closeDate)}</td>
                        <td className="whitespace-nowrap">{offer.buyer.name}</td>
                        <td className="whitespace-nowrap text-sm text-muted">
                          {offer.pofAttached ? "POF" : "No POF"}
                          {" · "}
                          {offerCardStatus(offer)}
                        </td>
                        <td>
                          {offer.status === "PENDING" ? (
                            <div className="flex flex-col gap-2 min-w-[220px]">
                              <form action={acceptOfferAction.bind(null, offer.id)}>
                                <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                                  Accept
                                </button>
                              </form>
                              <form action={counterOfferAction} className="space-y-1">
                                <input type="hidden" name="offerId" value={offer.id} />
                                <div className="offer-row">
                                  <label className="field">
                                    Price
                                    <input
                                      name="price"
                                      type="number"
                                      min={minOfferPrice(listing.assignmentPrice, listing.offerFloorPct)}
                                      defaultValue={listing.assignmentPrice}
                                      className="px-2 py-1 text-sm"
                                      required
                                    />
                                  </label>
                                  <label className="field">
                                    Close date
                                    <input
                                      name="closeDate"
                                      type="date"
                                      defaultValue={isoDay(offer.closeDate)}
                                      className="px-2 py-1 text-sm"
                                      required
                                    />
                                  </label>
                                </div>
                                <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                                  Counter
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-sm text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "title" ? (
          appointments.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">No title appointments</p>
              <p className="text-sm text-muted mt-1">Slots show here after a file is opened.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>When</th>
                    <th>Where</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ listing, slot }) => (
                    <tr key={slot.id}>
                      <td>
                        <Link href={`/listings/${listing.id}`} className="font-semibold">
                          {listing.address}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap">{formatSlot(slot.startsAt)}</td>
                      <td>{slot.location}</td>
                      <td className="whitespace-nowrap text-sm text-muted">
                        {slot.selected ? "Selected" : slot.kind}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "billing" ? (
          <>
            <section className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Slot meter</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{usd(meter.monthly)} / mo</p>
              <p className="text-sm text-muted">
                {meter.activeCount} Active · {meter.included} included · {meter.extra} extra at{" "}
                {usd(meter.extraEach)}
              </p>
              <p className="text-xs text-muted mt-2">
                ~{usd(meter.base)}/mo includes 1 Active. Extra Active listings are {usd(meter.extraEach)}.
                On hold and pending are free.
              </p>
            </section>
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((l) => (
                    <tr key={l.id}>
                      <td>{l.address}</td>
                      <td>Active</td>
                      <td>Billed</td>
                    </tr>
                  ))}
                  {free.map((l) => (
                    <tr key={l.id}>
                      <td>{l.address}</td>
                      <td>{l.status === "ON_HOLD" ? "On hold" : "Pending"}</td>
                      <td>Free</td>
                    </tr>
                  ))}
                  {active.length === 0 && free.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-sm text-muted">
                        No listings on the meter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">Buyers stay free. Stripe stays stubbed.</p>
          </>
        ) : null}
      </main>
      <SellerNav />
    </div>
  );
}
