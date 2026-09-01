import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/queries";
import { sendBlastAction, setListingStatusAction, tightenFloorAction } from "@/lib/actions";
import { acceptOfferAction } from "@/lib/deal-actions";
import { TopBar } from "@/components/TopBar";
import { SellerNav } from "@/components/Nav";
import { DashTabs } from "@/components/DashTabs";
import { ClickRow } from "@/components/ClickRow";
import { usd } from "@/lib/money";
import { formatSlot } from "@/lib/dates";
import { STATUS_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELLER_TABS = [
  { id: "listings", href: "/seller?tab=listings", label: "Listings" },
  { id: "offers", href: "/seller?tab=offers", label: "Offers" },
  { id: "title", href: "/seller?tab=title", label: "Title" },
  { id: "billing", href: "/seller?tab=billing", label: "Billing" },
] as const;

type SellerTab = (typeof SELLER_TABS)[number]["id"];

function sellerTab(raw: string | undefined): SellerTab {
  if (raw === "offers" || raw === "title" || raw === "billing") return raw;
  return "listings";
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
  const { listings, meter, blasts } = await getSellerDashboard(
    user.role === "ADMIN" ? "user_seller" : user.id,
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
      <TopBar user={user} title="Seller board" />
      <DashTabs items={[...SELLER_TABS]} active={tab} />
      <main className="flex-1 px-4 pb-6 space-y-3 pt-3">
        {tab === "listings" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Listings</p>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/seller/new" className="btn-secondary w-auto px-3 py-2 text-sm">
                  New listing
                </Link>
                <details className="blast-menu relative">
                  <summary className="btn-secondary w-auto px-3 py-2 text-sm cursor-pointer">
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
                        rows={3}
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
              <div className="card p-5">
                <p className="font-semibold">No listings yet</p>
                <p className="text-sm text-muted mt-1">Publish one to show it on the board.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="board-table">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Offer floor</th>
                      <th>Activity</th>
                      <th>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <ClickRow key={listing.id} href={`/listings/${listing.id}`}>
                        <td>
                          <Link href={`/listings/${listing.id}`} className="font-semibold">
                            {listing.address}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap">{usd(listing.assignmentPrice)}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {(["ACTIVE", "ON_HOLD", "UNDER_CONTRACT"] as const).map((status) => (
                              <form
                                key={status}
                                action={setListingStatusAction.bind(null, listing.id, status)}
                              >
                                <button
                                  className="chip justify-center px-2 py-1 text-[11px]"
                                  data-on={listing.status === status ? "true" : "false"}
                                  type="submit"
                                >
                                  {STATUS_LABEL[status]}
                                </button>
                              </form>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="floor-copy text-sm">
                              Offer floor: {listing.offerFloorPct}% under
                            </span>
                            <form
                              action={tightenFloorAction.bind(null, listing.id)}
                              className="flex items-center gap-1"
                            >
                              <input
                                name="offerFloorPct"
                                type="number"
                                min={0}
                                max={10}
                                step={1}
                                defaultValue={listing.offerFloorPct}
                                className="w-14 px-2 py-1 text-sm"
                                aria-label="Offer floor percent under"
                              />
                              <button className="btn-secondary w-auto px-2 py-1 text-xs" type="submit">
                                Set
                              </button>
                            </form>
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-sm text-muted">
                          {listing.views} views · {listing.holds.length} holds · {listing.offers.length}{" "}
                          offers
                        </td>
                        <td className="whitespace-nowrap">
                          {listing.verified ? "Verified" : "Unverified"}
                        </td>
                      </ClickRow>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === "offers" ? (
          <>
            {incoming.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">No incoming bids</p>
                <p className="text-sm text-muted mt-1">Offers land here when a buyer bids.</p>
              </div>
            ) : (
              incoming.map(({ listing, offer }) => (
                <article key={offer.id} className="card p-4 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/listings/${listing.id}`} className="font-semibold">
                      {listing.address}
                    </Link>
                    <p className="text-sm text-muted">
                      {usd(offer.price)} · {offer.status.toLowerCase()}
                      {offer.pofAttached ? " · POF" : ""}
                    </p>
                  </div>
                  {offer.status === "PENDING" ? (
                    <form action={acceptOfferAction.bind(null, offer.id)}>
                      <button className="text-accent font-semibold" type="submit">
                        Accept
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            )}
          </>
        ) : null}

        {tab === "title" ? (
          <>
            {appointments.length === 0 ? (
              <div className="card p-5">
                <p className="font-semibold">No title appointments</p>
                <p className="text-sm text-muted mt-1">Slots show here after a file is opened.</p>
              </div>
            ) : (
              appointments.map(({ listing, slot }) => (
                <article key={slot.id} className="card p-4">
                  <Link href={`/listings/${listing.id}`} className="font-semibold">
                    {listing.address}
                  </Link>
                  <p className="text-sm text-muted mt-1">
                    {formatSlot(slot.startsAt)} · {slot.location}
                    {slot.selected ? " · selected" : ""}
                    {slot.kind ? ` · ${slot.kind}` : ""}
                  </p>
                </article>
              ))
            )}
          </>
        ) : null}

        {tab === "billing" ? (
          <>
            <section className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Slot meter</p>
              <p className="text-2xl font-semibold mt-1">{usd(meter.monthly)} / mo</p>
              <p className="text-sm text-muted">
                {meter.activeCount} Active · {meter.included} included · {meter.extra} extra at{" "}
                {usd(meter.extraEach)}
              </p>
              <p className="text-sm mt-2">
                ~{usd(meter.base)}/mo includes 1 Active listing. ~{usd(meter.extraEach)} per extra
                Active listing / month.
              </p>
              <p className="text-xs text-muted mt-2">
                On hold, Pending / under contract, Assigned, and Expired are not billed. Only Active —
                what buyers can still take.
              </p>
            </section>
            <section className="card p-4 space-y-2">
              <p className="font-semibold">Active — billed</p>
              {active.length === 0 ? <p className="text-sm text-muted">None</p> : null}
              {active.map((l) => (
                <p key={l.id} className="text-sm">
                  {l.address}
                </p>
              ))}
            </section>
            <section className="card p-4 space-y-2">
              <p className="font-semibold">On hold / pending — free</p>
              {free.length === 0 ? <p className="text-sm text-muted">None</p> : null}
              {free.map((l) => (
                <p key={l.id} className="text-sm">
                  {l.address} · {l.status === "ON_HOLD" ? "On hold" : "Pending"}
                </p>
              ))}
            </section>
            <p className="text-xs text-muted">
              Buyers stay free forever. No iOS in-app purchases. Stripe stays stubbed.
            </p>
          </>
        ) : null}
      </main>
      <SellerNav />
    </div>
  );
}
