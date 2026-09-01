import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { listing: true },
  });

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Private lists" />
      <main className="flex-1 px-4 pb-6 space-y-2">
        {rows.length === 0 ? <p className="text-sm text-muted">Nothing saved.</p> : null}
        {rows.map((r) => (
          <Link key={r.id} href={`/listings/${r.listingId}`} className="card p-4 block">
            <p className="font-semibold">{r.listing.address}</p>
            <p className="text-xs text-muted">
              {r.kind === "FAVORITE" ? "Favorite seller — their A/B jump the line" : "Don't show"}
            </p>
          </Link>
        ))}
      </main>
      <BuyerNav />
    </div>
  );
}
