import { getSessionUser } from "@/lib/auth";
import { RoleBar } from "@/components/RoleBar";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      {user ? <RoleBar current={user.role} /> : null}
      {children}
    </>
  );
}
