import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { BuyerNav, SellerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const threads = await prisma.thread.findMany({
    where: user.role === "SELLER" ? { sellerId: user.id } : { buyerId: user.id },
    include: { listing: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { id: "desc" },
  });

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Inbox" />
      <main className="flex-1 px-4 pb-4 space-y-2">
        {threads.length === 0 ? (
          <div className="card p-4 text-sm text-muted">No threads yet.</div>
        ) : null}
        {threads.map((t) => (
          <Link key={t.id} href={`/messages/${t.id}`} className="card p-4 block">
            <div className="flex justify-between">
              <p className="font-semibold">{t.listing.address}</p>
              {t.frozen ? <span className="text-xs font-semibold text-grade-d">Frozen</span> : null}
            </div>
            <p className="text-sm text-muted line-clamp-2 mt-1">
              {t.messages[0]?.body ?? "No messages"}
            </p>
          </Link>
        ))}
      </main>
      {user.role === "SELLER" ? <SellerNav /> : <BuyerNav />}
    </div>
  );
}
