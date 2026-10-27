import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("terms");
}

export default function TermsPage() {
  return <CmsPageView slug="terms" />;
}
