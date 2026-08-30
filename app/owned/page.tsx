import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workAgainAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function OwnedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const closed = await prisma.offer.findMany({
    where: { buyerId: user.id, status: "ACCEPTED", listing: { status: "ASSIGNED" } },
    include: { listing: { include: { seller: true } } },
  });

  const rows = closed.map((o) => ({
    address: o.listing.address,
    price: o.price,
    closeDate: o.closeDate.toISOString().slice(0, 10),
    seller: o.listing.seller.name,
  }));
  const csv = [
    "address,price,closeDate,seller",
    ...rows.map((r) => `${r.address},${r.price},${r.closeDate},${r.seller}`),
  ].join("\n");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="After close" />
      <main className="flex-1 px-4 pb-6 space-y-3">
        <section className="card p-4">
          <p className="font-semibold">Owned stub</p>
          <p className="text-sm text-muted mt-1">
            Not a portfolio tracker. After a funded close you can export a CSV and privately mark Work with again.
          </p>
        </section>
        {closed.length === 0 ? (
          <p className="text-sm text-muted px-1">No assigned deals yet. Accept + mark Assigned to land here.</p>
        ) : null}
        {closed.map((o) => (
          <article key={o.id} className="card p-4 space-y-2">
            <p className="font-semibold">{o.listing.address}</p>
            <p className="text-sm">{usd(o.price)}</p>
            <p className="text-xs text-muted">Private: work with {o.listing.seller.name} again?</p>
            <div className="grid grid-cols-2 gap-2">
              <form action={workAgainAction.bind(null, o.listingId, o.listing.sellerId, true)}>
                <button className="btn-secondary" type="submit">Yes</button>
              </form>
              <form action={workAgainAction.bind(null, o.listingId, o.listing.sellerId, false)}>
                <button className="btn-secondary" type="submit">No</button>
              </form>
            </div>
          </article>
        ))}
        <a
          className="btn-secondary inline-block text-center"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download="dealboard-owned.csv"
        >
          Export CSV
        </a>
      </main>
      <BuyerNav />
    </div>
  );
}
