import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { isGoogleAuthEnabled } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Create an account",
  description: "Create a LushTresses account for faster checkout and order tracking.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Join the atelier"
      title="Create your account"
      description="Faster checkout, saved addresses and first access to new batches."
      image="/images/collection-bundles.jpg"
    >
      <Suspense fallback={<div className="h-80 animate-pulse bg-cream" />}>
        <RegisterForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
