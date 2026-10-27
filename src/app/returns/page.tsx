import type { Metadata } from "next";

import { CmsPageView, cmsMetadata } from "@/components/content/cms-page";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("returns");
}

export default function ReturnsPage() {
  return <CmsPageView slug="returns" />;
}
