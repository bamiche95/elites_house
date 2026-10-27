import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { env, isGoogleAuthEnabled } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your LushTresses account to track orders and save addresses.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  const showDemo = process.env.NODE_ENV !== "production";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your atelier"
      description="Track orders, save addresses and check out in a few taps."
    >
      <Suspense fallback={<div className="h-64 animate-pulse bg-cream" />}>
        <LoginForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>

      {showDemo ? (
        <div className="mt-8 border border-line bg-cream p-4 text-[0.68rem] leading-relaxed text-mocha">
          <p className="font-semibold uppercase tracking-[0.14em] text-espresso">
            Local demo accounts
          </p>
          <p className="mt-2">
            Admin — {env.seedAdminEmail} / {env.seedAdminPassword}
          </p>
          <p>
            Customer — {env.seedCustomerEmail} / {env.seedCustomerPassword}
          </p>
        </div>
      ) : null}
    </AuthShell>
  );
}
