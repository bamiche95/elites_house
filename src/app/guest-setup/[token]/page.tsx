import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { GuestSetupForm } from "@/components/auth/guest-setup-form";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";
import { hashToken } from "@/lib/tokens";

export const metadata: Metadata = buildMetadata({
  title: "Finish setting up your account",
  description: "Set a password for your LushTresses account.",
  path: "/guest-setup",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function GuestSetupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const record = await prisma.accountSetupToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { email: true, passwordHash: true } } },
  });

  const invalid = !record || record.usedAt || record.expiresAt < new Date();
  const alreadySet = Boolean(record?.user.passwordHash);

  return (
    <AuthShell
      eyebrow="One last step"
      title="Set your password"
      description={
        record?.user.email
          ? `Your orders are already linked to ${record.user.email}. Choose a password to access them any time.`
          : "Choose a password to access your orders any time."
      }
      image="/images/collection-frontals.jpg"
    >
      {invalid ? (
        <div className="border border-line bg-cream p-6 text-sm leading-relaxed text-mocha">
          <p className="font-display text-xl text-espresso">This link has expired</p>
          <p className="mt-2">
            Setup links are valid for 48 hours. Sign in if you already set a password, or
            contact the atelier and we&apos;ll send a fresh link.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="border border-ink px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso"
            >
              Sign in
            </Link>
            <Link
              href="/contact"
              className="border border-line px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso"
            >
              Contact us
            </Link>
          </div>
        </div>
      ) : alreadySet ? (
        <div className="border border-line bg-cream p-6 text-sm leading-relaxed text-mocha">
          <p className="font-display text-xl text-espresso">You&apos;re all set</p>
          <p className="mt-2">This account already has a password. Sign in to continue.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex border border-ink px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-espresso"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <GuestSetupForm token={token} />
      )}
    </AuthShell>
  );
}
