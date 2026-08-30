import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageAction } from "@/lib/actions";
import { BuyerNav, SellerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const { id } = await params;
  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      listing: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) notFound();
  if (thread.buyerId !== user.id && thread.sellerId !== user.id && user.role !== "ADMIN") {
    redirect("/messages");
  }

  return (
    <div className="min-h-svh flex flex-col">
      <header className="px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <Link href="/messages" className="text-sm font-semibold text-accent">← Inbox</Link>
        <h1 className="font-semibold">{thread.listing.address}</h1>
        {thread.frozen ? (
          <p className="text-xs text-amber-800 mt-1">{thread.freezeNote}</p>
        ) : null}
      </header>
      <main className="flex-1 px-4 space-y-2 pb-4">
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={`card p-3 text-sm ${m.system ? "bg-[#fff7ed]" : m.senderId === user.id ? "ml-8" : "mr-8"}`}
          >
            <p className="text-[11px] font-bold text-muted">
              {m.system ? "System" : m.senderId === user.id ? "You" : m.sender.name}
            </p>
            <p>{m.body}</p>
          </div>
        ))}
        <form action={sendMessageAction} className="space-y-2 pt-2">
          <input type="hidden" name="listingId" value={thread.listingId} />
          <input type="hidden" name="buyerId" value={thread.buyerId} />
          <textarea name="body" rows={3} disabled={thread.frozen} placeholder={thread.frozen ? "Frozen" : "Message"} />
          <button className="btn-primary" type="submit" disabled={thread.frozen}>
            Send
          </button>
        </form>
      </main>
      {user.role === "SELLER" ? <SellerNav /> : <BuyerNav />}
    </div>
  );
}
