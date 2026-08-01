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
    const blurredBuffer = await sharp(inputBuffer)
      .resize({ width: 48 })
      .blur(8)
      .jpeg({ quality: 60 })
      .toBuffer()

    const blurredPath = `${userId}/front-blurred.jpg`
    const { error: uploadError } = await adminClient
      .storage.from(BUCKET)
      .upload(blurredPath, blurredBuffer, { upsert: true, contentType: 'image/jpeg' })
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
