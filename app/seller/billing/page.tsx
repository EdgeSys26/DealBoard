import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSellerDashboard } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { SellerNav } from "@/components/Nav";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");
  const { listings, meter } = await getSellerDashboard(user.role === "ADMIN" ? "user_seller" : user.id);
  const active = listings.filter((l) => l.status === "ACTIVE");
  const free = listings.filter((l) => l.status === "ON_HOLD" || l.status === "UNDER_CONTRACT");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Billing" />
      <main className="flex-1 px-4 pb-6 space-y-3">
        <section className="card p-4">
          <p className="text-sm text-muted">What would be billed this month</p>
          <p className="text-3xl font-semibold mt-1">{usd(meter.monthly)}</p>
          <p className="text-sm mt-2">
            ~{usd(meter.base)}/mo includes 1 Active listing. ~{usd(meter.extraEach)} per extra Active listing / month.
          </p>
          <p className="text-xs text-muted mt-2">
            On hold, Pending / under contract, Assigned, and Expired are not billed. Only Active — what buyers can still take.
          </p>
        </section>
        <section className="card p-4 space-y-2">
          <p className="font-semibold">Active — billed</p>
          {active.length === 0 ? <p className="text-sm text-muted">None</p> : null}
          {active.map((l) => (
            <p key={l.id} className="text-sm">{l.address}</p>
          ))}
        </section>
        <section className="card p-4 space-y-2">
          <p className="font-semibold">On hold / pending — free</p>
          {free.length === 0 ? <p className="text-sm text-muted">None</p> : null}
          {free.map((l) => (
            <p key={l.id} className="text-sm">{l.address} · {l.status === "ON_HOLD" ? "On hold" : "Pending"}</p>
          ))}
        </section>
        <button className="btn-primary" type="button" disabled>
          Stripe checkout (stub)
        </button>
        <p className="text-xs text-muted">
          Buyers stay free forever. No iOS in-app purchases. Stripe is stubbed for this build.
        </p>
      </main>
      <SellerNav />
    </div>
  );
}
