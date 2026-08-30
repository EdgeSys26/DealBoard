import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { deleteAccountAction, logoutAction, toggleLookingAction, toggleQuietHoursAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="You" />
      <main className="flex-1 px-4 pb-6 space-y-3">
        <section className="card p-4">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="text-sm mt-2">
            Badge {user.badge} · {user.fundedCloses} funded closes
          </p>
          <p className="text-xs text-muted mt-1">
            Badges are earned on funded closes, not listings. No public stars.
          </p>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <form action={toggleLookingAction}>
            <button className="btn-secondary" type="submit">
              {user.lookingStatus === "LOOKING" ? "Pause" : "Looking"}
            </button>
          </form>
          <form action={toggleQuietHoursAction}>
            <button className="btn-secondary" type="submit">
              Quiet hours {user.quietHours ? "on" : "off"}
            </button>
          </form>
        </div>
        <Link href="/vault" className="card p-4 block font-semibold">Vault · POF / entity / W-9</Link>
        <Link href="/favorites" className="card p-4 block font-semibold">Favorites</Link>
        <Link href="/deals" className="card p-4 block font-semibold">Offers & title</Link>
        <Link href="/owned" className="card p-4 block font-semibold">After close</Link>
        <form action={logoutAction}>
          <button className="btn-secondary" type="submit">Log out</button>
        </form>
        <form action={deleteAccountAction}>
          <button className="text-sm text-red-600 font-semibold w-full" type="submit">
            Delete account
          </button>
        </form>
      </main>
      <BuyerNav />
    </div>
  );
}
