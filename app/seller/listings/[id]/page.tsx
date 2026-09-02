import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveListingAskingAction } from "@/lib/actions";
import { SellerNav } from "@/components/Nav";
import { listingPhotos } from "@/lib/listing-photos";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function SellerListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId !== user.id && user.role !== "ADMIN") redirect("/seller");
  const photos = listingPhotos(listing);

  return (
    <div className="min-h-svh flex flex-col dash-page">
      <main className="flex-1 px-4 pb-6 space-y-3 pt-2">
        <Link href="/seller" className="text-sm font-semibold text-accent">
          ← Listings
        </Link>
        <div className="card overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[0]} alt="" className="h-40 w-full object-cover" />
          <div className="p-4 space-y-1">
            <h1 className="text-xl font-semibold leading-tight">{listing.address}</h1>
            <p className="text-sm text-muted">
              {listing.city}, {listing.state} {listing.zip}
            </p>
            <p className="text-sm text-muted">
              Contract {usd(listing.originalContractPrice)} · pay homeowner
            </p>
          </div>
        </div>
        <form action={saveListingAskingAction.bind(null, listing.id)} className="card p-4 space-y-3">
          <label className="field">
            <span className="text-base font-semibold">Asking</span>
            <input
              name="assignmentPrice"
              type="number"
              min={1}
              step={100}
              defaultValue={listing.assignmentPrice}
              required
              className="text-xl font-semibold"
            />
          </label>
          <p className="text-xs text-muted">
            Buyers with this in Matches, Saved, or an open offer get Inbox: Price changed · $X.
          </p>
          <button className="btn-primary" type="submit">
            Save asking
          </button>
        </form>
        <Link href={`/listings/${listing.id}`} className="text-sm font-semibold text-accent">
          View listing
        </Link>
      </main>
      <SellerNav />
    </div>
  );
}
