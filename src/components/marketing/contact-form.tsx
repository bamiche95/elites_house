"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

const SUBJECTS = [
  "Order enquiry",
  "Sizing & length advice",
  "Texture match",
  "Returns & exchanges",
  "Wholesale & press",
  "Something else",
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't send your message.");
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "We couldn't send your message.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-success/30 bg-success/5 p-6">
        <p className="flex items-center gap-2 font-display text-2xl text-espresso">
          <Check className="h-5 w-5 text-success" /> Message received
        </p>
        <p className="mt-2 text-sm leading-relaxed text-mocha">
          Thank you — your message is with the atelier. We reply within one working day,
          Monday to Friday. A copy has been emailed to you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name">
          <Input
            id="contact-name"
            autoComplete="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            minLength={2}
          />
        </Field>
        <Field label="Email address" htmlFor="contact-email">
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            maxLength={24}
          />
        </Field>
        <Field label="Subject" htmlFor="contact-subject">
          <Select
            id="contact-subject"
            value={form.subject}
            onChange={(event) => setForm({ ...form, subject: event.target.value })}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Message"
        htmlFor="contact-message"
        hint="Include your order number if your message is about an existing order."
      >
        <Textarea
          id="contact-message"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
          minLength={20}
          maxLength={2000}
          className="min-h-40"
        />
      </Field>

      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Sending…" : "Send message"}
      </Button>
      <p className="text-[0.65rem] leading-relaxed text-mocha">
        We use your details only to reply to this enquiry. See our privacy policy.
      </p>
    </form>
  );
}
