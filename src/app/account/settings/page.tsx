import type { Metadata } from "next";
import Link from "next/link";

import { PasswordForm, ProfileForm } from "@/components/account/settings-forms";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const user = await requireUser("/account/settings");
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl text-espresso">Settings</h2>
        <p className="mt-1 text-sm text-mocha">
          Manage your details, password and email preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-ivory p-6">
          <h3 className="font-display text-2xl text-espresso">Your details</h3>
          <p className="mt-1 text-xs text-mocha">
            Signed in as <span className="text-espresso">{user.email}</span>
          </p>
          <div className="mt-5">
            <ProfileForm
              name={user.name ?? ""}
              phone={user.phone ?? ""}
              marketingOptIn={user.marketingOptIn}
            />
          </div>
        </section>

        <section className="border border-line bg-ivory p-6">
          <h3 className="font-display text-2xl text-espresso">
            {record?.passwordHash ? "Password" : "Set a password"}
          </h3>
          <p className="mt-1 text-xs text-mocha">
            {record?.passwordHash
              ? "Choose a strong password you don't use elsewhere."
              : "Your account was created at checkout. Set a password to sign in next time."}
          </p>
          <div className="mt-5">
            <PasswordForm hasPassword={Boolean(record?.passwordHash)} />
          </div>
        </section>
      </div>

      <section className="border border-line bg-cream p-6">
        <h3 className="font-display text-xl text-espresso">Account information</h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">Member since</dt>
            <dd className="mt-1 text-espresso">{formatDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">Account type</dt>
            <dd className="mt-1 text-espresso">
              {user.role === "ADMIN" ? "Administrator" : "Customer"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">
              Marketing emails
            </dt>
            <dd className="mt-1 text-espresso">
              {user.marketingOptIn ? "Subscribed" : "Not subscribed"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs leading-relaxed text-mocha">
          You can{" "}
          <Link
            href={`/unsubscribe/${user.unsubscribeToken}`}
            className="underline underline-offset-2"
          >
            unsubscribe from marketing emails
          </Link>{" "}
          at any time, or read how we handle your data in our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
