import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getListingDetail, letterTone } from "@/lib/queries";
import {
  favoriteAction,
  holdListingAction,
  placeOfferAction,
  pickTitleSlotAction,
  sendMessageAction,
} from "@/lib/actions";
import { BuyerNav, SellerNav } from "@/components/Nav";
import { GradeBars } from "@/components/GradeBars";
import { CompMap } from "@/components/CompMap";
import { HoldTimer } from "@/components/HoldTimer";
import { usd } from "@/lib/money";
import { BADGE_LABEL, WORK_LEVEL_LABEL, type WorkLevel } from "@/lib/types";
import { daysBetween } from "@/lib/geo";

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
      <div className="min-h-svh px-4 pt-16">
        <p className="font-semibold">This listing is on hold</p>
        <p className="text-sm text-muted mt-2">
          On-hold contracts are hidden from buyers — no feed, search, or messages.
        </p>
        <Link href="/home" className="btn-secondary mt-4 inline-block text-center">
          Back home
        </Link>
      </div>
    );
  }

  const { listing, grade, myHold, myOffer, accepted, floor, leftoverNow, photos, showSellerPhone, showWire } = data;
  const days = Math.max(0, daysBetween(new Date(), listing.contractExpiresAt));
  const letter = grade?.letter ?? "—";
  const otherHold = listing.holds.find((h) => h.buyerId !== user.id);

  return (
    <div className="min-h-svh flex flex-col">
      <header className="px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <Link href={user.role === "SELLER" ? "/seller" : "/home"} className="text-sm font-semibold text-accent">
          ← Back
        </Link>
      </header>
      <main className="flex-1 px-4 pb-6 space-y-3">
        <div className="card overflow-hidden">
          <div className="relative h-52 bg-[#d9dce6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt="" className="h-full w-full object-cover" />
            <span className={`grade-pill ${letterTone(letter)}`}>{letter}</span>
          </div>
          <div className="p-4">
            <div className="flex justify-between">
              <h1 className="text-xl font-semibold leading-tight">{listing.address}</h1>
              <p className="text-lg font-semibold text-accent">{usd(listing.assignmentPrice)}</p>
            </div>
            <p className="text-sm text-muted">
              {listing.city}, {listing.state} {listing.zip}
            </p>
            <p className="text-sm mt-2">
              {listing.beds} bd · {listing.baths} ba · {listing.sf} sf ·{" "}
              {WORK_LEVEL_LABEL[listing.workLevel as WorkLevel]}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {listing.verified ? <span className="chip">Verified contract</span> : <span className="chip">Unverified</span>}
              <span className="chip">{BADGE_LABEL[listing.seller.badge as "GREEN" | "SILVER" | "GOLD"]}</span>
              <span className="chip">{days} days left</span>
              {listing.hasWalkthrough ? <span className="chip">30s walkthrough</span> : <span className="chip">Limited distribution</span>}
            </div>
          </div>
        </div>

        {grade ? (
          <section className="card p-4">
            <p className="font-semibold mb-3">
              Your grade · {grade.letter} ({grade.score})
            </p>
            {grade.gateFails.length ? (
              <p className="text-sm text-red-600 mb-3">{grade.gateFails.join(" · ")}</p>
            ) : null}
            <GradeBars grade={grade} />
          </section>
        ) : null}

        <section className="card p-4 space-y-2 text-sm">
          <Row label="Platform AVM" value={`${listing.platformAvm ? usd(listing.platformAvm) : "None"} · ${listing.avmSource === "mock" ? "mock AVM" : listing.avmSource}`} />
          <Row label="Seller ARV" value={`${listing.sellerArv ? usd(listing.sellerArv) : "—"} (seller's)`} />
          <Row label="Seller repairs" value={usd(listing.sellerRepairs)} />
          <Row label="Our rehab guess" value={usd(listing.rehabEstimate)} />
          <Row label="Original contract" value={usd(listing.originalContractPrice)} />
          <Row label="Occupancy" value={listing.occupancy} />
          <Row label="Access" value={listing.access} />
          <Row label="Known issues" value={listing.knownIssues} />
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
              {!myHold && !otherHold && listing.status === "ACTIVE" ? (
                <form action={holdListingAction.bind(null, listing.id)}>
                  <button className="btn-secondary" type="submit">
                    Soft hold for 2 hours
                  </button>
                </form>
              ) : null}

              <p className="font-semibold">Place offer</p>
              <p className="text-xs text-muted">
                Floor {usd(floor)} ({listing.offerFloorPct}% below asking). No ceiling.
                Hold drops unless this offer includes POF.
              </p>
              <form action={placeOfferAction} className="space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="rehabGuess" value={listing.rehabEstimate} />
                <label className="field">
                  Price
                  <input name="price" type="number" defaultValue={listing.assignmentPrice} min={floor} required />
                </label>
                <label className="field">
                  Deposit to title
                  <input name="deposit" type="number" defaultValue={2500} required />
                </label>
                <label className="field">
                  Close date
                  <input name="closeDate" type="date" defaultValue="2026-09-18" required />
                </label>
                {!user.pofOnFile || !user.entityOnFile || !user.w9OnFile ? (
                  <label className="flex items-start gap-2 text-sm font-medium text-ink">
                    <input name="attachPof" type="checkbox" defaultChecked className="mt-1 w-auto" />
                    First offer: attach vault POF, entity papers, and W-9 (demo files).
                  </label>
                ) : (
                  <p className="text-xs text-muted">POF / entity / W-9 reused from your vault.</p>
                )}
                <button className="btn-primary" type="submit">
                  Place offer
                </button>
              </form>
              {myOffer ? (
                <p className="text-sm">
                  Your offer {usd(myOffer.price)} is {myOffer.status.toLowerCase()}.
                </p>
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
                  Favorite
                </button>
              </form>
              <form action={favoriteAction.bind(null, listing.id, "DONT_SHOW")}>
                <button className="btn-secondary" type="submit">
                  Don&apos;t show
                </button>
              </form>
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
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted font-bold">{label}</p>
      <p>{value}</p>
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
      <p className="text-sm">Deposit {usd(titleFile.depositAmount)} to title — never the platform or seller bank.</p>
      <p className="text-sm">{titleFile.officeAddress}</p>
      {titleFile.slots.map((slot) => (
        <form key={slot.id} action={pickTitleSlotAction.bind(null, slot.id)} className="flex items-center justify-between gap-2 text-sm">
          <span>
            {slot.startsAt.toLocaleString("en-US", {
              weekday: "short",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
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
        <div className="mt-2 rounded-xl bg-[#eef2ff] p-3 text-sm">
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
