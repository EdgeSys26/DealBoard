import { toggleCityFilterAction } from "@/lib/actions";

export function CityChipRow({
  cities,
  excluded,
  view,
}: {
  cities: string[];
  excluded: string[];
  view?: string;
}) {
  if (cities.length === 0) return null;
  return (
    <div className="city-chips">
      {cities.map((city) => (
        <form key={city} action={toggleCityFilterAction}>
          <input type="hidden" name="city" value={city} />
          {view === "all" ? <input type="hidden" name="view" value="all" /> : null}
          <button
            type="submit"
            className="chip"
            data-on={excluded.includes(city) ? "false" : "true"}
          >
            {city}
          </button>
        </form>
      ))}
    </div>
  );
}
