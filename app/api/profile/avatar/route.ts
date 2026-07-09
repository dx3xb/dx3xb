import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "dx3xb-avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

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
      allowedMimeTypes: Array.from(ALLOWED_TYPES),
    });
    if (error) throw error;
    return;
  }

  if (!bucket.public) {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Array.from(ALLOWED_TYPES),
    });
    if (error) throw error;
  }
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
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "bad_file_type" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
    }

    await ensurePublicBucket();

    const bytes = await file.arrayBuffer();
    const path = `${data.user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
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
