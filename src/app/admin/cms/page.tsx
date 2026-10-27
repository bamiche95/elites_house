import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  deleteBannerAction,
  deleteContactAction,
  deleteFaqAction,
  deleteTestimonialAction,
  markContactReadAction,
  moderateReviewAction,
  saveBannerAction,
  saveFaqAction,
  savePageAction,
  saveTestimonialAction,
} from "@/app/admin/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

const TABS = [
  { id: "pages", label: "Pages" },
  { id: "banners", label: "Banners" },
  { id: "faqs", label: "FAQs" },
  { id: "testimonials", label: "Testimonials" },
  { id: "reviews", label: "Reviews" },
  { id: "inbox", label: "Inbox" },
];

const PLACEMENTS = ["ANNOUNCEMENT", "HOME_HERO", "HOME_PROMO", "SHOP_HERO"] as const;

export default async function AdminCmsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const tab = TABS.some((item) => item.id === params.tab) ? params.tab! : "pages";

  const [pages, banners, faqs, testimonials, reviews, messages] = await Promise.all([
    prisma.page.findMany({ orderBy: { position: "asc" } }),
    prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { position: "asc" }] }),
    prisma.faq.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }] }),
    prisma.testimonial.findMany({ orderBy: { position: "asc" } }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  const pendingReviews = reviews.filter((review) => review.status === "PENDING").length;
  const unreadMessages = messages.filter((message) => !message.isRead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-espresso">Content</h1>
        <p className="mt-1 text-sm text-mocha">
          Pages, banners, FAQs, testimonials, reviews and the inbox.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-line pb-3">
        {TABS.map((item) => {
          const count =
            item.id === "reviews" ? pendingReviews : item.id === "inbox" ? unreadMessages : 0;
          return (
            <Link
              key={item.id}
              href={`/admin/cms?tab=${item.id}`}
              className={
                tab === item.id
                  ? "bg-ink px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-ivory"
                  : "px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-mocha hover:bg-cream hover:text-espresso"
              }
            >
              {item.label}
              {count > 0 ? ` (${count})` : ""}
            </Link>
          );
        })}
      </nav>

      {params.saved ? (
        <p className="border border-success/30 bg-success/5 px-4 py-3 text-xs text-success">
          Changes saved.
        </p>
      ) : null}
      {params.error ? (
        <p className="border border-danger/30 bg-danger/5 px-4 py-3 text-xs text-danger">
          {params.error}
        </p>
      ) : null}

      {tab === "pages" ? <PagesTab pages={pages} /> : null}
      {tab === "banners" ? <BannersTab banners={banners} /> : null}
      {tab === "faqs" ? <FaqsTab faqs={faqs} /> : null}
      {tab === "testimonials" ? <TestimonialsTab testimonials={testimonials} /> : null}
      {tab === "reviews" ? <ReviewsTab reviews={reviews} /> : null}
      {tab === "inbox" ? <InboxTab messages={messages} /> : null}
    </div>
  );
}

