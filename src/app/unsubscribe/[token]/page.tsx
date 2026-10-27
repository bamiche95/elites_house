import type { Metadata } from "next";
import { Check, MailX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Email preferences",
  description: "Manage your LushTresses email preferences.",
  path: "/unsubscribe",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [user, subscriber] = await Promise.all([
    prisma.user.findFirst({
      where: { unsubscribeToken: token },
      select: { id: true, email: true },
    }),
    prisma.newsletterSubscriber.findUnique({ where: { token } }),
  ]);

  let unsubscribedEmail: string | null = null;

  if (user) {
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { marketingOptIn: false } }),
      prisma.newsletterSubscriber.updateMany({
        where: { email: user.email },
        data: { isActive: false, unsubscribedAt: new Date() },
      }),
    ]);
    unsubscribedEmail = user.email;
  } else if (subscriber) {
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false, unsubscribedAt: new Date() },
    });
    unsubscribedEmail = subscriber.email;
  }

  return (
    <div className="container-luxe py-24">
      <div className="mx-auto max-w-lg border border-line bg-cream p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ivory text-gold">
          {unsubscribedEmail ? <Check className="h-6 w-6" /> : <MailX className="h-6 w-6" />}
        </span>
        <h1 className="mt-5 font-display text-3xl text-espresso">
          {unsubscribedEmail ? "You're unsubscribed" : "This link has expired"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mocha">
          {unsubscribedEmail
            ? `${unsubscribedEmail} has been removed from marketing emails. You'll still receive order and account emails.`
            : "We couldn't find a subscription for this link. It may have already been used, or you may have unsubscribed from a different email."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/shop">Continue shopping</ButtonLink>
          <ButtonLink href="/contact" variant="outline">
            Contact the atelier
          </ButtonLink>
        </div>
        {unsubscribedEmail ? (
          <p className="mt-5 text-xs leading-relaxed text-mocha">
            Changed your mind? Update your preferences in{" "}
            <a href="/account/settings" className="underline underline-offset-2">
              account settings
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
