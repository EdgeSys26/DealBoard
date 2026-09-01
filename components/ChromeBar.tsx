"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { demoLoginAction, logoutAction } from "@/lib/actions";
import type { Role } from "@/lib/types";
import { DashTabs } from "@/components/DashTabs";

const SELLER_TABS = [
  { id: "listings", href: "/seller?tab=listings", label: "Listings" },
  { id: "offers", href: "/seller?tab=offers", label: "Offers" },
  { id: "title", href: "/seller?tab=title", label: "Title" },
  { id: "billing", href: "/seller?tab=billing", label: "Billing" },
];

const BUYER_TABS = [
  { id: "matches", href: "/home?tab=matches", label: "Matches" },
  { id: "held", href: "/home?tab=held", label: "Held" },
  { id: "offers", href: "/home?tab=offers", label: "Offers" },
  { id: "title", href: "/home?tab=title", label: "Title" },
  { id: "saved", href: "/home?tab=saved", label: "Saved" },
  { id: "hidden", href: "/home?tab=hidden", label: "Hidden" },
];

const ADMIN_TABS = [
  { id: "levers", href: "/admin?tab=levers", label: "Levers" },
  { id: "people", href: "/admin?tab=people", label: "People" },
  { id: "listings", href: "/admin?tab=listings", label: "Listings" },
  { id: "billing", href: "/admin?tab=billing", label: "Billing" },
  { id: "queue", href: "/admin?tab=queue", label: "Queue" },
];

const ROLES: { role: Role; label: string }[] = [
  { role: "BUYER", label: "Buyer" },
  { role: "SELLER", label: "Seller" },
  { role: "ADMIN", label: "Admin" },
];

export function ChromeBar({
  current,
  sellerBadges = { newOfferCount: 0, expiring: false },
}: {
  current: Role;
  sellerBadges?: { newOfferCount: number; expiring: boolean };
}) {
  const path = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "";
  const seller = path === "/seller" || path.startsWith("/seller/");
  const buyer = path === "/home";
  const admin = path === "/admin";
  const sellerTabs = SELLER_TABS.map((item) => {
    if (item.id === "offers" && sellerBadges.newOfferCount > 0 && tab !== "offers") {
      return { ...item, dot: "green" as const, note: `${sellerBadges.newOfferCount} new` };
    }
    if (item.id === "listings" && sellerBadges.expiring) {
      return { ...item, dot: "red" as const };
    }
    return item;
  });
  const tabs =
    path === "/seller" || path === "/seller/billing"
      ? sellerTabs
      : buyer
        ? BUYER_TABS
        : admin
          ? ADMIN_TABS
          : null;
  const active = admin
    ? tab === "people" || tab === "listings" || tab === "billing" || tab === "queue"
      ? tab
      : "levers"
    : seller
      ? tab === "offers" || tab === "title" || tab === "billing"
        ? tab
        : "listings"
      : tab === "held" || tab === "offers" || tab === "title" || tab === "saved" || tab === "hidden"
        ? tab
        : "matches";

  return (
    <header className="dash-chrome">
      <Link href={current === "SELLER" ? "/seller" : current === "ADMIN" ? "/admin" : "/home"} className="dash-brand">
        Deal Board
      </Link>
      {tabs ? <DashTabs items={tabs} active={active} /> : <div className="dash-tabs" />}
      <div className="role-bar-pills">
        {ROLES.map(({ role, label }) => (
          <form key={role} action={demoLoginAction}>
            <input type="hidden" name="role" value={role} />
            <button type="submit" className={`role-pill ${current === role ? "is-on" : ""}`}>
              {label}
            </button>
          </form>
        ))}
        <form action={logoutAction}>
          <button type="submit" className="role-pill">Out</button>
        </form>
      </div>
    </header>
  );
}
