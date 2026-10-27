import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Atelier admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div>
      <div className="border-b border-line bg-cream">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="eyebrow">Atelier admin</p>
            <p className="mt-1 font-display text-xl text-espresso">
              {admin.name ?? admin.email}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[0.62rem] uppercase tracking-[0.16em]">
            <Link href="/" className="text-mocha hover:text-espresso">
              View storefront ↗
            </Link>
            <Link href="/account" className="text-mocha hover:text-espresso">
              Your account
            </Link>
          </div>
        </div>
      </div>

      <div className="container-luxe grid gap-8 py-8 lg:grid-cols-[15rem_1fr]">
        <div>
          <AdminNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
