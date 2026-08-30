import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getHomeFeed } from "@/lib/queries";
import { toggleLookingAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { compactUsd, usd } from "@/lib/money";
import { BADGE_LABEL, WORK_LEVEL_LABEL, type Letter, type WorkLevel } from "@/lib/types";
import { displayGradeLabel, letterTone } from "@/lib/queries";
import { daysBetween } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "SELLER") redirect("/seller");
  if (user.role === "ADMIN") redirect("/admin");

  const { box, cards, looking } = await getHomeFeed(user);

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title={looking ? "Looking" : "Paused"} />
      <main className="flex-1 px-4 pb-4 space-y-3">
        <div className="card p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">
              {looking ? "Feed is live" : "Pushes and home are paused"}
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

        {looking &&
          cards.map(({ listing, grade }) => {
            const photos = JSON.parse(listing.photosJson) as string[];
            const days = Math.max(0, daysBetween(new Date(), listing.contractExpiresAt));
            const letter = (grade?.letter ?? "?") as Letter;
            return (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="card overflow-hidden block">
                <div className="relative h-44 bg-[#d9dce6]">
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

        {looking && cards.length === 0 ? (
          <div className="card p-5">
            <p className="font-semibold">No A or B deals right now</p>
            <p className="text-sm text-muted mt-1">
              C and below stay buried. Widen the box or wait for a blast.
            </p>
          </div>
        ) : null}
      </main>
      <BuyerNav />
    </div>
  );
}
