import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { ChromeBar } from "@/components/ChromeBar";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      {user ? (
        <Suspense fallback={<header className="dash-chrome" />}>
          <ChromeBar current={user.role} />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}
