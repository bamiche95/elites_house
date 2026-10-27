"use client";

import { useRouter } from "next/navigation";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { AddressFields } from "@/components/checkout/address-fields";
import { emptyAddress, type AddressState } from "@/components/checkout/types";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export type SavedAddress = AddressState & {
  id: string;
  label: string | null;
  isDefault: boolean;
};

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<{ type: "new" } | { type: "edit"; id: string } | null>(null);
  const [form, setForm] = useState<AddressState>(emptyAddress);
  const [label, setLabel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setMode({ type: "new" });
    setForm(emptyAddress);
    setLabel("");
    setIsDefault(addresses.length === 0);
    setError(null);
  }

  function startEdit(address: SavedAddress) {
    setMode({ type: "edit", id: address.id });
    setForm({
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      county: address.county ?? "",
      postcode: address.postcode,
      country: address.country,
    });
    setLabel(address.label ?? "");
    setIsDefault(address.isDefault);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/account/addresses", {
        method: mode?.type === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode?.type === "edit" ? { id: mode.id } : {}),
          ...form,
          label: label.trim() || undefined,
          isDefault,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't save that address.");
      toast({ title: "Address saved" });
      setMode(null);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "We couldn't save that address.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this address?")) return;
    try {
      const response = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't remove that address.");
      toast({ title: "Address removed" });
      router.refresh();
    } catch (deleteError) {
      toast({
        title: "Couldn't remove address",
        description: deleteError instanceof Error ? deleteError.message : undefined,
        tone: "error",
      });
    }
  }

  async function makeDefault(address: SavedAddress) {
    try {
      const response = await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: address.id,
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 ?? undefined,
          city: address.city,
          county: address.county ?? undefined,
          postcode: address.postcode,
          country: address.country,
          label: address.label ?? undefined,
          isDefault: true,
        }),
      });
      if (!response.ok) throw new Error("Couldn't update the default address.");
      toast({ title: "Default address updated" });
      router.refresh();
    } catch (defaultError) {
      toast({
        title: "Couldn't update address",
        description: defaultError instanceof Error ? defaultError.message : undefined,
        tone: "error",
      });
    }
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-espresso">Addresses</h2>
          <p className="mt-1 text-sm text-mocha">
            Save delivery addresses to check out faster next time.
          </p>
        </div>
        <Button onClick={startNew} variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="border border-dashed border-line bg-cream px-6 py-14 text-center">
          <p className="font-display text-2xl text-espresso">No saved addresses</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-mocha">
            Add an address now, or save one at checkout next time.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="border border-line bg-ivory p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-gold">
                    {address.label || "Address"}
                  </p>
                  <p className="mt-2 text-sm text-espresso">{address.fullName}</p>
                  <p className="mt-1 text-xs leading-relaxed text-mocha">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}
                    {address.county ? `, ${address.county}` : ""}
                    <br />
                    {address.postcode} · {address.country}
                    <br />
                    {address.phone}
                  </p>
                </div>
                {address.isDefault ? (
                  <span className="inline-flex items-center gap-1 border border-gold/40 bg-gold/10 px-2 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-[#8a6535]">
                    <Star className="h-3 w-3" /> Default
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-[0.62rem] uppercase tracking-[0.14em]">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  className="inline-flex items-center gap-1.5 text-espresso hover:text-gold"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                {!address.isDefault ? (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    className="inline-flex items-center gap-1.5 text-mocha hover:text-espresso"
                  >
                    <Star className="h-3 w-3" /> Make default
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(address.id)}
                  className="inline-flex items-center gap-1.5 text-mocha hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mode ? (
        <div className="border border-line bg-cream p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-2xl text-espresso">
              {mode.type === "edit" ? "Edit address" : "New address"}
            </h3>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha underline underline-offset-4"
            >
              Cancel
            </button>
          </div>

          <div className="mt-5 max-w-2xl space-y-4">
            <Field label="Label (optional)" htmlFor="address-label">
              <Input
                id="address-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Home, studio, mum's house…"
                maxLength={40}
              />
            </Field>
            <AddressFields
              value={form}
              onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
              idPrefix="account"
            />
            <Checkbox
              id="default-address"
              checked={isDefault}
              onChange={(event) => setIsDefault(event.target.checked)}
              label="Use as my default delivery address"
            />
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save address"}
              </Button>
              <Button variant="ghost" onClick={() => setMode(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

