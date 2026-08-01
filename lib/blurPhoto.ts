import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'

const BUCKET = 'profile-media'

/**
 * Ensures a permanently blurred, downscaled copy of a member's front (face) photo
 * exists in storage, generating it on first request.
 *
 * The source photo is resized down to a tiny width before blurring, so the
 * result is a genuine, irreversible blur — not a CSS filter over the original
 * pixels — safe to hand to viewers who haven't spent a reveal yet.
 */
export async function ensureBlurredFrontPhoto(
  adminClient: SupabaseClient,
  userId: string,
  frontPhotoPath: string,
  existingBlurredPath: string | null | undefined
): Promise<string | null> {
  if (existingBlurredPath) return existingBlurredPath

  try {
    const { data: original, error: downloadError } = await adminClient
      .storage.from(BUCKET).download(frontPhotoPath)
    if (downloadError || !original) {
      console.error('ensureBlurredFrontPhoto: download failed', userId, downloadError)
      return null
    }

    const inputBuffer = Buffer.from(await original.arrayBuffer())
    // Resize + blur strong enough that no facial feature is ever recoverable,
    // but a wide/gentle enough combination that the result still reads as a
    // blurred photo (visible colour regions and shapes) rather than a flat
    // gradient blob.
    const blurredBuffer = await sharp(inputBuffer)
      .resize({ width: 100 })
      .blur(6)
      .jpeg({ quality: 70 })
      .toBuffer()

    const blurredPath = `${userId}/front-blurred.jpg`
    // Upload as a Blob rather than a raw Node Buffer — in Vercel's serverless
    // runtime, passing a Buffer directly through supabase-js's upload() can
    // get coerced through a text/UTF-8 pathway internally, corrupting the
    // binary JPEG data (observed as replacement-character bytes at the start
    // of the uploaded file). A Blob carries unambiguous binary semantics that
    // survive the underlying fetch call intact.
    const blob = new Blob([blurredBuffer], { type: 'image/jpeg' })
    const { error: uploadError } = await adminClient
      .storage.from(BUCKET)
      .upload(blurredPath, blob, { upsert: true, contentType: 'image/jpeg' })
    if (uploadError) {
      console.error('ensureBlurredFrontPhoto: upload failed', userId, uploadError)
      return null
    }

    await adminClient.from('profiles').update({ front_photo_blurred_path: blurredPath }).eq('id', userId)

    return blurredPath
  } catch (err) {
    console.error('ensureBlurredFrontPhoto: sharp processing failed', userId, err)
    return null
  }
}
