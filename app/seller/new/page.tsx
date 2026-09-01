import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createListingAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { SellerNav } from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="New listing" />
      <main className="flex-1 px-4 pb-6">
        <form action={createListingAction} className="space-y-3">
          <p className="text-sm text-muted">
            Photos plus a 30-second walkthrough are required for full distribution.
            Private contract upload unlocks the verified badge.
          </p>
          <label className="field">Address<input name="address" required placeholder="123 Main St" /></label>
          <label className="field">City<input name="city" defaultValue="Noblesville" /></label>
          <label className="field">Zip<input name="zip" defaultValue="46060" /></label>
          <label className="field">Assignment price<input name="assignmentPrice" type="number" required /></label>
          <label className="field">Original contract<input name="originalContractPrice" type="number" required /></label>
          <label className="field">Seller ARV<input name="sellerArv" type="number" /></label>
          <label className="field">Seller repairs<input name="sellerRepairs" type="number" /></label>
          <label className="field">Beds<input name="beds" type="number" defaultValue={3} /></label>
          <label className="field">Baths<input name="baths" type="number" step="0.5" defaultValue={2} /></label>
          <label className="field">Sq ft<input name="sf" type="number" defaultValue={1200} /></label>
          <label className="field">Occupancy<input name="occupancy" defaultValue="Vacant" /></label>
          <label className="field">Access<input name="access" defaultValue="Lockbox" /></label>
          <label className="field">Contract expiration<input name="contractExpiresAt" type="date" required /></label>
          <label className="field">Work level
            <select name="workLevel" defaultValue="MEDIUM">
              <option value="TURNKEY">Turnkey</option>
              <option value="PAINT_CARPET">Paint & carpet</option>
              <option value="MEDIUM">Medium</option>
              <option value="FULL_GUT">Full gut</option>
            </select>
          </label>
          <label className="field">Offer floor % under asking
            <input name="offerFloorPct" type="number" min={0} max={10} defaultValue={10} />
          </label>
          <p className="text-[11px] text-muted -mt-1">
            Buyer cannot offer more than this percent below asking. Default 10%. You may tighten later.
          </p>
          <label className="field">Our rehab guess<input name="rehabEstimate" type="number" defaultValue={15000} /></label>
          <label className="field">Known issues<textarea name="knownIssues" rows={3} /></label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="hasWalkthrough" type="checkbox" defaultChecked className="w-auto" />
            30s walkthrough uploaded
          </label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="contractUploaded" type="checkbox" className="w-auto" />
            Private contract uploaded (verified)
          </label>
          <button className="btn-primary" type="submit">Publish</button>
        </form>
      </main>
      <SellerNav />
    </div>
  );
}
