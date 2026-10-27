import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createProductAction } from "@/app/admin/actions/catalog";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { TEXTURES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All products
      </Link>

      <div>
        <h1 className="font-display text-3xl text-espresso">New product</h1>
        <p className="mt-1 text-sm text-mocha">
          Create the product, then add variants and imagery from its edit page.
        </p>
      </div>

      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <form action={createProductAction} className="space-y-6 border border-line bg-cream p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" htmlFor="name">
            <Input id="name" name="name" required minLength={2} maxLength={120} />
          </Field>
          <Field label="Slug (optional)" htmlFor="slug" hint="Leave blank to generate from the name.">
            <Input id="slug" name="slug" maxLength={120} />
          </Field>
        </div>

        <Field label="Subtitle" htmlFor="subtitle">
          <Input id="subtitle" name="subtitle" maxLength={160} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category" htmlFor="categoryId">
            <Select id="categoryId" name="categoryId" required defaultValue="">
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Texture" htmlFor="texture">
            <Select id="texture" name="texture" defaultValue="BONE_STRAIGHT">
              {TEXTURES.map((texture) => (
                <option key={texture.value} value={texture.value}>
                  {texture.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Colour" htmlFor="color">
            <Input id="color" name="color" defaultValue="Natural Black" maxLength={60} />
          </Field>
        </div>

        <Field label="Description" htmlFor="description" hint="At least 20 characters.">
          <Textarea
            id="description"
            name="description"
            required
            minLength={20}
            className="min-h-28"
          />
        </Field>

        <Field label="Details (one per line)" htmlFor="details">
          <Textarea id="details" name="details" className="min-h-28" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (£)" htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue="0.00"
            />
          </Field>
          <Field label="Opening stock" htmlFor="stock">
            <Input id="stock" name="stock" type="number" min="0" step="1" defaultValue="0" />
          </Field>
          <Field label="Length (inches, optional)" htmlFor="lengthInches">
            <Input
              id="lengthInches"
              name="lengthInches"
              type="number"
              min="0"
              max="60"
              step="1"
            />
          </Field>
        </div>

        <Field
          label="Image URL (optional)"
          htmlFor="imageUrl"
          hint="Use /images/… for local art, or a full https URL."
        >
          <Input id="imageUrl" name="imageUrl" maxLength={500} />
        </Field>

        <div className="space-y-2">
          <Label>Visibility</Label>
          <Checkbox id="isActive" name="isActive" defaultChecked label="Publish on the storefront" />
          <Checkbox id="isFeatured" name="isFeatured" label="Feature on the homepage" />
        </div>

        <Button type="submit">Create product</Button>
      </form>
    </div>
  );
}
