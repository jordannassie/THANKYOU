/**
 * POST /api/vision/generate
 *
 * Server-side only. Keeps OPENAI_API_KEY off the browser.
 *
 * Flow:
 *  1. Verify Supabase session (401 if absent)
 *  2. Validate + rate-guard prompt
 *  3. Call OpenAI Images API (gpt-image-2, 1024×1024)
 *  4. Decode base64 → upload to Supabase Storage via service role
 *  5. Insert vision_board_images record (via user's session for RLS)
 *  6. Return the new record
 */

import { NextResponse, type NextRequest } from "next/server";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Constants ────────────────────────────────────────────────

const MODEL = "gpt-image-1";
const SIZE = "1024x1024" as const;
const QUALITY = "medium" as const;
const MAX_PROMPT_CHARS = 1000;
const MIN_PROMPT_CHARS = 3;
const STORAGE_BUCKET = "vision-board";

const SYSTEM_PREFIX = `Create an inspiring, aspirational vision-board image.

Make it visually beautiful, realistic, premium, uplifting and photographic unless the user requests another style.

Do not add text, quotes, captions, logos or watermarks unless the user specifically asks for text.

User's vision:
`;

// ── Route handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Verify authenticated session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate request body
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawPrompt = (body.prompt ?? "").trim();

  if (rawPrompt.length < MIN_PROMPT_CHARS) {
    return NextResponse.json(
      { error: "Please describe your vision first." },
      { status: 400 }
    );
  }
  if (rawPrompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Keep your vision description under ${MAX_PROMPT_CHARS} characters.` },
      { status: 400 }
    );
  }

  const enhancedPrompt = SYSTEM_PREFIX + rawPrompt;

  // 3. Call OpenAI
  if (!process.env.OPENAI_API_KEY) {
    console.error("[vision/generate] OPENAI_API_KEY is not set.");
    return NextResponse.json(
      { error: "Image generation is not configured." },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let imageBase64: string;
  try {
    const response = await openai.images.generate({
      model: MODEL,
      prompt: enhancedPrompt,
      n: 1,
      size: SIZE,
      quality: QUALITY,
      // gpt-image-1 always returns b64_json — no response_format param needed
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image data.");
    }
    imageBase64 = b64;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[vision/generate] OpenAI error:", msg);
    // Surface the real error so it's visible during development
    return NextResponse.json(
      { error: `Image generation failed: ${msg}` },
      { status: 500 }
    );
  }

  // 4. Upload image to Supabase Storage (service role bypasses RLS safely)
  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    console.error("[vision/generate] Admin client unavailable:", err);
    return NextResponse.json(
      { error: "Storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const imageId = randomUUID();
  const storagePath = `${user.id}/generated/${imageId}.png`;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const { error: uploadError } = await adminClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, imageBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    console.error("[vision/generate] Storage upload error:", uploadError.message);
    return NextResponse.json(
      { error: `Storage error: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

  // 5. Insert DB record using user's session (RLS ensures user_id integrity)
  const { data: record, error: dbError } = await supabase
    .from("vision_board_images")
    .insert({
      user_id: user.id,
      image_url: publicUrl,
      storage_path: storagePath,
      prompt: rawPrompt,
      source: "generated",
    })
    .select()
    .single();

  if (dbError) {
    console.error("[vision/generate] DB insert error:", dbError.message);
    await adminClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json(
      { error: `Database error: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ image: record }, { status: 201 });
}
