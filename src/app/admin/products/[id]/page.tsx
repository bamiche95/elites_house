import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { updateProductAction } from "@/app/admin/actions/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { TEXTURES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, created, error } = await searchParams;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { pricePence: "asc" } },
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All products
        </Link>
        <Link
          href={`/product/${product.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-mocha hover:text-espresso"
        >
          View on storefront <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div>
        <h1 className="font-display text-3xl text-espresso">{product.name}</h1>
        <p className="mt-1 text-sm text-mocha">
          {product.category.name} · updated {formatDate(product.updatedAt)}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge tone={product.isActive ? "success" : "neutral"}>
            {product.isActive ? "Live" : "Draft"}
          </Badge>
          {product.isFeatured ? <Badge tone="gold">Featured</Badge> : null}
          {product.isBestSeller ? <Badge tone="outline">Best seller</Badge> : null}
        </div>
      </div>

      {saved || created ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          {created ? "Product created. Add further variants below if needed." : "Product saved."}
        </p>
      ) : null}
      {error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <form action={updateProductAction} className="space-y-6 border border-line bg-cream p-6">
          <input type="hidden" name="productId" value={product.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" htmlFor="name">
              <Input id="name" name="name" defaultValue={product.name} required maxLength={120} />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle">
              <Input
                id="subtitle"
                name="subtitle"
                defaultValue={product.subtitle ?? ""}
                maxLength={160}
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              defaultValue={product.description}
              required
              minLength={20}
              className="min-h-32"
            />
          </Field>

          <Field label="Details (one per line)" htmlFor="details">
            <Textarea
              id="details"
              name="details"
              defaultValue={product.details ?? ""}
              className="min-h-32"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Colour" htmlFor="color">
              <Input id="color" name="color" defaultValue={product.color} maxLength={60} />
            </Field>
            <Field label="Texture (read-only)" htmlFor="textureView">
              <Select id="textureView" disabled defaultValue={product.texture}>
                {TEXTURES.map((texture) => (
                  <option key={texture.value} value={texture.value}>
                    {texture.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta title" htmlFor="metaTitle">
              <Input
                id="metaTitle"
                name="metaTitle"
                defaultValue={product.metaTitle ?? ""}
                maxLength={70}
              />
            </Field>
            <Field label="Meta description" htmlFor="metaDescription">
              <Input
                id="metaDescription"
                name="metaDescription"
                defaultValue={product.metaDescription ?? ""}
                maxLength={160}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Checkbox
              id="isActive"
              name="isActive"
              defaultChecked={product.isActive}
              label="Publish on the storefront"
            />
            <Checkbox
              id="isFeatured"
              name="isFeatured"
              defaultChecked={product.isFeatured}
              label="Feature on the homepage"
            />
            <Checkbox
              id="isBestSeller"
              name="isBestSeller"
              defaultChecked={product.isBestSeller}
              label="Mark as best seller"
            />
          </div>

          <div>
            <Label>Variants</Label>
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div key={variant.id} className="border border-line bg-ivory p-3">
                  <input type="hidden" name="variantId" value={variant.id} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-espresso">{variant.label}</p>
                      <p className="text-[0.65rem] text-mocha">{variant.sku}</p>
                    </div>
                    <Checkbox
                      id={`active-${variant.id}`}
                      name={`active-${variant.id}`}
                      defaultChecked={variant.isActive}
                      label="Active"
                      className="text-xs"
                    />
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Price (£)" htmlFor={`price-${variant.id}`}>
                      <Input
                        id={`price-${variant.id}`}
                        name={`price-${variant.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={(variant.pricePence / 100).toFixed(2)}
                      />
                    </Field>
                    <Field label="Compare at (£)" htmlFor={`compare-${variant.id}`}>
                      <Input
                        id={`compare-${variant.id}`}
                        name={`compare-${variant.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          variant.compareAtPricePence
                            ? (variant.compareAtPricePence / 100).toFixed(2)
                            : ""
                        }
                      />
                    </Field>
                    <Field label="Stock" htmlFor={`stock-${variant.id}`}>
                      <Input
                        id={`stock-${variant.id}`}
                        name={`stock-${variant.id}`}
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={variant.stock}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit">Save product</Button>
        </form>

        <aside className="space-y-4">
          <div className="border border-line p-3">
            <p className="text-[0.62rem] uppercase tracking-[0.16em] text-mocha">Imagery</p>
            <div className="mt-3 space-y-2">
              {product.images.map((image) => (
                <div key={image.id} className="relative aspect-[4/5] overflow-hidden bg-cream">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                </div>
              ))}
              {product.images.length === 0 ? (
                <p className="text-xs text-mocha">No imagery yet.</p>
              ) : null}
            </div>
            <p className="mt-3 text-[0.65rem] leading-relaxed text-mocha">
              Imagery is managed in the database. Add URLs via Prisma Studio for now.
            </p>
          </div>

          <div className="border border-line p-3 text-xs text-mocha">
            <p className="uppercase tracking-[0.16em]">Categories</p>
            <p className="mt-2">{categories.map((category) => category.name).join(" · ")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}


