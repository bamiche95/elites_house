import "server-only";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "CUSTOMER" | "ADMIN";
  phone: string | null;
  marketingOptIn: boolean;
  unsubscribeToken: string;
  createdAt: Date;
};

/** Always re-reads the role from the database so admin demotions take effect. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      phone: true,
      marketingOptIn: true,
      unsubscribeToken: true,
      createdAt: true,
    },
  });

  return user;
}

export async function requireUser(callbackUrl = "/account") {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }
  if (user.role !== "ADMIN") {
    redirect("/account?error=forbidden");
  }
  return user;
}

export async function isAdmin() {
  const user = await getSessionUser();
  return user?.role === "ADMIN";
}
