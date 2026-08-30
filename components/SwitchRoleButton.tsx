import { logoutAction } from "@/lib/actions";

export function SwitchRoleButton({
  className = "text-xs font-semibold text-accent",
}: {
  className?: string;
}) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>
        Switch role
      </button>
    </form>
  );
}
