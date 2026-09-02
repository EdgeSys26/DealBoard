import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getBuyBox } from "@/lib/queries";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { CheckRows } from "@/components/CheckRows";
import { WhereSection } from "@/components/WhereSection";
import { BuyBoxForm } from "@/components/BuyBoxForm";
import { NOBLESVILLE_SQUARE } from "@/lib/types";
import { parseExcludedCities } from "@/lib/area-cities";
import { NEEDS_WORK, parseNeedsWork } from "@/lib/needs-work";

export const dynamic = "force-dynamic";

export default async function BuyBoxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const box = await getBuyBox(user.id);
  const willing = box ? parseNeedsWork((box as { willingToFix?: string }).willingToFix) : [];
  const excludedCities = parseExcludedCities(box?.excludedCities);

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Buy box" />
      <main className="flex-1 px-4 pb-2 buybox-page">
        <BuyBoxForm>
          <WhereSection
            centerLabel={box?.centerLabel ?? NOBLESVILLE_SQUARE.label}
            zip={box?.zip ?? NOBLESVILLE_SQUARE.zip}
            radiusMiles={box?.radiusMiles ?? 8}
            lat={box?.lat ?? NOBLESVILLE_SQUARE.lat}
            lng={box?.lng ?? NOBLESVILLE_SQUARE.lng}
            excludedCities={excludedCities}
          />

          <section className="card buybox-section">
            <div className="buybox-section-head">
              <p className="font-semibold">2. Price</p>
            </div>
            <label className="field">
              Max assignment
              <input name="maxAssignmentPrice" type="number" defaultValue={box?.maxAssignmentPrice ?? 250000} />
            </label>
            <label className="field">
              Min beds (optional)
              <input name="minBeds" type="number" defaultValue={box?.minBeds ?? 3} />
            </label>
            <label className="field">
              Min sf (optional)
              <input name="minSf" type="number" defaultValue={box?.minSf ?? ""} placeholder="Any" />
            </label>
          </section>

          <section className="card buybox-section">
            <div className="buybox-section-head">
              <p className="font-semibold">3. Willing to fix</p>
            </div>
            <p className="text-xs text-muted">
              Same 12 as seller Needs. Empty = all. A listing Need you did not check is out of
              Matches and A/B.
            </p>
            <CheckRows
              name="willingToFix"
              checked={willing}
              options={NEEDS_WORK.map((value) => ({ value, label: value }))}
            />
            <label className="field">
              Max rehab $ (optional)
              <input name="maxRehab" type="number" defaultValue={box?.maxRehab ?? ""} placeholder="No cap" />
            </label>
          </section>

          <section className="card buybox-section">
            <div className="buybox-section-head">
              <p className="font-semibold">4. Alerts</p>
            </div>
            <select name="alertMode" defaultValue={box?.alertMode ?? "A_AND_B"}>
              <option value="A_AND_B">A + B (default)</option>
              <option value="A_ONLY">A only</option>
              <option value="APP_ONLY">App only</option>
            </select>
            <p className="text-xs text-muted">Pushes stay A/B. C and D never page you.</p>
          </section>
        </BuyBoxForm>
      </main>
      <BuyerNav />
    </div>
  );
}
