import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { AccountNav } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/account/sign-out-button";
import { requireUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  const firstName = (user.name ?? "").split(" ")[0] || "lovely";

  return (
    <div className="container-luxe py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 font-display text-4xl text-espresso">Hello, {firstName}</h1>
          <p className="mt-1 text-sm text-mocha">
            {user.email}
            {user.role === "ADMIN" ? " · Administrator" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 border border-line px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso transition-colors hover:border-ink"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin dashboard
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <div>
          <AccountNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
