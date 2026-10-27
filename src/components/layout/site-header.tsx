"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchDialog } from "@/components/search/search-dialog";
import { selectCartCount, useCartStore } from "@/lib/cart-store";
import { mainNav, siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const count = useCartStore(selectCartCount);
  const hydrated = useCartStore((state) => state.hydrated);
  const openCart = useCartStore((state) => state.openDrawer);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[60] border-b border-line/80 bg-ivory/95 backdrop-blur transition-shadow",
          elevated && "shadow-[0_12px_32px_-28px_rgba(23,17,14,0.55)]",
        )}
      >
        <div className="container-luxe">
          <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="text-espresso lg:hidden"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
                {mainNav.slice(0, 6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "text-[0.66rem] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-gold",
                      pathname === item.href ? "text-gold" : "text-espresso",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <Link
              href="/"
              aria-label={`${siteConfig.name} home`}
              className="justify-self-center text-center"
            >
              <span className="font-display text-2xl uppercase tracking-[0.24em] text-espresso sm:text-[1.7rem]">
                {siteConfig.name}
              </span>
              <span className="mt-0.5 hidden text-[0.55rem] uppercase tracking-[0.34em] text-gold sm:block">
                Human Hair Atelier
              </span>
            </Link>

            <div className="flex items-center justify-end gap-4 sm:gap-5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="text-espresso transition-colors hover:text-gold"
              >
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/account"
                aria-label="Your account"
                className="hidden text-espresso transition-colors hover:text-gold sm:block"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label={`Open bag${hydrated && count > 0 ? `, ${count} items` : ""}`}
                className="relative text-espresso transition-colors hover:text-gold"
              >
                <ShoppingBag className="h-5 w-5" />
                {hydrated && count > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold leading-none text-ink">
                    {count}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden border-t border-line bg-ivory transition-[max-height] duration-300 lg:hidden",
            mobileOpen ? "max-h-[32rem]" : "max-h-0",
          )}
        >
          <nav aria-label="Mobile" className="container-luxe flex flex-col py-4">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line/60 py-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-espresso"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link
                href="/account"
                className="border border-line py-3 text-center text-[0.66rem] uppercase tracking-[0.18em] text-espresso"
              >
                Account
              </Link>
              <Link
                href="/contact"
                className="border border-line py-3 text-center text-[0.66rem] uppercase tracking-[0.18em] text-espresso"
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <CartDrawer />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
