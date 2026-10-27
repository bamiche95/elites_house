import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("privacy");
}

export default function PrivacyPage() {
  return <CmsPageView slug="privacy" />;
}
