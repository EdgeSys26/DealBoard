import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { demoLoginAction, loginAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    if (user.role === "SELLER") redirect("/seller");
    if (user.role === "ADMIN") redirect("/admin");
    redirect("/home");
  }

  return (
    <main className="min-h-svh px-5 pt-16 pb-10 flex flex-col">
      <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-accent">
        Deal Board
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Assignable contracts.<br />Not a listing portal.
      </h1>
      <p className="mt-3 text-sm text-muted leading-relaxed">
        Wholesalers post purchase contracts. Cash buyers bid in-app. Title holds
        the deposit. Independent of Frontburner and Edge.Sys.
      </p>

      <div className="card mt-8 p-4 space-y-3">
        <p className="text-sm font-semibold">Demo login — no signup</p>
        <form action={demoLoginAction.bind(null, "BUYER")}>
          <button className="btn-primary" type="submit">
            Enter as buyer
          </button>
        </form>
        <form action={demoLoginAction.bind(null, "SELLER")}>
          <button className="btn-secondary" type="submit">
            Enter as seller
          </button>
        </form>
        <form action={demoLoginAction.bind(null, "ADMIN")}>
          <button className="btn-secondary" type="submit">
            Enter as admin
          </button>
        </form>
        <p className="text-[11px] text-muted">
          buyer@dealboard.local · seller@dealboard.local · admin@dealboard.local
          — password <span className="font-semibold text-ink">demo</span>
        </p>
      </div>

      <form action={loginAction} className="card mt-4 p-4 space-y-3">
        <p className="text-sm font-semibold">Or sign in</p>
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field">
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn-primary" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
