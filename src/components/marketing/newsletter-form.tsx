"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Something went wrong");
      setDone(true);
      setEmail("");
      toast({ title: "You're on the list", description: data.message });
    } catch (error) {
      toast({
        title: "Couldn't subscribe",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-espresso">
        Welcome to the atelier list. Check your inbox for a little something.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={`newsletter-${source}`} className="sr-only">
        Email address
      </label>
      <Input
        id={`newsletter-${source}`}
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Your email address"
        autoComplete="email"
        className="h-12 flex-1 border-line bg-white/70"
      />
      <Button type="submit" disabled={loading} className="h-12 shrink-0">
        {loading ? "Adding…" : "Join the list"}
      </Button>
    </form>
  );
}
