import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

export function TopBar({
  user,
  title,
}: {
  user: SessionUser;
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 bg-canvas/90 backdrop-blur">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
          Deal Board
        </p>
        <h1 className="text-lg font-semibold leading-tight">{title ?? "Deals"}</h1>
      </div>
      <Link
        href={user.role === "ADMIN" ? "/admin" : user.role === "SELLER" ? "/seller" : "/settings"}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-line"
      >
        {user.role === "BUYER" ? "Buyer" : user.role === "SELLER" ? "Seller" : "Admin"}
      </Link>
    </header>
  );
}
