import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth-helpers";
import {
  deleteImage,
  isMediaConfigured,
  mediaProvider,
  mediaUnavailableMessage,
  uploadImage,
} from "@/lib/media/storage";
import { isMediaFolder } from "@/lib/media/validate";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only image uploads.
 *
 * One file per request: Vercel caps a serverless request body at ~4.5 MB, so the
 * browser uploads a multi-selection sequentially (see `uploadMediaFile`).
 */
async function authorize() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in to upload images." }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Admins only." }, { status: 403 }) };
  }

  const limit = rateLimit(`uploads:${user.id}`, 40, 60_000);
  if (!limit.success) {
    return {
      error: NextResponse.json(
        { error: `Too many uploads. Try again in ${limit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      ),
    };
  }

  return { user };
}

export async function POST(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  if (!isMediaConfigured) {
    return NextResponse.json({ error: mediaUnavailableMessage }, { status: 503 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 422 });
  }

  const folderValue = String(formData?.get("folder") ?? "products");
  if (!isMediaFolder(folderValue)) {
    return NextResponse.json({ error: "Unknown upload folder." }, { status: 422 });
  }

  try {
    const result = await uploadImage(file, folderValue);
    return NextResponse.json({ url: result.url, provider: result.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[media] upload failed:", message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

/** Removes an asset that never made it into the database (abandoned form). */
export async function DELETE(request: Request) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url." }, { status: 422 });
  }

  await deleteImage(url);
  return NextResponse.json({ deleted: true, provider: mediaProvider });
}
