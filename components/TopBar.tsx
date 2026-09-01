import type { SessionUser } from "@/lib/auth";

export function TopBar({
  user,
  title,
}: {
  user: SessionUser;
  title?: string;
}) {
  return (
    <header className="flex items-center justify-between px-4 pt-2 pb-1">
      <div>
        <h1 className="text-base font-semibold tracking-tight leading-tight">{title ?? "Deals"}</h1>
      </div>
      <p className="text-[11px] font-semibold text-muted">
        {user.role === "SELLER" ? "Seller" : user.role === "ADMIN" ? "Admin" : "Buyer"}
      </p>
    </header>
  );
}
