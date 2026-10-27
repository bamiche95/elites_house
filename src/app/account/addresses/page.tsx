import type { Metadata } from "next";

import { AddressManager, type SavedAddress } from "@/components/account/address-manager";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Your addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const user = await requireUser("/account/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const mapped: SavedAddress[] = addresses.map((address) => ({
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    county: address.county ?? "",
    postcode: address.postcode,
    country: address.country,
    isDefault: address.isDefault,
  }));

  return <AddressManager addresses={mapped} />;
}
