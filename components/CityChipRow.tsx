import { cookies } from "next/headers";
import { toggleCityFilterAction } from "@/lib/city-filter";
import { HOME_OFF_COOKIE, parseExcludedCities } from "@/lib/area-cities";

export async function CityChipRow({
  cities,
  view,
}: {
  cities: string[];
  excluded?: string[];
  view?: string;
}) {
  if (cities.length === 0) return null;
  const homeOff = parseExcludedCities((await cookies()).get(HOME_OFF_COOKIE)?.value);
  return (
    <div className="city-chips">
      {cities.map((city) => (
        <form key={city} action={toggleCityFilterAction}>
          <input type="hidden" name="city" value={city} />
          {view === "all" ? <input type="hidden" name="view" value="all" /> : null}
          <button
            type="submit"
            className="chip"
            data-on={homeOff.includes(city) ? "false" : "true"}
          >
            {city}
          </button>
        </form>
      ))}
    </div>
  );
}
