import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { ChromeBar } from "@/components/ChromeBar";
import { getSellerTabBadges } from "@/lib/queries";

export async function AppChrome({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const sellerBadges =
    user && (user.role === "SELLER" || user.role === "ADMIN")
      ? await getSellerTabBadges(user.role === "ADMIN" ? "user_seller" : user.id)
      : { newOfferCount: 0, expiring: false };
  return (
    <>
      {user ? (
        <Suspense fallback={<header className="dash-chrome" />}>
          <ChromeBar current={user.role} sellerBadges={sellerBadges} />
        </Suspense>
      ) : null}
      {children}
    </>
  );
}