async function PagesTab({ pages }: { pages: Awaited<ReturnType<typeof prisma.page.findMany>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-mocha">
        These pages power /about, /shipping, /returns and the rest of the content routes.
        Markdown headings (##) and lists are supported.
      </p>
      {pages.map((page) => (
        <details key={page.id} className="border border-line bg-cream">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-espresso">
              {page.title} <span className="text-xs text-mocha">/{page.slug}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge tone={page.published ? "success" : "neutral"}>
                {page.published ? "Published" : "Draft"}
              </Badge>
              <Link
                href={`/${page.slug}`}
                target="_blank"
                className="text-mocha hover:text-espresso"
                aria-label={`View ${page.title}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </span>
          </summary>
          <form action={savePageAction} className="space-y-4 border-t border-line p-4">
            <input type="hidden" name="id" value={page.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor={`title-${page.id}`}>
                <Input id={`title-${page.id}`} name="title" defaultValue={page.title} required />
              </Field>
              <Field label="Hero image URL" htmlFor={`hero-${page.id}`}>
                <Input id={`hero-${page.id}`} name="heroImage" defaultValue={page.heroImage ?? ""} />
              </Field>
            </div>
            <Field label="Excerpt" htmlFor={`excerpt-${page.id}`}>
              <Input id={`excerpt-${page.id}`} name="excerpt" defaultValue={page.excerpt ?? ""} />
            </Field>
            <Field label="Content" htmlFor={`content-${page.id}`}>
              <Textarea
                id={`content-${page.id}`}
                name="content"
                defaultValue={page.content}
                className="min-h-64 font-mono text-xs"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meta title" htmlFor={`metaTitle-${page.id}`}>
                <Input
                  id={`metaTitle-${page.id}`}
                  name="metaTitle"
                  defaultValue={page.metaTitle ?? ""}
                  maxLength={70}
                />
              </Field>
              <Field label="Meta description" htmlFor={`metaDescription-${page.id}`}>
                <Input
                  id={`metaDescription-${page.id}`}
                  name="metaDescription"
                  defaultValue={page.metaDescription ?? ""}
                  maxLength={160}
                />
              </Field>
            </div>
            <Checkbox
              id={`published-${page.id}`}
              name="published"
              defaultChecked={page.published}
              label="Published"
            />
            <Button type="submit" size="sm">
              Save page
            </Button>
          </form>
        </details>
      ))}
    </div>
  );
}

async function BannersTab({
  banners,
}: {
  banners: Awaited<ReturnType<typeof prisma.banner.findMany>>;
}) {
  const fields = (banner?: (typeof banners)[number]) => (
    <>
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor={`banner-title-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-title-${banner?.id ?? "new"}`}
            name="title"
            defaultValue={banner?.title ?? ""}
            required
          />
        </Field>
        <Field label="Subtitle" htmlFor={`banner-subtitle-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-subtitle-${banner?.id ?? "new"}`}
            name="subtitle"
            defaultValue={banner?.subtitle ?? ""}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Badge" htmlFor={`banner-badge-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-badge-${banner?.id ?? "new"}`}
            name="badge"
            defaultValue={banner?.badge ?? ""}
          />
        </Field>
        <Field label="Image URL" htmlFor={`banner-image-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-image-${banner?.id ?? "new"}`}
            name="imageUrl"
            defaultValue={banner?.imageUrl ?? ""}
          />
        </Field>
      </div>
      <Field label="Body copy" htmlFor={`banner-body-${banner?.id ?? "new"}`}>
        <Textarea
          id={`banner-body-${banner?.id ?? "new"}`}
          name="body"
          defaultValue={banner?.body ?? ""}
          className="min-h-20"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="CTA label" htmlFor={`banner-cta-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-cta-${banner?.id ?? "new"}`}
            name="ctaLabel"
            defaultValue={banner?.ctaLabel ?? ""}
          />
        </Field>
        <Field label="CTA link" htmlFor={`banner-href-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-href-${banner?.id ?? "new"}`}
            name="ctaHref"
            defaultValue={banner?.ctaHref ?? ""}
          />
        </Field>
        <Field label="Position" htmlFor={`banner-position-${banner?.id ?? "new"}`}>
          <Input
            id={`banner-position-${banner?.id ?? "new"}`}
            name="position"
            type="number"
            min="0"
            max="99"
            defaultValue={banner?.position ?? 0}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Placement" htmlFor={`banner-placement-${banner?.id ?? "new"}`}>
          <Select
            id={`banner-placement-${banner?.id ?? "new"}`}
            name="placement"
            defaultValue={banner?.placement ?? "ANNOUNCEMENT"}
          >
            {PLACEMENTS.map((placement) => (
              <option key={placement} value={placement}>
                {placement.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Checkbox
            id={`banner-active-${banner?.id ?? "new"}`}
            name="isActive"
            defaultChecked={banner ? banner.isActive : true}
            label="Active"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <details className="border border-gold/40 bg-gold/10" open>
        <summary className="cursor-pointer px-4 py-3 text-[0.62rem] uppercase tracking-[0.16em] text-espresso">
          Add a banner
        </summary>
        <form action={saveBannerAction} className="space-y-4 border-t border-gold/30 p-4">
          {fields()}
          <Button type="submit" size="sm">
            Create banner
          </Button>
        </form>
      </details>

      {banners.map((banner) => (
        <details key={banner.id} className="border border-line bg-cream">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-espresso">{banner.title}</span>
            <span className="flex items-center gap-2">
              <Badge tone="outline">{banner.placement.replace(/_/g, " ")}</Badge>
              <Badge tone={banner.isActive ? "success" : "neutral"}>
                {banner.isActive ? "Active" : "Hidden"}
              </Badge>
            </span>
          </summary>
          <form action={saveBannerAction} className="space-y-4 border-t border-line p-4">
            {fields(banner)}
            <Button type="submit" size="sm">
              Save banner
            </Button>
          </form>
          <form action={deleteBannerAction} className="border-t border-line px-4 py-3">
            <input type="hidden" name="id" value={banner.id} />
            <button
              type="submit"
              className="text-[0.62rem] uppercase tracking-[0.14em] text-danger underline underline-offset-4"
            >
              Delete banner
            </button>
          </form>
        </details>
      ))}
    </div>
  );
}

async function FaqsTab({ faqs }: { faqs: Awaited<ReturnType<typeof prisma.faq.findMany>> }) {
  return (
    <div className="space-y-4">
      <details className="border border-gold/40 bg-gold/10" open>
        <summary className="cursor-pointer px-4 py-3 text-[0.62rem] uppercase tracking-[0.16em] text-espresso">
          Add an FAQ
        </summary>
        <form action={saveFaqAction} className="space-y-4 border-t border-gold/30 p-4">
          <Field label="Question" htmlFor="faq-question-new">
            <Input id="faq-question-new" name="question" required />
          </Field>
          <Field label="Answer" htmlFor="faq-answer-new">
            <Textarea id="faq-answer-new" name="answer" required className="min-h-24" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="faq-category-new">
              <Input id="faq-category-new" name="category" defaultValue="General" />
            </Field>
            <Field label="Position" htmlFor="faq-position-new">
              <Input id="faq-position-new" name="position" type="number" defaultValue={99} />
            </Field>
          </div>
          <Checkbox id="faq-active-new" name="isActive" defaultChecked label="Active" />
          <Button type="submit" size="sm">
            Create FAQ
          </Button>
        </form>
      </details>

      {faqs.map((faq) => (
        <details key={faq.id} className="border border-line bg-cream">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-espresso">{faq.question}</span>
            <span className="flex items-center gap-2">
              <Badge tone="outline">{faq.category}</Badge>
              <Badge tone={faq.isActive ? "success" : "neutral"}>
                {faq.isActive ? "Active" : "Hidden"}
              </Badge>
            </span>
          </summary>
          <form action={saveFaqAction} className="space-y-4 border-t border-line p-4">
            <input type="hidden" name="id" value={faq.id} />
            <Field label="Question" htmlFor={`faq-question-${faq.id}`}>
              <Input
                id={`faq-question-${faq.id}`}
                name="question"
                defaultValue={faq.question}
                required
              />
            </Field>
            <Field label="Answer" htmlFor={`faq-answer-${faq.id}`}>
              <Textarea
                id={`faq-answer-${faq.id}`}
                name="answer"
                defaultValue={faq.answer}
                required
                className="min-h-24"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor={`faq-category-${faq.id}`}>
                <Input id={`faq-category-${faq.id}`} name="category" defaultValue={faq.category} />
              </Field>
              <Field label="Position" htmlFor={`faq-position-${faq.id}`}>
                <Input
                  id={`faq-position-${faq.id}`}
                  name="position"
                  type="number"
                  defaultValue={faq.position}
                />
              </Field>
            </div>
            <Checkbox
              id={`faq-active-${faq.id}`}
              name="isActive"
              defaultChecked={faq.isActive}
              label="Active"
            />
            <Button type="submit" size="sm">
              Save FAQ
            </Button>
          </form>
          <form action={deleteFaqAction} className="border-t border-line px-4 py-3">
            <input type="hidden" name="id" value={faq.id} />
            <button
              type="submit"
              className="text-[0.62rem] uppercase tracking-[0.14em] text-danger underline underline-offset-4"
            >
              Delete FAQ
            </button>
          </form>
        </details>
      ))}
    </div>
  );
}

async function TestimonialsTab({
  testimonials,
}: {
  testimonials: Awaited<ReturnType<typeof prisma.testimonial.findMany>>;
}) {
  return (
    <div className="space-y-4">
      <details className="border border-gold/40 bg-gold/10" open>
        <summary className="cursor-pointer px-4 py-3 text-[0.62rem] uppercase tracking-[0.16em] text-espresso">
          Add a testimonial
        </summary>
        <form action={saveTestimonialAction} className="space-y-4 border-t border-gold/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="testimonial-name-new">
              <Input id="testimonial-name-new" name="name" required />
            </Field>
            <Field label="Location" htmlFor="testimonial-location-new">
              <Input id="testimonial-location-new" name="location" />
            </Field>
          </div>
          <Field label="Quote" htmlFor="testimonial-quote-new">
            <Textarea id="testimonial-quote-new" name="quote" required className="min-h-24" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rating" htmlFor="testimonial-rating-new">
              <Input
                id="testimonial-rating-new"
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue={5}
              />
            </Field>
            <Field label="Product" htmlFor="testimonial-product-new">
              <Input id="testimonial-product-new" name="product" />
            </Field>
            <Field label="Position" htmlFor="testimonial-position-new">
              <Input
                id="testimonial-position-new"
                name="position"
                type="number"
                defaultValue={99}
              />
            </Field>
          </div>
          <Checkbox id="testimonial-active-new" name="isActive" defaultChecked label="Active" />
          <Button type="submit" size="sm">
            Create testimonial
          </Button>
        </form>
      </details>

      {testimonials.map((testimonial) => (
        <details key={testimonial.id} className="border border-line bg-cream">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-espresso">
              {testimonial.name} — “{testimonial.quote.slice(0, 48)}…”
            </span>
            <Badge tone={testimonial.isActive ? "success" : "neutral"}>
              {testimonial.isActive ? "Active" : "Hidden"}
            </Badge>
          </summary>
          <form action={saveTestimonialAction} className="space-y-4 border-t border-line p-4">
            <input type="hidden" name="id" value={testimonial.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor={`testimonial-name-${testimonial.id}`}>
                <Input
                  id={`testimonial-name-${testimonial.id}`}
                  name="name"
                  defaultValue={testimonial.name}
                  required
                />
              </Field>
              <Field label="Location" htmlFor={`testimonial-location-${testimonial.id}`}>
                <Input
                  id={`testimonial-location-${testimonial.id}`}
                  name="location"
                  defaultValue={testimonial.location ?? ""}
                />
              </Field>
            </div>
            <Field label="Quote" htmlFor={`testimonial-quote-${testimonial.id}`}>
              <Textarea
                id={`testimonial-quote-${testimonial.id}`}
                name="quote"
                defaultValue={testimonial.quote}
                required
                className="min-h-24"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Rating" htmlFor={`testimonial-rating-${testimonial.id}`}>
                <Input
                  id={`testimonial-rating-${testimonial.id}`}
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={testimonial.rating}
                />
              </Field>
              <Field label="Product" htmlFor={`testimonial-product-${testimonial.id}`}>
                <Input
                  id={`testimonial-product-${testimonial.id}`}
                  name="product"
                  defaultValue={testimonial.product ?? ""}
                />
              </Field>
              <Field label="Position" htmlFor={`testimonial-position-${testimonial.id}`}>
                <Input
                  id={`testimonial-position-${testimonial.id}`}
                  name="position"
                  type="number"
                  defaultValue={testimonial.position}
                />
              </Field>
            </div>
            <Checkbox
              id={`testimonial-active-${testimonial.id}`}
              name="isActive"
              defaultChecked={testimonial.isActive}
              label="Active"
            />
            <Button type="submit" size="sm">
              Save testimonial
            </Button>
          </form>
          <form action={deleteTestimonialAction} className="border-t border-line px-4 py-3">
            <input type="hidden" name="id" value={testimonial.id} />
            <button
              type="submit"
              className="text-[0.62rem] uppercase tracking-[0.14em] text-danger underline underline-offset-4"
            >
              Delete testimonial
            </button>
          </form>
        </details>
      ))}
    </div>
  );
}

type AdminReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedPurchase: boolean;
  createdAt: Date;
  product: { name: string; slug: string };
};

function ReviewsTab({ reviews }: { reviews: AdminReview[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-mocha">
        Reviews are held for approval. Publishing recalculates the product&apos;s star rating.
      </p>
      {reviews.map((review) => (
        <article key={review.id} className="border border-line bg-cream p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-espresso">
                {review.product.name} · {review.authorName} · {review.rating}/5
                {review.verifiedPurchase ? " · Verified" : ""}
              </p>
              <p className="text-[0.65rem] text-mocha">{formatDate(review.createdAt)}</p>
            </div>
            <Badge
              tone={
                review.status === "APPROVED"
                  ? "success"
                  : review.status === "REJECTED"
                    ? "danger"
                    : "warning"
              }
            >
              {review.status}
            </Badge>
          </div>
          {review.title ? (
            <p className="mt-2 text-sm font-medium text-espresso">{review.title}</p>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-mocha">{review.body}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-[0.62rem] uppercase tracking-[0.14em]">
            {review.status !== "APPROVED" ? (
              <form action={moderateReviewAction}>
                <input type="hidden" name="id" value={review.id} />
                <input type="hidden" name="action" value="APPROVED" />
                <button type="submit" className="text-success hover:underline">
                  Approve
                </button>
              </form>
            ) : null}
            {review.status !== "REJECTED" ? (
              <form action={moderateReviewAction}>
                <input type="hidden" name="id" value={review.id} />
                <input type="hidden" name="action" value="REJECTED" />
                <button type="submit" className="text-mocha hover:underline">
                  Reject
                </button>
              </form>
            ) : null}
            <form action={moderateReviewAction}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="action" value="DELETE" />
              <button type="submit" className="text-danger hover:underline">
                Delete
              </button>
            </form>
          </div>
        </article>
      ))}
      {reviews.length === 0 ? (
        <p className="border border-dashed border-line p-6 text-sm text-mocha">
          No reviews yet.
        </p>
      ) : null}
    </div>
  );
}

type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

function InboxTab({ messages }: { messages: AdminMessage[] }) {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <article key={message.id} className="border border-line bg-cream p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-espresso">
                {message.subject} · {message.name}
              </p>
              <p className="text-[0.65rem] text-mocha">
                {message.email}
                {message.phone ? ` · ${message.phone}` : ""} ·{" "}
                {formatDateTime(message.createdAt)}
              </p>
            </div>
            <Badge tone={message.isRead ? "neutral" : "warning"}>
              {message.isRead ? "Read" : "New"}
            </Badge>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-mocha">
            {message.message}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.62rem] uppercase tracking-[0.14em]">
            <a href={`mailto:${message.email}`} className="text-espresso hover:underline">
              Reply by email
            </a>
            {!message.isRead ? (
              <form action={markContactReadAction}>
                <input type="hidden" name="id" value={message.id} />
                <button type="submit" className="text-mocha hover:underline">
                  Mark as read
                </button>
              </form>
            ) : null}
            <form action={deleteContactAction}>
              <input type="hidden" name="id" value={message.id} />
              <button type="submit" className="text-danger hover:underline">
                Delete
              </button>
            </form>
          </div>
        </article>
      ))}
      {messages.length === 0 ? (
        <p className="border border-dashed border-line p-6 text-sm text-mocha">
          No messages yet.
        </p>
      ) : null}
    </div>
  );
}





