import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAdminData, isFrozenAccount, personStats } from "@/lib/queries";
import { blacklistAction, logoutAction, resolveReportAction } from "@/lib/actions";
import {
  addBillingAdjustmentAction,
  expireListingAdminAction,
  freezeUserAction,
  killListingAdminAction,
  rejectListingAction,
  setBadgeOverrideAction,
  setPlatformLeversAction,
  strikeUserAction,
  unfreezeUserAction,
  verifyListingAction,
} from "@/lib/admin-actions";
import { usd } from "@/lib/money";
import { BADGE_LABEL, STATUS_LABEL, type Badge, type ListingStatus } from "@/lib/types";
import { daysBetween } from "@/lib/geo";

export const dynamic = "force-dynamic";

function adminTab(raw: string | undefined) {
  if (raw === "people" || raw === "listings" || raw === "billing" || raw === "queue") return raw;
  return "dashboard";
}

function peopleWho(raw: string | undefined) {
  if (raw === "sellers" || raw === "frozen" || raw === "blacklisted") return raw;
  return "buyers";
}

function lastSeenCopy(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const PEOPLE_FILTERS = [
  { id: "buyers", label: "Buyers" },
  { id: "sellers", label: "Sellers" },
  { id: "frozen", label: "Frozen" },
  { id: "blacklisted", label: "Blacklisted" },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; who?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/home");
  const params = await searchParams;
  const tab = adminTab(params.tab);
  const who = peopleWho(params.who);
  const {
    reports,
    users,
    listings,
    muteRates,
    fallthroughs,
    levers,
    adjustments,
    sellerBilling,
    tiles,
    soldDeals,
    reviewListings,
  } = await getAdminData();
  const muteAlerts = muteRates.filter((row) => row.alert);
  const openReports = reports.filter((r) => r.status === "OPEN");

  const people = users.filter((u) => {
    if (u.role === "ADMIN") return false;
    const frozen = isFrozenAccount(u);
    if (who === "buyers") return u.role === "BUYER";
    if (who === "sellers") return u.role === "SELLER";
    if (who === "frozen") return frozen;
    return u.blacklisted;
  });

  return (
    <div className="min-h-svh flex flex-col dash-page">
      <main className="flex-1 px-4 pb-8 space-y-2 pt-2">
        {tab === "dashboard" ? (
          <>
            <div className="admin-tiles">
              <section className="admin-tile wide">
                <p className="k">Listings</p>
                <div className="mini">
                  <span>
                    Active <b>{tiles.active}</b>
                  </span>
                  <span>
                    Hold <b>{tiles.hold}</b>
                  </span>
                  <span>
                    Pending <b>{tiles.pending}</b>
                  </span>
                  <span>
                    Sold <b>{tiles.sold}</b>
                  </span>
                </div>
              </section>
              <section className="admin-tile">
                <p className="k">Buyers</p>
                <p className="v">{tiles.buyers}</p>
              </section>
              <section className="admin-tile">
                <p className="k">Sellers</p>
                <p className="v">{tiles.sellers}</p>
              </section>
              <section className="admin-tile">
                <p className="k">Open offers</p>
                <p className="v">{tiles.openOffers}</p>
              </section>
              <section className="admin-tile">
                <p className="k">Expiring ≤3 days</p>
                <p className="v">{tiles.expiring}</p>
              </section>
              <section className="admin-tile wide">
                <p className="k">Queue</p>
                <div className="mini">
                  <span>
                    Reports <b>{tiles.reports}</b>
                  </span>
                  <span>
                    Fall-throughs <b>{tiles.fallThroughs}</b>
                  </span>
                  <span>
                    Mute alerts <b>{tiles.muteAlerts}</b>
                  </span>
                  <span>
                    Review <b>{tiles.review}</b>
                  </span>
                </div>
              </section>
            </div>

            <section className="card px-4 py-3 space-y-2 settings-card">
              <p className="text-sm font-semibold tracking-tight">Settings</p>
              <p className="text-xs text-muted">
                Platform defaults. Title deposit is a dollar amount, not a percent of price.
              </p>
              <form action={setPlatformLeversAction} className="space-y-2">
                <div className="lever-grid">
                  <label className="field">
                    Title deposit
                    <input
                      name="titleDeposit"
                      type="number"
                      min={1}
                      step={100}
                      defaultValue={levers.titleDeposit}
                    />
                  </label>
                  <label className="field">
                    Included Active slots
                    <input
                      name="includedActiveSlots"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={levers.includedActiveSlots}
                    />
                  </label>
                  <label className="field">
                    Extra listing $
                    <input
                      name="extraListingDollars"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={levers.extraListingDollars}
                    />
                  </label>
                  <label className="field">
                    Default offer-floor %
                    <input
                      name="defaultOfferFloorPct"
                      type="number"
                      min={0}
                      max={50}
                      step={1}
                      defaultValue={levers.defaultOfferFloorPct}
                    />
                  </label>
                  <label className="field">
                    On-hold max days
                    <input
                      name="onHoldMaxDays"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={levers.onHoldMaxDays}
                    />
                  </label>
                </div>
                <button className="btn-secondary w-auto px-3 py-1.5 text-sm" type="submit">
                  Save
                </button>
              </form>
            </section>

            <section className="card overflow-x-auto">
              <p className="text-xs font-bold uppercase tracking-wide text-muted px-3 pt-3">
                Sold
              </p>
              {soldDeals.length === 0 ? (
                <p className="text-sm text-muted px-3 py-3">No funded or closed deals yet.</p>
              ) : (
                <table className="board-table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Seller</th>
                      <th>Buyer</th>
                      <th>Price</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldDeals.map((deal) => (
                      <tr key={deal.id}>
                        <td className="font-semibold">{deal.address}</td>
                        <td className="whitespace-nowrap">{deal.sellerName}</td>
                        <td className="whitespace-nowrap">{deal.buyerName}</td>
                        <td className="whitespace-nowrap">{usd(deal.price)}</td>
                        <td className="whitespace-nowrap text-sm text-muted">
                          {deal.closedAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <div className="sold-actions">
                            <Link
                              href={`/listings/${deal.id}`}
                              className="btn-secondary w-auto px-2 py-1 text-xs"
                            >
                              Open
                            </Link>
                            <details className="sold-menu">
                              <summary className="btn-secondary w-auto px-2 py-1 text-xs">
                                Strike
                              </summary>
                              <div className="sold-menu-panel">
                                <form action={strikeUserAction}>
                                  <input type="hidden" name="userId" value={deal.sellerId} />
                                  <input type="hidden" name="reason" value="Sold deal review" />
                                  <button className="btn-secondary" type="submit">
                                    Seller
                                  </button>
                                </form>
                                {deal.buyerId ? (
                                  <form action={strikeUserAction}>
                                    <input type="hidden" name="userId" value={deal.buyerId} />
                                    <input type="hidden" name="reason" value="Sold deal review" />
                                    <button className="btn-secondary" type="submit">
                                      Buyer
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </details>
                            <details className="sold-menu">
                              <summary className="btn-secondary w-auto px-2 py-1 text-xs">
                                Blacklist
                              </summary>
                              <div className="sold-menu-panel">
                                <form action={blacklistAction}>
                                  <input type="hidden" name="userId" value={deal.sellerId} />
                                  <input type="hidden" name="note" value="Sold deal review" />
                                  <button
                                    className="btn-secondary"
                                    type="submit"
                                    disabled={deal.sellerBlocked}
                                  >
                                    Seller
                                  </button>
                                </form>
                                {deal.buyerId ? (
                                  <form action={blacklistAction}>
                                    <input type="hidden" name="userId" value={deal.buyerId} />
                                    <input type="hidden" name="note" value="Sold deal review" />
                                    <button
                                      className="btn-secondary"
                                      type="submit"
                                      disabled={deal.buyerBlocked}
                                    >
                                      Buyer
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </details>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}

        {tab === "people" ? (
          <>
            <div className="flex flex-wrap gap-1">
              {PEOPLE_FILTERS.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin?tab=people&who=${item.id}`}
                  className="chip"
                  data-on={who === item.id ? "true" : "false"}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {people.length === 0 ? (
              <div className="card p-4">
                <p className="font-semibold">No one in this filter</p>
                <p className="text-sm text-muted mt-1">Try another tab.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="board-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Badge</th>
                      <th>Strikes</th>
                      <th>Funded buys</th>
                      <th>Funded sells</th>
                      <th>Fall-throughs</th>
                      <th>Last seen</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((u) => {
                      const frozen = isFrozenAccount(u);
                      const stats = personStats(u);
                      return (
                        <tr key={u.id}>
                          <td>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-[11px] text-muted">
                              {u.email}
                              {u.blacklisted ? " · BLOCKED" : ""}
                              {frozen ? " · FROZEN" : ""}
                            </p>
                          </td>
                          <td className="whitespace-nowrap text-sm">{u.role.toLowerCase()}</td>
                          <td className="whitespace-nowrap text-sm">
                            <form action={setBadgeOverrideAction} className="flex flex-col gap-1 min-w-[120px]">
                              <input type="hidden" name="userId" value={u.id} />
                              <span>
                                {BADGE_LABEL[u.badge as Badge]}
                                {u.badgeOverride ? " · override" : ""}
                              </span>
                              <select name="badge" defaultValue={u.badgeOverride ? u.badge : "AUTO"}>
                                <option value="AUTO">Auto</option>
                                <option value="GREEN">Green</option>
                                <option value="SILVER">Silver</option>
                                <option value="GOLD">Gold</option>
                              </select>
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Set badge
                              </button>
                            </form>
                          </td>
                          <td>{u.strikes.length}</td>
                          <td>{stats.fundedBuys}</td>
                          <td>{stats.fundedSells}</td>
                          <td>{stats.fallThroughs}</td>
                          <td className="whitespace-nowrap text-sm text-muted">
                            {lastSeenCopy(u.lastSeenAt)}
                          </td>
                          <td>
                            <div className="flex flex-col gap-2 min-w-[180px]">
                              {frozen ? (
                                <form action={unfreezeUserAction}>
                                  <input type="hidden" name="userId" value={u.id} />
                                  <button className="btn-secondary" type="submit">
                                    Unfreeze
                                  </button>
                                </form>
                              ) : (
                                <form action={freezeUserAction}>
                                  <input type="hidden" name="userId" value={u.id} />
                                  <button className="btn-secondary" type="submit">
                                    Freeze
                                  </button>
                                </form>
                              )}
                              <form action={blacklistAction} className="space-y-1">
                                <input type="hidden" name="userId" value={u.id} />
                                <input name="note" placeholder="Note" defaultValue={u.blacklistNote ?? ""} />
                                <button className="btn-secondary" type="submit" disabled={u.blacklisted}>
                                  Blacklist
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === "listings" ? (
          listings.length === 0 ? (
            <div className="card p-4">
              <p className="font-semibold">No listings</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Seller</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Days live</th>
                    <th>Offers</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => {
                    const age = Math.max(0, daysBetween(listing.liveStartedAt, new Date()));
                    return (
                      <tr key={listing.id}>
                        <td>
                          <Link href={`/listings/${listing.id}`} className="font-semibold">
                            {listing.address}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap">{listing.seller.name}</td>
                        <td className="whitespace-nowrap text-sm">
                          {STATUS_LABEL[listing.status as ListingStatus]}
                        </td>
                        <td className="whitespace-nowrap text-sm">
                          {listing.verified ? "Verified" : "Unverified"}
                        </td>
                        <td>{age}</td>
                        <td>{listing.offers.length}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {!listing.verified ? (
                              <form action={verifyListingAction}>
                                <input type="hidden" name="listingId" value={listing.id} />
                                <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                  Mark verified
                                </button>
                              </form>
                            ) : null}
                            <form action={expireListingAdminAction.bind(null, listing.id)}>
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Expire
                              </button>
                            </form>
                            <form action={killListingAdminAction.bind(null, listing.id)}>
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Kill
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}

        {tab === "billing" ? (
          <>
            <p className="text-xs text-muted px-1">
              Manual only. No Stripe. Adjustments apply to this month&apos;s total.
            </p>
            {sellerBilling.length === 0 ? (
              <div className="card p-4">
                <p className="font-semibold">No sellers</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <div className="bill-head">
                  <span>Seller</span>
                  <span>Slots</span>
                  <span>Monthly</span>
                  <span>Adj</span>
                  <span>Net</span>
                  <span />
                </div>
                <div className="bill-list">
                  {sellerBilling.map((row) => (
                    <details key={row.seller.id} className="bill-row">
                      <summary>
                        <span className="font-semibold">{row.seller.name}</span>
                        <span className="text-muted">
                          {row.meter.activeCount} Active · {row.meter.included} in
                        </span>
                        <span className="whitespace-nowrap">{usd(row.meter.monthly)}</span>
                        <span className="whitespace-nowrap">
                          {row.adjSum === 0 ? "—" : usd(row.adjSum)}
                        </span>
                        <span className="whitespace-nowrap font-semibold">{usd(row.net)}</span>
                        <span className="bill-chevron">▸</span>
                      </summary>
                      <div className="bill-panel">
                        <form action={addBillingAdjustmentAction}>
                          <input type="hidden" name="sellerId" value={row.seller.id} />
                          <input
                            name="amount"
                            type="number"
                            min={1}
                            step={1}
                            placeholder="$"
                            required
                          />
                          <select name="sign" defaultValue="+">
                            <option value="+">+</option>
                            <option value="-">−</option>
                          </select>
                          <input name="reason" placeholder="Reason" required />
                          <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                            Add
                          </button>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
            <section className="card overflow-x-auto">
              <p className="text-xs font-bold uppercase tracking-wide text-muted px-3 pt-3">
                Adjustment log
              </p>
              {adjustments.length === 0 ? (
                <p className="text-sm text-muted px-3 py-3">No adjustments yet.</p>
              ) : (
                <table className="board-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Seller</th>
                      <th>Amount</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map((adj) => (
                      <tr key={adj.id}>
                        <td className="whitespace-nowrap text-sm text-muted">
                          {adj.createdAt.toLocaleString()}
                        </td>
                        <td>{adj.seller.name}</td>
                        <td className="whitespace-nowrap">{usd(adj.amount)}</td>
                        <td>{adj.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}

        {tab === "queue" ? (
          <section className="card p-4 space-y-3">
            <p className="font-semibold">Review</p>
            <p className="text-xs text-muted">
              Listings awaiting contract review. Approve marks verified. Reject keeps Draft.
            </p>
            {reviewListings.length === 0 ? (
              <p className="text-sm text-muted">No contracts waiting.</p>
            ) : (
              reviewListings.map((listing) => (
                <div key={listing.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <p className="text-sm font-semibold">{listing.address}</p>
                  <p className="text-xs text-muted">
                    {listing.seller.name} · {STATUS_LABEL[listing.status as ListingStatus] ?? listing.status}
                    {listing.contractUploaded ? " · contract uploaded" : " · no contract"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <form action={verifyListingAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                        Approve
                      </button>
                    </form>
                    <form action={rejectListingAction}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
            <p className="font-semibold pt-2">Queue</p>
            <p className="text-xs text-muted">
              Reports, mute-rate alerts (≥5 mutes and ≥40% of engaged), fall-throughs.
            </p>
            {openReports.length === 0 && muteAlerts.length === 0 && fallthroughs.length === 0 ? (
              <p className="text-sm text-muted">Nothing in the queue.</p>
            ) : null}
            {openReports.map((r) => (
              <div key={r.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                <p className="text-sm font-semibold">
                  Report · {r.type} · {r.listing.address}
                </p>
                <p className="text-xs text-muted">
                  {r.reporter.name} · {r.status}
                </p>
                <p className="text-sm mt-1">{r.notes}</p>
                <form action={resolveReportAction.bind(null, r.id)} className="mt-2">
                  <button className="btn-secondary" type="submit">
                    Mark reviewed
                  </button>
                </form>
              </div>
            ))}
            {muteAlerts.map((row) => (
              <p key={row.user.id} className="text-sm border-t border-line pt-3">
                Mute-rate · {row.user.name} · {row.mutedBy} mutes · {(row.rate * 100).toFixed(0)}% of
                engaged. Alert only — not an auto-ban.
              </p>
            ))}
            {fallthroughs.map((o) => (
              <p key={o.id} className="text-sm border-t border-line pt-3">
                Fall-through · {o.listing.address} · {o.buyer.name} accepted {usd(o.price)}. Deposit is
                to title, not us. No deposit recorded in-app.
              </p>
            ))}
          </section>
        ) : null}

        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">
            Log out
          </button>
        </form>
      </main>
    </div>
  );
}
