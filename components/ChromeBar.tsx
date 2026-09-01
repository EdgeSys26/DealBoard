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
];

const ROLES: { role: Role; label: string }[] = [
  { role: "BUYER", label: "Buyer" },
  { role: "SELLER", label: "Seller" },
  { role: "ADMIN", label: "Admin" },
];

export function ChromeBar({ current }: { current: Role }) {
  const path = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab") ?? "";
  const seller = path === "/seller" || path.startsWith("/seller/");
  const buyer = path === "/home";
  const tabs = path === "/seller" || path === "/seller/billing" ? SELLER_TABS : buyer ? BUYER_TABS : null;
  const active = seller
    ? tab === "offers" || tab === "title" || tab === "billing"
      ? tab
      : "listings"
    : tab === "held" || tab === "offers" || tab === "title" || tab === "saved"
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
