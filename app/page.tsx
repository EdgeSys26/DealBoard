import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { demoLoginAction, loginAction } from "@/lib/actions";
import type { Role } from "@/lib/types";
import { PHOTO_CICERO, PHOTO_PLEASANT } from "@/lib/listing-photos";

export const dynamic = "force-dynamic";

function roleHome(role: Role) {
  if (role === "SELLER") return "/seller";
  if (role === "ADMIN") return "/admin";
  return "/home";
}

function roleWord(role: Role) {
  if (role === "SELLER") return "seller";
  if (role === "ADMIN") return "admin";
  return "buyer";
}

const MOCKS = [
  {
    letter: "A+",
    tone: "green",
    photo: PHOTO_PLEASANT,
    address: "1847 Pleasant St",
    city: "Noblesville, IN 46060",
    price: "$189k",
    spec: "3/1 · 1,216 sf · medium",
  },
  {
    letter: "B",
    tone: "yellow",
    photo: PHOTO_CICERO,
    address: "622 Cicero Ave",
    city: "Noblesville, IN 46060",
    price: "$241k",
    spec: "3/2 · 1,408 sf · medium",
  },
] as const;

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <main className="min-h-svh px-5 pt-12 pb-10 flex flex-col">
      <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-accent">
        Deal Board
      </p>
      <h1 className="mt-3 text-[2rem] font-semibold tracking-tight leading-[1.15]">
        Buyers and sellers meet here.
        <br />
        We cut the back-and-forth.
      </h1>
      <p className="mt-3 text-sm text-muted leading-relaxed">
        Wholesalers list assignable contracts. Cash buyers grade the fit, offer
        inside a floor, and pick a title time. Deposit goes to title — not to us,
        not to the seller&apos;s bank.
      </p>
      <p className="mt-3 text-sm font-semibold leading-relaxed">
        We don&apos;t sell houses and we don&apos;t hold deposits.
      </p>

      <div className="mt-7 match-grid">
        {MOCKS.map((card) => (
          <article key={card.address} className="card overflow-hidden">
            <div className="relative h-40 bg-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.photo} alt="" className="h-full w-full object-cover" />
              <span className={`grade-pill ${card.tone}`}>{card.letter}</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between gap-2">
                <p className="font-semibold leading-tight">{card.address}</p>
                <p className="font-semibold text-accent">{card.price}</p>
              </div>
              <p className="text-xs text-muted mt-1">{card.city}</p>
              <p className="text-xs text-muted mt-1">{card.spec}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="card mt-7 p-4 space-y-3">
        <p className="text-sm font-semibold">Preview the board</p>
        <p className="text-xs text-muted">
          No signup. Same demo the owner clicks on tawny.
        </p>
        {user ? (
          <>
            <p className="text-xs text-muted">
              Signed in as {user.name} · {roleWord(user.role)}
            </p>
            <Link href={roleHome(user.role)} className="btn-primary block text-center">
              Continue as {roleWord(user.role)}
            </Link>
          </>
        ) : null}
        <form action={demoLoginAction}>
          <input type="hidden" name="role" value="BUYER" />
          <button className={user ? "btn-secondary" : "btn-primary"} type="submit">
            Enter as buyer
          </button>
        </form>
        <form action={demoLoginAction}>
          <input type="hidden" name="role" value="SELLER" />
          <button className="btn-secondary" type="submit">
            Enter as seller
          </button>
        </form>
        <form action={demoLoginAction}>
          <input type="hidden" name="role" value="ADMIN" />
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
