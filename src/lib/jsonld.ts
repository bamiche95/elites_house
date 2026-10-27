import { siteConfig } from "@/lib/constants";

const SITE = siteConfig.url.replace(/\/$/, "");

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE}/#organization`,
    name: siteConfig.name,
    url: SITE,
    logo: `${SITE}/icons/icon-512.png`,
    image: `${SITE}/images/og-default.jpg`,
    description: siteConfig.description,
    email: siteConfig.supportEmail,
    telephone: siteConfig.supportPhone,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.addressLine,
      addressLocality: siteConfig.city,
      postalCode: siteConfig.postcode,
      addressCountry: "GB",
    },
    sameAs: [siteConfig.instagram],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE}/#website`,
    url: SITE,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": `${SITE}/#organization` },
    inLanguage: "en-GB",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type ProductJsonLdInput = {
  name: string;
  description: string;
  slug: string;
  images: string[];
  sku: string;
  pricePence: number;
  compareAtPricePence?: number | null;
  inStock: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  category?: string;
};

export function productJsonLd(product: ProductJsonLdInput) {
  const url = `${SITE}/product/${product.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) =>
      image.startsWith("http") ? image : `${SITE}${image}`,
    ),
    sku: product.sku,
    brand: { "@type": "Brand", name: siteConfig.name },
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "GBP",
      price: (product.pricePence / 100).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE}/#organization` },
    },
    ...(product.ratingCount && product.ratingAvg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg.toFixed(1),
            reviewCount: product.ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function itemListJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${SITE}${item.path}`,
    })),
  };
}
