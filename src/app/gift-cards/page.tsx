import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("gift-cards");
}

export default function GiftCardsPage() {
  return <CmsPageView slug="gift-cards" />;
}
