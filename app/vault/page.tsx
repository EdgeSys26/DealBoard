import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { saveVaultAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Vault" />
      <main className="flex-1 px-4 pb-6">
        <form action={saveVaultAction} className="card p-4 space-y-3">
          <p className="text-sm text-muted">
            Collected at first offer, then reused. Files stay in Deal Board — not Frontburner.
          </p>
          <label className="field">
            Entity
            <input name="entityName" defaultValue={user.entityName ?? ""} />
          </label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="pofOnFile" type="checkbox" defaultChecked={user.pofOnFile} className="w-auto" />
            Proof of funds on file
          </label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="entityOnFile" type="checkbox" defaultChecked={user.entityOnFile} className="w-auto" />
            Entity docs on file
          </label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="w9OnFile" type="checkbox" defaultChecked={user.w9OnFile} className="w-auto" />
            W-9 on file
          </label>
          <button className="btn-primary" type="submit">Save vault</button>
        </form>
      </main>
      <BuyerNav />
    </div>
  );
}
