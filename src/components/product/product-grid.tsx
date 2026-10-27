import { ProductCard, type ProductCardData } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  emptyMessage = "No products match those filters yet.",
}: {
  products: ProductCardData[];
  className?: string;
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-line bg-cream px-6 py-20 text-center">
        <p className="font-display text-2xl text-espresso">{emptyMessage}</p>
        <p className="mt-2 text-sm text-mocha">
          Try removing a filter, or browse the full collection.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} priority={index < 2} />
      ))}
    </div>
  );
}
