"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, MessageCircle, LayoutGrid, UserRound } from "lucide-react";

export function BuyerNav() {
  return (
    <nav className="bottom-nav buyer-bottom-nav sticky bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 gap-1">
        <Item href="/home" label="Home" icon={Home} />
        <Item href="/buy-box" label="Buy box" icon={SlidersHorizontal} />
        <Item href="/messages" label="Inbox" icon={MessageCircle} />
        <Item href="/settings" label="You" icon={UserRound} />
      </div>
    </nav>
  );
}

export function SellerNav() {
  return (
    <nav className="bottom-nav sticky bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-4 gap-1">
        <Item href="/seller" label="Board" icon={LayoutGrid} />
        <Item href="/seller/new" label="New" icon={Home} />
        <Item href="/messages" label="Inbox" icon={MessageCircle} />
        <Item href="/seller/billing" label="Slots" icon={UserRound} />
      </div>
    </nav>
  );
}

function Item({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Home;
}) {
  const path = usePathname();
  const on = path === href || (href !== "/home" && href !== "/seller" && path.startsWith(href));
  const homeOn = href === "/home" && path === "/home";
  const sellerOn = href === "/seller" && path === "/seller";
  const active = on || homeOn || sellerOn;
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      <Icon size={20} />
      {label}
    </Link>
  );
}
