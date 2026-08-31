import type { SessionUser } from "@/lib/auth";

export function TopBar({
  user,
  title,
}: {
  user: SessionUser;
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 pt-3 pb-3 bg-canvas/90 backdrop-blur">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-accent">
          Deal Board
        </p>
        <h1 className="text-lg font-semibold leading-tight">{title ?? "Deals"}</h1>
      </div>
      <p className="text-[11px] font-semibold text-muted">
        {user.role === "SELLER" ? "Seller" : user.role === "ADMIN" ? "Admin" : "Buyer"}
      </p>
    </header>
  );
}
