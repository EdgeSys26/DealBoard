import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { displayGradeLabel, getListingDetail, letterTone } from "@/lib/queries";
import { holdListingAction, pickTitleSlotAction, updateListingOccupancyAction } from "@/lib/actions";
import { occupancyChip, parseOccupancy, TRESPASS_NOTICE } from "@/lib/occupancy";
import {
  acceptCounterAction,
  declineCounterAction,
  favoriteAction,
  hideListingAction,
  placeOfferAction,
  sendMessageAction,
  unhideListingAction,
} from "@/lib/deal-actions";
import { offerCardStatus } from "@/lib/offer-status";
import { BuyerNav, SellerNav } from "@/components/Nav";
import { GradeBars } from "@/components/GradeBars";
import { SaveStar } from "@/components/SaveStar";
import { CompMap } from "@/components/CompMap";
import { HoldTimer } from "@/components/HoldTimer";
import { usd } from "@/lib/money";
import { BADGE_LABEL, WORK_LEVELS, WORK_LEVEL_LABEL, type WorkLevel } from "@/lib/types";
import { CheckRows } from "@/components/CheckRows";
import { NEEDS_WORK, parseNeedsWork } from "@/lib/needs-work";
import { ListingPhoto } from "@/components/ListingPhoto";
import { isListingHot } from "@/lib/hot";
import { listingDaysCopy } from "@/lib/seller-board";
import { formatSlot } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const { id } = await params;
  const data = await getListingDetail(id, user);
  if (!data) notFound();
  if (data.hidden) {
    return (
      <div className="min-h-svh px-4 pt-6">
        <p className="font-semibold">This listing is not available</p>
        <p className="text-sm text-muted mt-2">
          On hold and pending contracts are hidden from other buyers — no feed, no push, no bid.
        </p>
        <Link href="/home" className="btn-secondary mt-4 inline-block text-center">
          Back home
        </Link>
      </div>
    );
  }

  const { listing, grade, myHold, myOffer, accepted, floor, leftoverNow, titleDeposit, photos, isHidden, isSaved, showSellerPhone, showWire } = data;
  const letter = grade?.letter ?? "—";
  const otherHold = listing.holds.find((h) => h.buyerId !== user.id);
  const workLabel = WORK_LEVEL_LABEL[listing.workLevel as WorkLevel];
  const needsWork = parseNeedsWork(listing.needsWorkJson);

  return (
    <div className="min-h-svh flex flex-col">
      <header className="px-4 pt-3 pb-2">
        <Link href={user.role === "SELLER" ? "/seller" : "/home"} className="text-sm font-semibold text-accent">
          ← Back
        </Link>
      </header>
      <main className="flex-1 px-4 pb-6 space-y-3">
        <div className="card overflow-hidden">
          <div className="relative h-52 bg-canvas">
            <ListingPhoto src={photos[0]} className="h-full w-full object-cover" />
            <span className={`grade-pill ${letterTone(letter)}`}>{displayGradeLabel(letter)}</span>
          </div>
          <div className="p-4">
            <div className="flex justify-between gap-3">
              <h1 className="text-xl font-semibold leading-tight">{listing.address}</h1>
              <p className="price-with-star">
                <span className="text-lg font-semibold text-accent">{usd(listing.assignmentPrice)}</span>
                {user.role === "BUYER" ? <SaveStar listingId={listing.id} saved={isSaved} /> : null}
              </p>
            </div>
            <p className="text-sm text-muted">
              {listing.city}, {listing.state} {listing.zip}
            </p>
            <p className="text-sm mt-2">
              {listing.beds} bd · {listing.baths} ba · {listing.sf} sf
            </p>
            {!listing.verified && (user.role === "SELLER" || user.role === "ADMIN") ? (
              <p className="text-sm text-muted mt-2">
                Draft only until an admin verifies the contract. Publish, Matches, and billing stay off.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 mt-3">
              {listing.verified ? <span className="chip">Verified contract</span> : <span className="chip">Unverified</span>}
              {isListingHot(listing) ? <span className="chip">🔥 Hot</span> : null}
              {user.role === "BUYER" ? (
                <span className="chip occupancy-chip">{occupancyChip(listing.occupancy)}</span>
              ) : null}
              <span className="chip">{BADGE_LABEL[listing.seller.badge as "GREEN" | "SILVER" | "GOLD"]}</span>
              <span className="chip">{listingDaysCopy(listing.contractExpiresAt, listing.status)}</span>
              {listing.hasWalkthrough ? <span className="chip">30s walkthrough</span> : <span className="chip">Limited distribution</span>}
            </div>
            {user.role === "BUYER" ? <p className="listing-trespass mt-3">{TRESPASS_NOTICE}</p> : null}
          </div>
        </div>

        <div className="avm-grade-row">
          <section className="card p-4 avm-card">
            <p className="text-[11px] uppercase tracking-wide text-muted font-bold">Platform AVM</p>
            <p className="text-lg font-semibold tracking-tight mt-1">
              {listing.platformAvm ? usd(listing.platformAvm) : "None"}
            </p>
            <p className="text-xs text-muted mt-1">
              {listing.avmSource === "mock" ? "mock AVM" : listing.avmSource}
            </p>
          </section>
          {grade ? (
            <section className="card p-4 grade-card">
              <p className="font-semibold mb-3 flex items-center gap-2">
                Your grade
                <span className={`grade-chip ${letterTone(grade.letter)}`}>
                  {displayGradeLabel(grade.letter)}
                </span>
                <span className="text-sm font-medium text-muted">({grade.score})</span>
              </p>
              {grade.gateFails.length ? (
                <p className="text-sm text-grade-d mb-3">{grade.gateFails.join(" · ")}</p>
              ) : null}
              <GradeBars grade={grade} />
            </section>
          ) : null}
          <section className="card listing-facts">
            <Row label="Seller ARV" value={`${listing.sellerArv ? usd(listing.sellerArv) : "—"} (seller's)`} />
            <Row label="Seller repairs" value={usd(listing.sellerRepairs)} />
            <Row label="Our rehab guess" value={usd(listing.rehabEstimate)} />
            <Row label="Original contract" value={usd(listing.originalContractPrice)} />
            {user.role === "SELLER" || user.role === "ADMIN" ? (
              <form action={updateListingOccupancyAction} className="listing-fact occupancy-edit">
                <span>Occupancy</span>
                <span className="occupancy-edit-controls">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <select name="occupancy" defaultValue={parseOccupancy(listing.occupancy)}>
                    <option value="Owner occupied">Owner occupied</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                  <button className="listing-save" type="submit">
                    Save
                  </button>
                </span>
              </form>
            ) : (
              <Row label="Occupancy" value={parseOccupancy(listing.occupancy)} />
            )}
            <Row label="Access" value={listing.access} />
            <Row
              label="Wholesaler"
              value={
                showSellerPhone
                  ? `${listing.seller.name} · ${listing.seller.phone}`
                  : `${listing.seller.name} · phone hidden until accept`
              }
            />
            <p className="text-[11px] text-muted">
              Homeowner is never shown. Wires go to the title card, not the wholesaler.
            </p>
          </section>
        </div>

        <section className="card p-4">
          <p className="font-semibold">Work</p>
          {user.role === "SELLER" || user.role === "ADMIN" ? (
            <form action={updateListingOccupancyAction} className="mt-2 space-y-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <p className="text-xs text-muted">One pick. Not set from Needs.</p>
              <CheckRows
                name="workLevel"
                type="radio"
                checked={[listing.workLevel]}
                options={WORK_LEVELS.map((value) => ({ value, label: WORK_LEVEL_LABEL[value] }))}
              />
              <button className="listing-save" type="submit">
                Save
              </button>
            </form>
          ) : (
            <p className="text-sm mt-1">{workLabel}</p>
          )}
        </section>

        <section className="card p-4 needs-work">
          <p className="font-semibold">Needs</p>
          {user.role === "SELLER" || user.role === "ADMIN" ? (
            <form action={updateListingOccupancyAction} className="mt-2 space-y-2">
              <input type="hidden" name="listingId" value={listing.id} />
              <input type="hidden" name="needsWorkSent" value="1" />
              <p className="text-xs text-muted">
                Same 12 as buyer Willing to fix. Buyer sees these as chips.
              </p>
              <CheckRows
                name="needsWork"
                checked={needsWork}
                options={NEEDS_WORK.map((value) => ({ value, label: value }))}
              />
              <button className="listing-save" type="submit">
                Save
              </button>
            </form>
          ) : needsWork.length ? (
            <div className="needs-chips">
              {needsWork.map((item) => (
                <span key={item} className="chip occupancy-chip">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm mt-1">None listed.</p>
          )}
        </section>

        <section className="card p-4 known-issues">
          <p className="font-semibold">Known issues</p>
          <p className="text-sm mt-1">{listing.knownIssues?.trim() ? listing.knownIssues : "None listed."}</p>
        </section>

        <section className="card p-4">
          <p className="font-semibold mb-2">Offer + rehab vs AVM leftover</p>
          <p className="text-sm">
            {(myOffer?.price ?? listing.assignmentPrice).toLocaleString()} offer +{" "}
            {listing.rehabEstimate.toLocaleString()} rehab
          </p>
          <p className="text-2xl font-semibold mt-1">
            {leftoverNow == null ? "No AVM" : usd(leftoverNow)} leftover
          </p>
          <p className="text-xs text-muted mt-1">
            AVM {listing.platformAvm ? usd(listing.platformAvm) : "n/a"} minus offer minus rehab guess.
            Seller ARV {listing.sellerArv ? usd(listing.sellerArv) : "—"} is the seller&apos;s number.
          </p>
        </section>

        {listing.comps.length ? (
          <section className="card p-4">
            <p className="font-semibold mb-3">5 comps</p>
            <CompMap
              subject={{ lat: listing.lat, lng: listing.lng, address: listing.address }}
              comps={listing.comps}
            />
          </section>
        ) : null}

        {user.role === "BUYER" ? (
          <>
            <section className="card p-4 space-y-3">
              {myHold ? <HoldTimer expiresAt={myHold.expiresAt} /> : null}
              {otherHold && !myHold ? (
                <p className="text-sm font-semibold">Another buyer has the 2-hour hold.</p>
              ) : null}
              {listing.status === "ACTIVE" && !myHold && !otherHold ? (
                <form action={holdListingAction.bind(null, listing.id)}>
                  <button className="btn-secondary" type="submit">
                    Soft hold for 2 hours
                  </button>
                </form>
              ) : null}

              {myOffer?.status === "COUNTERED" ? (
                <>
                  <p className="font-semibold">{offerCardStatus(myOffer)}</p>
                  <p className="text-sm">
                    Seller countered {usd(myOffer.counterPrice ?? myOffer.price)} · close{" "}
                    {myOffer.counterCloseDate
                      ? myOffer.counterCloseDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                    . One round. Accept or Decline.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <form action={acceptCounterAction.bind(null, myOffer.id)}>
                      <button className="btn-primary" type="submit">
                        Accept
                      </button>
                    </form>
                    <form action={declineCounterAction.bind(null, myOffer.id)}>
                      <button className="btn-secondary" type="submit">
                        Decline
                      </button>
                    </form>
                  </div>
                </>
              ) : myOffer ? (
                <p className="text-sm font-semibold">{offerCardStatus(myOffer)}</p>
              ) : listing.status === "ACTIVE" ? (
              <>
              <p className="font-semibold">Place offer</p>
              <p className="text-xs text-muted">
                Floor {usd(floor)} ({listing.offerFloorPct}% below asking). No ceiling.
                Hold drops unless this offer includes POF. Buyer cannot submit under the seller&apos;s floor.
              </p>
              <form action={placeOfferAction} className="space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="rehabGuess" value={listing.rehabEstimate} />
                <div className="offer-row">
                  <label className="field">
                    Price
                    <input name="price" type="number" defaultValue={listing.assignmentPrice} min={floor} required />
                  </label>
                  <label className="field">
                    Close date
                    <input name="closeDate" type="date" defaultValue="2026-09-18" required />
                  </label>
                </div>
                <p className="floor-copy text-sm font-semibold">
                  Deposit to title: {usd(titleDeposit)}
                </p>
                {!user.pofOnFile || !user.entityOnFile || !user.w9OnFile ? (
                  <label className="flex items-start gap-2 text-sm font-medium text-ink">
                    <input name="attachPof" type="checkbox" defaultChecked className="w-auto" />
                    First offer: attach vault POF, entity papers, and W-9 (demo files).
                  </label>
                ) : (
                  <p className="text-xs text-muted">POF / entity / W-9 reused from your vault.</p>
                )}
                <button className="btn-primary" type="submit">
                  Place offer
                </button>
              </form>
              </>
              ) : null}
            </section>

            <TitleCard listingId={listing.id} titleFile={listing.titleFile} showWire={showWire} accepted={Boolean(accepted)} />

            <section className="card p-4">
              <p className="font-semibold mb-2">Message seller</p>
              <p className="text-xs text-muted mb-2">In-app only until a bid is accepted.</p>
              <form action={sendMessageAction} className="space-y-2">
                <input type="hidden" name="listingId" value={listing.id} />
                <textarea name="body" rows={3} placeholder="Ask about access or title slots" />
                <button className="btn-secondary" type="submit">
                  Send
                </button>
              </form>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <form action={favoriteAction.bind(null, listing.id, "FAVORITE")}>
                <button className="btn-secondary" type="submit">
                  Favorite seller
                </button>
              </form>
              {isHidden ? (
                <form action={unhideListingAction.bind(null, listing.id)}>
                  <button className="btn-secondary" type="submit">
                    Unhide
                  </button>
                </form>
              ) : (
                <form action={hideListingAction.bind(null, listing.id)}>
                  <button className="btn-secondary" type="submit">
                    Hide
                  </button>
                </form>
              )}
            </div>

            <ReportBlock listingId={listing.id} />
          </>
        ) : null}
      </main>
      {user.role === "SELLER" ? <SellerNav /> : <BuyerNav />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="listing-fact">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TitleCard({
  listingId,
  titleFile,
  showWire,
  accepted,
}: {
  listingId: string;
  titleFile: {
    company: string;
    fileNumber: string;
    depositAmount: number;
    officeAddress: string;
    routingNumber: string | null;
    accountNumber: string | null;
    slots: { id: string; startsAt: Date; location: string; kind: string; selected: boolean }[];
  } | null;
  showWire: boolean;
  accepted: boolean;
}) {
  if (!titleFile) return null;
  return (
    <section className="card p-4 space-y-2">
      <p className="font-semibold">Title card</p>
      <p className="text-sm">
        {titleFile.company} · file #{titleFile.fileNumber}
      </p>
      <p className="text-sm">Deposit {usd(titleFile.depositAmount)} to title within 24h — never the platform or seller bank.</p>
      <p className="text-sm">{titleFile.officeAddress}</p>
      {titleFile.slots.map((slot) => (
        <form key={slot.id} action={pickTitleSlotAction.bind(null, slot.id)} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {formatSlot(slot.startsAt)}{" "}
            · {slot.location}
            {slot.selected ? " · selected" : ""}
          </span>
          {accepted ? (
            <button className="text-accent font-semibold" type="submit">
              Pick
            </button>
          ) : null}
        </form>
      ))}
      {showWire ? (
        <div className="mt-2 rounded-xl surface-accent p-3 text-sm">
          <p className="font-semibold">Wire (from title only)</p>
          <p>Routing {titleFile.routingNumber}</p>
          <p>Account {titleFile.accountNumber}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">No wire numbers until an offer is accepted.</p>
      )}
      <p className="text-[11px] text-muted">Listing {listingId}</p>
    </section>
  );
}

function ReportBlock({ listingId }: { listingId: string }) {
  return (
    <form action={async (formData) => {
      "use server";
      const { reportListingAction } = await import("@/lib/actions");
      await reportListingAction(formData);
    }} className="card p-4 space-y-2">
      <p className="font-semibold">Report</p>
      <input type="hidden" name="listingId" value={listingId} />
      <select name="type" defaultValue="DEAD">
        <option value="DEAD">Dead</option>
        <option value="FAKE">Fake</option>
        <option value="STOLEN">Stolen</option>
        <option value="FLAKE">Flake</option>
      </select>
      <textarea name="notes" rows={2} placeholder="Private to admin" />
      <button className="btn-secondary" type="submit">
        Send to admin
      </button>
    </form>
  );
}
