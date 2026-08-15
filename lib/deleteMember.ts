import { createAdminClient } from '@/lib/supabase/admin'

// Shared by self-service account deletion (app/profile/actions.ts) and the
// admin "Delete Profile" tool (app/admin/actions.ts) so both stay in sync.
// profile_likes cleans up automatically via its ON DELETE CASCADE FK to
// auth.users, which is why it isn't listed here.
export async function deleteMemberById(userId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('back_photo_1_path, back_photo_2_path, front_photo_path, voice_path, voice_native_path, id_document_path')
    .eq('id', userId)
    .single()

  const p = profile as Record<string, unknown> | null
  const paths = [
    p?.back_photo_1_path, p?.back_photo_2_path, p?.front_photo_path,
    p?.voice_path, p?.voice_native_path, p?.id_document_path,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0)

  if (paths.length > 0) {
    await admin.storage.from('profile-media').remove(paths)
  }

  await Promise.all([
    admin.from('photo_reveals').delete().or(`viewer_id.eq.${userId},viewed_id.eq.${userId}`),
    admin.from('notifications').delete().or(`recipient_id.eq.${userId},sender_id.eq.${userId}`),
    admin.from('shortlist').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`),
    admin.from('video_meetings').delete().or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
    admin.from('reports').delete().or(`reporter_id.eq.${userId},reported_id.eq.${userId}`),
    admin.from('referrals').delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`),
    admin.from('extra_meeting_purchases').delete().eq('user_id', userId),
  ])

  await admin.from('profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
}
