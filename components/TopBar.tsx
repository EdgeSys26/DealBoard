import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { SwitchRoleButton } from "@/components/SwitchRoleButton";

function roleWord(role: SessionUser["role"]) {
  if (role === "SELLER") return "Seller";
  if (role === "ADMIN") return "Admin";
  return "Buyer";
}

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
        <Link href="/" className="text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
          Deal Board
        </Link>
        <h1 className="text-lg font-semibold leading-tight">{title ?? "Deals"}</h1>
      </div>
      <div className="text-right">
        <p className="text-[11px] font-semibold text-muted">{roleWord(user.role)}</p>
        <SwitchRoleButton />
      </div>
    </header>
  );
}
