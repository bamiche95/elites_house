"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

export function ReviewForm({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState("5");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          authorName: formData.get("authorName"),
          authorEmail: formData.get("authorEmail"),
          title: formData.get("title"),
          body: formData.get("body"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "We couldn't save your review.");
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "We couldn't save your review.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border border-success/30 bg-success/5 p-6 text-sm text-espresso">
        <p className="flex items-center gap-2 font-medium">
          <Check className="h-4 w-4 text-success" /> Thank you — your review is with the team.
        </p>
        <p className="mt-2 text-mocha">
          Reviews are checked by our atelier before publishing, usually within one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-line bg-cream p-6">
      <div>
        <h3 className="font-display text-2xl text-espresso">Write a review</h3>
        <p className="mt-1 text-xs text-mocha">
          Wore it? Tell others how it installed, washed and held up.
        </p>
      </div>

      <Field label="Rating" htmlFor="rating">
        <Select id="rating" value={rating} onChange={(event) => setRating(event.target.value)}>
          <option value="5">5 — Exceptional</option>
          <option value="4">4 — Very good</option>
          <option value="3">3 — Good</option>
          <option value="2">2 — Disappointing</option>
          <option value="1">1 — Poor</option>
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="authorName">
          <Input id="authorName" name="authorName" required minLength={2} maxLength={60} />
        </Field>
        <Field label="Email (not published)" htmlFor="authorEmail">
          <Input id="authorEmail" name="authorEmail" type="email" autoComplete="email" />
        </Field>
      </div>

      <Field label="Headline" htmlFor="title">
        <Input id="title" name="title" maxLength={90} placeholder="Sum it up in a line" />
      </Field>

      <Field label="Your review" htmlFor="body">
        <Textarea
          id="body"
          name="body"
          required
          minLength={20}
          maxLength={1500}
          placeholder="How did it wash, style and wear?"
        />
      </Field>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Submit review"}
      </Button>
      <p className="text-[0.65rem] leading-relaxed text-mocha">
        By submitting you agree to our review guidelines. We publish first names only.
      </p>
    </form>
  );
}
