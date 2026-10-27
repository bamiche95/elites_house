"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 border border-line px-4 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha transition-colors hover:border-ink hover:text-espresso"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}
