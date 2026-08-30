import { usd } from "@/lib/money";

type Comp = {
  id: string;
  address: string;
  salePrice: number;
  lat: number;
  lng: number;
  distanceMi: number;
};

export function CompMap({
  subject,
  comps,
}: {
  subject: { lat: number; lng: number; address: string };
  comps: Comp[];
}) {
  const points = [
    { ...subject, salePrice: null as number | null, label: "Subject", kind: "subject" },
    ...comps.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      address: c.address,
      salePrice: c.salePrice,
      label: c.address,
      kind: "comp",
    })),
  ];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats) - 0.002;
  const maxLat = Math.max(...lats) + 0.002;
  const minLng = Math.min(...lngs) - 0.002;
  const maxLng = Math.max(...lngs) + 0.002;

  function xy(lat: number, lng: number) {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return { x, y };
  }

  return (
    <div>
      <div className="relative h-52 overflow-hidden rounded-2xl bg-[#d7e3d4] border border-line">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(#c9d4c6 1px, transparent 1px), linear-gradient(90deg, #c9d4c6 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <p className="absolute top-2 right-2 text-[10px] font-semibold bg-white/80 px-2 py-1 rounded-full">
          Noblesville comps
        </p>
        {points.map((p) => {
          const { x, y } = xy(p.lat, p.lng);
          const subjectPin = p.kind === "subject";
          return (
            <div
              key={p.address}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={p.address}
            >
              <span
                className={`block rounded-full border-2 border-white shadow ${
                  subjectPin ? "h-4 w-4 bg-accent" : "h-3 w-3 bg-[#111827]"
                }`}
              />
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-2">
        {comps.map((c) => (
          <li key={c.id} className="flex justify-between text-sm">
            <span className="text-muted">
              {c.address} · {c.distanceMi.toFixed(1)} mi
            </span>
            <span className="font-semibold">{usd(c.salePrice)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
