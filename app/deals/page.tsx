import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { usd } from "@/lib/money";
import { formatSlot } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const offers = await prisma.offer.findMany({
    where: { buyerId: user.id },
    include: { listing: { include: { titleFile: { include: { slots: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Offers" />
      <main className="flex-1 px-4 pb-6 space-y-3">
        {offers.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No offers yet. Start from a listing.</div>
        ) : null}
        {offers.map((o) => {
          const title = o.listing.titleFile;
          const accepted = o.status === "ACCEPTED";
          const slot = title?.slots.find((s) => s.selected);
          return (
            <article key={o.id} className="card p-4 space-y-2">
              <Link href={`/listings/${o.listingId}`} className="font-semibold">
                {o.listing.address}
              </Link>
              <p className="text-sm">
                {usd(o.price)} · deposit {usd(o.deposit)} · {o.status.toLowerCase()}
              </p>
              {accepted && title ? (
                <div className="rounded-xl bg-[#eef2ff] p-3 text-sm space-y-1">
                  <p className="font-semibold">{title.company}</p>
                  <p>File #{title.fileNumber}</p>
                  <p>{usd(title.depositAmount)} to title</p>
                  {slot ? (
                    <p>
                      {formatSlot(slot.startsAt)}{" "}
                      · {slot.location}
                    </p>
                  ) : null}
                  {title.wireReleased ? (
                    <>
                      <p>Routing {title.routingNumber}</p>
                      <p>Account {title.accountNumber}</p>
                    </>
                  ) : (
                    <p>No wire numbers until accepted.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">Title wires stay hidden until accept.</p>
              )}
            </article>
          );
        })}
      </main>
      <BuyerNav />
    </div>
  );
}
