import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createListingAction } from "@/lib/actions";
import { getBoardLevers } from "@/lib/settings";
import { TopBar } from "@/components/TopBar";
import { SellerNav } from "@/components/Nav";
import { usd } from "@/lib/money";
import { CheckRows } from "@/components/CheckRows";
import { WORK_LEVELS, WORK_LEVEL_LABEL } from "@/lib/types";
import { NEEDS_WORK } from "@/lib/needs-work";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (user.role === "BUYER") redirect("/home");
  const levers = await getBoardLevers();
  const platformDeposit = levers.titleDeposit;

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="New listing" />
      <main className="flex-1 px-4 pb-6">
        <form action={createListingAction} className="space-y-3">
          <p className="text-sm text-muted">
            Save a draft anytime. Publish stays blocked until an admin verifies the
            contract. Unverified listings cannot go Active — no Matches, All in area, or invoice.
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
          <label className="field">Occupancy
            <select name="occupancy" defaultValue="Vacant">
              <option value="Owner occupied">Owner occupied</option>
              <option value="Tenant">Tenant</option>
              <option value="Vacant">Vacant</option>
            </select>
          </label>
          <label className="field">Access<input name="access" defaultValue="Lockbox" /></label>
          <label className="field">Contract expiration<input name="contractExpiresAt" type="date" required /></label>
          <label className="field">Work level
            <select name="workLevel" defaultValue="MEDIUM">
              {WORK_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {WORK_LEVEL_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="floor-copy">Offer floor: {levers.defaultOfferFloorPct}% under</span>
            <input
              name="offerFloorPct"
              type="number"
              min={0}
              max={levers.defaultOfferFloorPct}
              defaultValue={levers.defaultOfferFloorPct}
            />
          </label>
          <label className="field">
            Title deposit
            <input
              name="titleDeposit"
              type="number"
              min={platformDeposit}
              step={100}
              defaultValue={platformDeposit}
            />
          </label>
          <p className="text-[11px] text-muted -mt-1">
            Platform floor is {usd(platformDeposit)}. You may raise it, not lower it. Buyer does not set this.
          </p>
          <p className="text-[11px] text-muted -mt-1">
            Buyer cannot offer more than this percent below asking. Default {levers.defaultOfferFloorPct}%. You may tighten later.
          </p>
          <label className="field">Our rehab guess<input name="rehabEstimate" type="number" defaultValue={15000} /></label>
          <label className="field">Known issues<textarea name="knownIssues" rows={3} /></label>
          <p className="text-sm font-semibold">Needs work</p>
          <CheckRows
            name="needsWork"
            checked={[]}
            options={NEEDS_WORK.map((value) => ({ value, label: value }))}
          />
          <label className="flex gap-2 text-sm font-medium">
            <input name="hasWalkthrough" type="checkbox" defaultChecked className="w-auto" />
            30s walkthrough uploaded
          </label>
          <label className="flex gap-2 text-sm font-medium">
            <input name="contractUploaded" type="checkbox" className="w-auto" />
            Private contract uploaded
          </label>
          <p className="text-[11px] text-muted">
            Upload is not verification. Admin Listings or Review must mark the contract verified.
          </p>
          <button className="btn-primary" type="submit">
            Save draft
          </button>
          <button className="btn-secondary" type="button" disabled>
            Publish
          </button>
          <p className="text-[11px] text-muted">
            Publish is blocked until admin approves the contract.
          </p>
        </form>
      </main>
      <SellerNav />
    </div>
  );
}
