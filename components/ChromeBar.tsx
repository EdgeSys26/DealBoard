"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { demoLoginAction, logoutAction } from "@/lib/actions";
import type { Role } from "@/lib/types";
import { DashTabs } from "@/components/DashTabs";
import { readStoredTheme, writeTheme } from "@/components/ThemeInit";

const SELLER_TABS = [
  { id: "listings", href: "/seller?tab=listings", label: "Listings" },
  { id: "offers", href: "/seller?tab=offers", label: "Offers" },
  { id: "title", href: "/seller?tab=title", label: "Title" },
  { id: "billing", href: "/seller?tab=billing", label: "Billing" },
];

const ADMIN_TABS = [
  { id: "dashboard", href: "/admin?tab=dashboard", label: "Dashboard" },
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
  const admin = path === "/admin";
  const sellerTabs = SELLER_TABS.map((item) => {
    if (item.id === "offers" && sellerBadges.newOfferCount > 0 && tab !== "offers") {
      return { ...item, dot: "green" as const, note: `${sellerBadges.newOfferCount} new` };
    }
    return item;
  });
  const tabs =
    path === "/seller" || path === "/seller/billing"
      ? sellerTabs
      : admin
        ? ADMIN_TABS
        : null;
  const active = admin
    ? tab === "people" || tab === "listings" || tab === "billing" || tab === "queue"
      ? tab
      : "dashboard"
    : tab === "offers" || tab === "title" || tab === "billing"
      ? tab
      : "listings";

  const [night, setNight] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const stored = readStoredTheme();
    writeTheme(stored);
    setNight(stored);
    setMounted(true);
  }, []);
  const nightOn = !mounted || night;

  return (
    <header className="dash-chrome">
      <Link href={current === "SELLER" ? "/seller" : current === "ADMIN" ? "/admin" : "/home"} className="dash-brand">
        Deal Board
      </Link>
      {tabs ? <DashTabs items={tabs} active={active} /> : <div className="dash-tabs" />}
      <div className="role-bar-pills">
        <button
          type="button"
          className="role-pill"
          aria-label={nightOn ? "Switch to light theme" : "Switch to dark theme"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            padding: 0,
          }}
          onClick={() => {
            const next = !nightOn;
            writeTheme(next);
            setNight(next);
          }}
        >
          {nightOn ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
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
