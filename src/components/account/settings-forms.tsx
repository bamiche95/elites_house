"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({
  name,
  phone,
  marketingOptIn,
}: {
  name: string;
  phone: string;
  marketingOptIn: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name, phone, marketingOptIn });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't save your details.");
      toast({ title: "Details updated" });
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn't save your details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" htmlFor="profile-name">
        <Input
          id="profile-name"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
          minLength={2}
        />
      </Field>

      <Field label="Phone" htmlFor="profile-phone">
        <Input
          id="profile-phone"
          autoComplete="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          maxLength={24}
        />
      </Field>

      <Checkbox
        id="profile-marketing"
        checked={form.marketingOptIn}
        onChange={(event) => setForm({ ...form, marketingOptIn: event.target.checked })}
        label="Email me restocks, styling notes and early access."
      />

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          password,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't update your password.");
      toast({ title: hasPassword ? "Password updated" : "Password set — welcome back" });
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "We couldn't update your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!hasPassword ? (
        <p className="border border-gold/40 bg-gold/10 px-3 py-2 text-xs leading-relaxed text-mocha">
          You checked out as a guest. Set a password now to keep your orders and saved
          addresses in one place.
        </p>
      ) : null}

      {hasPassword ? (
        <Field label="Current password" htmlFor="current-password">
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </Field>
      ) : null}

      <Field
        label={hasPassword ? "New password" : "Choose a password"}
        htmlFor="new-password"
        hint="At least 8 characters, with a letter and a number."
      >
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirm-password">
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
          minLength={8}
        />
      </Field>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Updating…" : hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}
