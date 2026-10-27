import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("shipping");
}

export default function ShippingPage() {
  return <CmsPageView slug="shipping" />;
}
