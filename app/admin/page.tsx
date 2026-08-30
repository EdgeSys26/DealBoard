import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAdminData } from "@/lib/queries";
import { blacklistAction, logoutAction, resolveReportAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/home");
  const { reports, users, muteRates } = await getAdminData();

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Admin" />
      <main className="flex-1 px-4 pb-8 space-y-3">
        <p className="text-sm text-muted">
          Reports, mute-rate, blacklist. No auto-ban. Keys are account + entity + phone + email.
        </p>
        <section className="card p-4 space-y-3">
          <p className="font-semibold">Reports</p>
          {reports.map((r) => (
            <div key={r.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-semibold">
                {r.type} · {r.listing.address}
              </p>
              <p className="text-xs text-muted">{r.reporter.name} · {r.status}</p>
              <p className="text-sm mt-1">{r.notes}</p>
              {r.status === "OPEN" ? (
                <form action={resolveReportAction.bind(null, r.id)} className="mt-2">
                  <button className="btn-secondary" type="submit">Mark reviewed</button>
                </form>
              ) : null}
            </div>
          ))}
        </section>
        <section className="card p-4 space-y-2">
          <p className="font-semibold">Mute rate</p>
          {muteRates.map((row) => (
            <p key={row.user.id} className="text-sm">
              {row.user.name} · muted by {row.mutedBy} · rate {(row.rate * 100).toFixed(0)}%
            </p>
          ))}
        </section>
        <section className="card p-4 space-y-3">
          <p className="font-semibold">Blacklist</p>
          {users.filter((u) => u.role !== "ADMIN").map((u) => (
            <form key={u.id} action={blacklistAction} className="space-y-2 border-t border-line pt-3">
              <input type="hidden" name="userId" value={u.id} />
              <p className="text-sm font-semibold">
                {u.name} · {u.email} {u.blacklisted ? "· BLOCKED" : ""}
              </p>
              <p className="text-[11px] text-muted">
                {u.id} · {u.entityName} · {u.phone}
              </p>
              <input name="note" placeholder="Admin note" />
              <button className="btn-secondary" type="submit" disabled={u.blacklisted}>
                Blacklist
              </button>
            </form>
          ))}
        </section>
        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">Log out</button>
        </form>
      </main>
    </div>
  );
}
