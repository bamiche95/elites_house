"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Package, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1">
      {links.map((link) => {
        const active =
          link.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
              active
                ? "bg-ink text-ivory"
                : "text-mocha hover:bg-cream hover:text-espresso",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
