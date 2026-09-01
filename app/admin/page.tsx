import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAdminData, isFrozenAccount } from "@/lib/queries";
import {
  blacklistAction,
  expireListingAdminAction,
  freezeUserAction,
  killListingAdminAction,
  logoutAction,
  resolveReportAction,
  unfreezeUserAction,
} from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { usd } from "@/lib/money";
import { BADGE_LABEL, STATUS_LABEL, type Badge, type ListingStatus } from "@/lib/types";
import { daysBetween } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/home");
  const { reports, users, listings, muteRates, fallthroughs } = await getAdminData();
  const muteAlerts = muteRates.filter((row) => row.alert);
  const openReports = reports.filter((r) => r.status === "OPEN");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Admin" />
      <main className="flex-1 px-4 pb-8 space-y-3">
        <p className="text-sm text-muted">
          Queue, users, listings. Freeze and blacklist are manual. No auto-ban.
        </p>

        <section className="card p-4 space-y-3">
          <p className="font-semibold">Queue</p>
          <p className="text-xs text-muted">
            Reports, mute-rate alerts (≥5 mutes and ≥40% of engaged), fall-throughs.
          </p>
          {openReports.length === 0 && muteAlerts.length === 0 && fallthroughs.length === 0 ? (
            <p className="text-sm text-muted">Nothing in the queue.</p>
          ) : null}
          {openReports.map((r) => (
            <div key={r.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-semibold">
                Report · {r.type} · {r.listing.address}
              </p>
              <p className="text-xs text-muted">{r.reporter.name} · {r.status}</p>
              <p className="text-sm mt-1">{r.notes}</p>
              <form action={resolveReportAction.bind(null, r.id)} className="mt-2">
                <button className="btn-secondary" type="submit">Mark reviewed</button>
              </form>
            </div>
          ))}
          {muteAlerts.map((row) => (
            <p key={row.user.id} className="text-sm border-t border-line pt-3">
              Mute-rate · {row.user.name} · {row.mutedBy} mutes · {(row.rate * 100).toFixed(0)}%
              of engaged. Alert only — not an auto-ban.
            </p>
          ))}
          {fallthroughs.map((o) => (
            <p key={o.id} className="text-sm border-t border-line pt-3">
              Fall-through · {o.listing.address} · {o.buyer.name} accepted {usd(o.price)}.
              Deposit is to title, not us. No deposit recorded in-app.
            </p>
          ))}
        </section>

        <section className="card p-4 space-y-3">
          <p className="font-semibold">Users</p>
          {users.filter((u) => u.role !== "ADMIN").map((u) => {
            const frozen = isFrozenAccount(u);
            return (
              <div key={u.id} className="space-y-2 border-t border-line pt-3">
                <p className="text-sm font-semibold">
                  {u.name} · {u.role.toLowerCase()} · {BADGE_LABEL[u.badge as Badge]}
                  {u.blacklisted ? " · BLOCKED" : ""}
                  {frozen ? " · FROZEN" : ""}
                </p>
                <p className="text-[11px] text-muted">
                  {u.email} · {u.phone} · {u.entityName || "no entity"} · {u.strikes.length} strike
                  {u.strikes.length === 1 ? "" : "s"}
                </p>
                <p className="text-[11px] text-muted">
                  Key {u.id}
                </p>
                {frozen ? (
                  <form action={unfreezeUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn-secondary" type="submit">Unfreeze</button>
                  </form>
                ) : (
                  <form action={freezeUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn-secondary" type="submit">Freeze</button>
                  </form>
                )}
                <form action={blacklistAction} className="space-y-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <input name="note" placeholder="Admin note" />
                  <button className="btn-secondary" type="submit" disabled={u.blacklisted}>
                    Blacklist
                  </button>
                </form>
              </div>
            );
          })}
        </section>

        <section className="card p-4 space-y-3">
          <p className="font-semibold">Listings</p>
          {listings.map((listing) => {
            const age = Math.max(0, daysBetween(listing.createdAt, new Date()));
            return (
              <div key={listing.id} className="space-y-2 border-t border-line pt-3">
                <p className="text-sm font-semibold">{listing.address}</p>
                <p className="text-xs text-muted">
                  {STATUS_LABEL[listing.status as ListingStatus]} · {age}d ·{" "}
                  {listing.verified ? "Verified" : "Unverified"} · {listing.seller.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <form action={expireListingAdminAction.bind(null, listing.id)}>
                    <button className="btn-secondary" type="submit">Force expire</button>
                  </form>
                  <form action={killListingAdminAction.bind(null, listing.id)}>
                    <button className="btn-secondary" type="submit">Kill</button>
                  </form>
                </div>
              </div>
            );
          })}
        </section>

        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">Log out</button>
        </form>
      </main>
    </div>
  );
}
