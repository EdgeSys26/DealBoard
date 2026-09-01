import Link from "next/link";

export function DashTabs({
  items,
  active,
}: {
  items: { id: string; href: string; label: string }[];
  active: string;
}) {
  return (
    <nav className="dash-tabs px-4" aria-label="Section">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="dash-tab"
          data-on={active === item.id ? "true" : "false"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
