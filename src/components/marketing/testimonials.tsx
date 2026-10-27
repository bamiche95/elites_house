import { RatingStars } from "@/components/ui/price";
import { siteConfig } from "@/lib/constants";

export type TestimonialData = {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  product: string | null;
};

export function Testimonials({
  items,
  title = "Loved in real life",
  eyebrow = "Client notes",
}: {
  items: TestimonialData[];
  title?: string;
  eyebrow?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="bg-cream py-20">
      <div className="container-luxe">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">{title}</h2>
          <p className="mt-3 text-sm text-mocha">
            Real notes from clients who wear LushTresses every day. Tag{" "}
            <span className="text-espresso">@{siteConfig.name.toLowerCase()}</span> to be
            featured.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="flex h-full flex-col border border-line bg-ivory p-6"
            >
              <RatingStars rating={testimonial.rating} size={13} />
              <blockquote className="mt-4 flex-1 font-display text-xl leading-snug text-espresso">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-line pt-4 text-xs text-mocha">
                <span className="font-semibold uppercase tracking-[0.14em] text-espresso">
                  {testimonial.name}
                </span>
                {testimonial.location ? ` — ${testimonial.location}` : ""}
                {testimonial.product ? (
                  <span className="mt-1 block text-[0.68rem] uppercase tracking-[0.12em] text-gold">
                    {testimonial.product}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
