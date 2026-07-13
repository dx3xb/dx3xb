import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import sharp from "sharp";

export const runtime = "nodejs";

const BUCKET = "dx3xb-avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["png", "jpeg", "webp", "gif"]);

function safeBearer(req: NextRequest) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function ensurePublicBucket() {
  const supabase = getServiceClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const bucket = buckets.find((item) => item.name === BUCKET);
  if (!bucket) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ["image/webp"],
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/webp"],
  });
  if (error) throw error;
}

export async function POST(req: NextRequest) {
  try {
    const token = safeBearer(req);
    if (!token) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const supabase = getServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }

    await ensurePublicBucket();

    const input = Buffer.from(await file.arrayBuffer());
    let bytes: Buffer;
    try {
      const image = sharp(input, { animated: false, limitInputPixels: 25_000_000, failOn: "warning" });
      const metadata = await image.metadata();
      if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format) || !metadata.width || !metadata.height) {
        return NextResponse.json({ ok: false, error: "bad_file_type" }, { status: 400 });
      }
      bytes = await image
        .rotate()
        .resize(512, 512, { fit: "cover", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
    } catch {
      return NextResponse.json({ ok: false, error: "bad_file_type" }, { status: 400 });
    }
    const path = `${data.user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: `${publicData.publicUrl}?v=${Date.now()}` });
  } catch (error) {
    console.error("avatar upload failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
