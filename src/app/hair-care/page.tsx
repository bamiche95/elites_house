import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("hair-care");
}

export default function HairCarePage() {
  return <CmsPageView slug="hair-care" />;
}
