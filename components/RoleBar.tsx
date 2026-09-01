import { demoLoginAction, logoutAction } from "@/lib/actions";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; label: string }[] = [
  { role: "BUYER", label: "Buyer" },
  { role: "SELLER", label: "Seller" },
  { role: "ADMIN", label: "Admin" },
];

export function RoleBar({ current }: { current: Role }) {
  return (
    <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-line px-3 pt-[max(10px,env(safe-area-inset-top))] pb-2">
      <div className="role-bar-pills grid grid-cols-3 gap-1">
        {ROLES.map(({ role, label }) => {
          const on = current === role;
          return (
            <form key={role} action={demoLoginAction}>
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                className={`w-full rounded-full py-2 text-xs font-bold ${
                  on
                    ? "bg-accent text-card"
                    : "bg-card text-ink border border-line"
                }`}
              >
                {label}
              </button>
            </form>
          );
        })}
      </div>
      <form action={logoutAction} className="mt-1 text-center">
        <button type="submit" className="text-[11px] font-semibold text-accent">
          Switch role
        </button>
      </form>
    </div>
  );
}
