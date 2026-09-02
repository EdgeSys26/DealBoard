import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getBuyBox } from "@/lib/queries";
import { saveBuyBoxAction } from "@/lib/actions";
import { TopBar } from "@/components/TopBar";
import { BuyerNav } from "@/components/Nav";
import { NOBLESVILLE_SQUARE } from "@/lib/types";
import { citiesIntersectingCircle, parseExcludedCities } from "@/lib/area-cities";

export const dynamic = "force-dynamic";

export default async function BuyBoxPage() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const box = await getBuyBox(user.id);
  const levels = box ? (JSON.parse(box.workLevels) as string[]) : ["MEDIUM", "FULL_GUT"];
  const chipCities = citiesIntersectingCircle(
    {
      lat: box?.lat ?? NOBLESVILLE_SQUARE.lat,
      lng: box?.lng ?? NOBLESVILLE_SQUARE.lng,
    },
    box?.radiusMiles ?? 8,
  );
  const excludedCities = parseExcludedCities(box?.excludedCities);

  return (
    <div className="min-h-svh flex flex-col">
      <TopBar user={user} title="Buy box" />
      <main className="flex-1 px-4 pb-6">
        <form action={saveBuyBoxAction} className="space-y-4">
          <section className="card p-4 space-y-3">
            <p className="font-semibold">1. Where</p>
            <label className="field">
              Pin or zip
              <input name="centerLabel" defaultValue={box?.centerLabel ?? NOBLESVILLE_SQUARE.label} />
            </label>
            <label className="field">
              Zip
              <input name="zip" defaultValue={box?.zip ?? "46060"} />
            </label>
            <label className="field">
              Radius (miles)
              <input name="radiusMiles" type="number" step="0.5" defaultValue={box?.radiusMiles ?? 8} />
            </label>
            <p className="text-sm font-medium">Cities in this circle</p>
            <div className="city-chips">
              {chipCities.map((city) => (
                <label key={city} className="chip" data-on={!excludedCities.includes(city) ? "true" : "false"}>
                  <input
                    type="checkbox"
                    name="cities"
                    value={city}
                    defaultChecked={!excludedCities.includes(city)}
                    className="w-auto"
                  />
                  {city}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted">
              Default all on. Deselect a city to hide it from Home and this box. Alerts stay A/B only
              inside selected cities.
            </p>
          </section>

          <section className="card p-4 space-y-3">
            <p className="font-semibold">2. Price</p>
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

          <section className="card p-4 space-y-3">
            <p className="font-semibold">3. Work</p>
            {[
              ["TURNKEY", "Turnkey"],
              ["PAINT_CARPET", "Paint & carpet"],
              ["MEDIUM", "Medium"],
              ["FULL_GUT", "Full gut"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="workLevels"
                  value={value}
                  defaultChecked={levels.includes(value)}
                  className="w-auto"
                />
                {label}
              </label>
            ))}
            <label className="field">
              Max rehab $ (optional)
              <input name="maxRehab" type="number" defaultValue={box?.maxRehab ?? ""} placeholder="No cap" />
            </label>
          </section>

          <section className="card p-4 space-y-3">
            <p className="font-semibold">4. Alerts</p>
            <select name="alertMode" defaultValue={box?.alertMode ?? "A_AND_B"}>
              <option value="A_AND_B">A + B (default)</option>
              <option value="A_ONLY">A only</option>
              <option value="APP_ONLY">App only</option>
            </select>
            <p className="text-xs text-muted">Pushes stay A/B. C and D never page you.</p>
          </section>

          <button className="btn-primary" type="submit">
            Save buy box
          </button>
        </form>
      </main>
      <BuyerNav />
    </div>
  );
}
