"use server";

import type { ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { formBool, formInt, formOptional, formString } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { bannerSchema, faqSchema, pageSchema, testimonialSchema } from "@/lib/validators";

function backTo(tab: string, params: Record<string, string> = { saved: "1" }): never {
  const query = new URLSearchParams({ tab, ...params });
  redirect(`/admin/cms?${query.toString()}`);
}

export async function savePageAction(formData: FormData) {
  await requireAdmin();

  const parsed = pageSchema.safeParse({
    id: formString(formData, "id"),
    title: formString(formData, "title"),
    excerpt: formOptional(formData, "excerpt"),
    content: formString(formData, "content"),
    heroImage: formOptional(formData, "heroImage"),
    published: formBool(formData, "published"),
    metaTitle: formOptional(formData, "metaTitle"),
    metaDescription: formOptional(formData, "metaDescription"),
  });

  if (!parsed.success) {
    backTo("pages", { error: parsed.error.issues[0]?.message ?? "Check the page details." });
  }

  await prisma.page.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      heroImage: parsed.data.heroImage ?? null,
      published: parsed.data.published,
      metaTitle: parsed.data.metaTitle ?? null,
      metaDescription: parsed.data.metaDescription ?? null,
    },
  });

  revalidatePath("/", "layout");
  backTo("pages");
}

export async function saveBannerAction(formData: FormData) {
  await requireAdmin();

  const parsed = bannerSchema.safeParse({
    id: formOptional(formData, "id"),
    title: formString(formData, "title"),
    subtitle: formOptional(formData, "subtitle"),
    body: formOptional(formData, "body"),
    ctaLabel: formOptional(formData, "ctaLabel"),
    ctaHref: formOptional(formData, "ctaHref"),
    imageUrl: formOptional(formData, "imageUrl"),
    badge: formOptional(formData, "badge"),
    placement: formString(formData, "placement"),
    position: formInt(formData, "position", 0),
    isActive: formBool(formData, "isActive"),
  });

  if (!parsed.success) {
    backTo("banners", { error: parsed.error.issues[0]?.message ?? "Check the banner." });
  }

  const data = {
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    body: parsed.data.body ?? null,
    ctaLabel: parsed.data.ctaLabel ?? null,
    ctaHref: parsed.data.ctaHref ?? null,
    imageUrl: parsed.data.imageUrl ?? null,
    badge: parsed.data.badge ?? null,
    placement: parsed.data.placement,
    position: parsed.data.position,
    isActive: parsed.data.isActive,
  };

  if (parsed.data.id) {
    await prisma.banner.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.banner.create({ data });
  }

  revalidatePath("/", "layout");
  backTo("banners");
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (id) await prisma.banner.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/", "layout");
  backTo("banners");
}

export async function saveFaqAction(formData: FormData) {
  await requireAdmin();

  const parsed = faqSchema.safeParse({
    id: formOptional(formData, "id"),
    question: formString(formData, "question"),
    answer: formString(formData, "answer"),
    category: formString(formData, "category") || "General",
    position: formInt(formData, "position", 0),
    isActive: formBool(formData, "isActive"),
  });

  if (!parsed.success) {
    backTo("faqs", { error: parsed.error.issues[0]?.message ?? "Check the FAQ." });
  }

  const data = {
    question: parsed.data.question,
    answer: parsed.data.answer,
    category: parsed.data.category,
    position: parsed.data.position,
    isActive: parsed.data.isActive,
  };

  if (parsed.data.id) {
    await prisma.faq.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.faq.create({ data });
  }

  revalidatePath("/faq");
  revalidatePath("/");
  backTo("faqs");
}

export async function deleteFaqAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (id) await prisma.faq.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/faq");
  backTo("faqs");
}

export async function saveTestimonialAction(formData: FormData) {
  await requireAdmin();

  const parsed = testimonialSchema.safeParse({
    id: formOptional(formData, "id"),
    name: formString(formData, "name"),
    location: formOptional(formData, "location"),
    quote: formString(formData, "quote"),
    rating: formInt(formData, "rating", 5),
    product: formOptional(formData, "product"),
    position: formInt(formData, "position", 0),
    isActive: formBool(formData, "isActive"),
  });

  if (!parsed.success) {
    backTo("testimonials", {
      error: parsed.error.issues[0]?.message ?? "Check the testimonial.",
    });
  }

  const data = {
    name: parsed.data.name,
    location: parsed.data.location ?? null,
    quote: parsed.data.quote,
    rating: parsed.data.rating,
    product: parsed.data.product ?? null,
    position: parsed.data.position,
    isActive: parsed.data.isActive,
  };

  if (parsed.data.id) {
    await prisma.testimonial.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }

  revalidatePath("/");
  backTo("testimonials");
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (id) await prisma.testimonial.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/");
  backTo("testimonials");
}

async function recomputeProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Number((aggregate._avg.rating ?? 0).toFixed(2)),
      ratingCount: aggregate._count._all,
    },
  });
}

export async function moderateReviewAction(formData: FormData) {
  await requireAdmin();

  const id = formString(formData, "id");
  const action = formString(formData, "action");
  if (!id) backTo("reviews", { error: "Missing review." });

  const review = await prisma.review.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!review) backTo("reviews", { error: "Review not found." });

  if (action === "DELETE") {
    await prisma.review.delete({ where: { id } });
  } else {
    const status: ReviewStatus = action === "REJECTED" ? "REJECTED" : "APPROVED";
    await prisma.review.update({ where: { id }, data: { status } });
  }

  await recomputeProductRating(review.productId);

  const product = await prisma.product.findUnique({
    where: { id: review.productId },
    select: { slug: true },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  if (product) revalidatePath(`/product/${product.slug}`);
  backTo("reviews");
}

export async function markContactReadAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (id) {
    await prisma.contactMessage
      .update({ where: { id }, data: { isRead: true } })
      .catch(() => undefined);
  }
  backTo("inbox");
}

export async function deleteContactAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  if (id) {
    await prisma.contactMessage.delete({ where: { id } }).catch(() => undefined);
  }
  backTo("inbox");
}

