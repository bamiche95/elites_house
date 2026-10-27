import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("payment-info");
}

export default function PaymentInfoPage() {
  return <CmsPageView slug="payment-info" />;
}
