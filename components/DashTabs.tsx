import Link from "next/link";

export function DashTabs({
  items,
  active,
}: {
  items: { id: string; href: string; label: string; dot?: "green" | "red"; note?: string }[];
  active: string;
}) {
  return (
    <nav className="dash-tabs" aria-label="Section">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="dash-tab"
          data-on={active === item.id ? "true" : "false"}
        >
          {item.label}
          {item.dot ? <span className={`tab-dot ${item.dot}`} aria-hidden="true" /> : null}
          {item.note ? <span className="tab-note">{item.note}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
