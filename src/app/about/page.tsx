import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("about");
}

export default function AboutPage() {
  return <CmsPageView slug="about" />;
}
