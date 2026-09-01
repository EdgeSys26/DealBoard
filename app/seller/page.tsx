import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/queries";
import { sendBlastAction, setListingStatusAction, tightenFloorAction } from "@/lib/actions";
import { acceptOfferAction } from "@/lib/deal-actions";
import { TopBar } from "@/components/TopBar";
import { SellerNav } from "@/components/Nav";
import { usd } from "@/lib/money";
import { STATUS_LABEL, type ListingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SellerHome() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");
  const { listings, meter, blasts } = await getSellerDashboard(
    user.role === "ADMIN" ? "user_seller" : user.id,
  );

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Seller board" />
      <main className="flex-1 px-4 pb-6 space-y-3">
        <section className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Slot meter</p>
          <p className="text-2xl font-semibold mt-1">{usd(meter.monthly)} / mo</p>
          <p className="text-sm text-muted">
            {meter.activeCount} Active · {meter.included} included · {meter.extra} extra at {usd(meter.extraEach)}
          </p>
          <p className="text-xs text-muted mt-2">
            On hold and pending are free and hidden from buyers. We only bill Active.
          </p>
          <Link href="/seller/billing" className="text-sm font-semibold text-accent mt-2 inline-block">
            Billing details
          </Link>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link href="/seller/new" className="card p-4 font-semibold text-center">
            New listing
          </Link>
          <Link href="/seller/billing" className="card p-4 font-semibold text-center">
            Blast
          </Link>
        </div>

        {listings.map((listing) => (
          <article key={listing.id} className="card p-4 space-y-3">
            <div className="flex justify-between gap-2">
              <div>
                <Link href={`/listings/${listing.id}`} className="font-semibold">
                  {listing.address}
                </Link>
                <p className="text-xs text-muted">
                  {usd(listing.assignmentPrice)} · {STATUS_LABEL[listing.status as ListingStatus]}
                </p>
              </div>
              {listing.verified ? <span className="chip">Verified</span> : <span className="chip">Unverified</span>}
            </div>
            <p className="text-xs text-muted">
              {listing.views} views · {listing.holds.length} holds · {listing.offers.length} offers
            </p>
            {listing.titleSlots.some((s) => s.selected) ? (
              <p className="text-xs text-muted">Next title appt set</p>
            ) : null}
            <form action={tightenFloorAction.bind(null, listing.id)} className="flex items-end gap-2">
              <label className="field flex-1">
                Offer floor % under asking
                <input
                  name="offerFloorPct"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  defaultValue={listing.offerFloorPct}
                />
              </label>
              <button className="btn-secondary w-auto px-3" type="submit">
                Set
              </button>
            </form>
            <p className="text-[11px] text-muted">
              Default 10%. You may tighten (5%), not loosen. Buyer cannot bid under this floor.
            </p>
            {listing.offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {usd(offer.price)} · {offer.status.toLowerCase()}
                  {offer.pofAttached ? " · POF" : ""}
                </span>
                {offer.status === "PENDING" ? (
                  <form action={acceptOfferAction.bind(null, offer.id)}>
                    <button className="text-accent font-semibold" type="submit">
                      Accept
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              {(["ACTIVE", "ON_HOLD", "UNDER_CONTRACT"] as const).map((status) => (
                <form key={status} action={setListingStatusAction.bind(null, listing.id, status)}>
                  <button
                    className="chip w-full justify-center"
                    data-on={listing.status === status ? "true" : "false"}
                    type="submit"
                  >
                    {STATUS_LABEL[status]}
                  </button>
                </form>
              ))}
            </div>
          </article>
        ))}

        <section className="card p-4 space-y-3">
          <p className="font-semibold">Buyer blast</p>
          <form action={sendBlastAction} className="space-y-2">
            <select name="listingId" defaultValue={listings[0]?.id ?? ""}>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.address}
                </option>
              ))}
            </select>
            <textarea name="message" rows={3} placeholder="A/B buyers in the box — 1847 just hit a 2-hour hold." />
            <button className="btn-primary" type="submit">
              Send blast
            </button>
          </form>
          {blasts.map((b) => (
            <p key={b.id} className="text-xs text-muted">
              {b.createdAt.toLocaleString()} · {b.message}
            </p>
          ))}
        </section>
      </main>
      <SellerNav />
    </div>
  );
}
