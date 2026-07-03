import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import ProfileCard, { type ProfileData } from './ProfileCard'
import DiscoverClient from './DiscoverClient'

const PROFILE_FIELDS = `
  id, member_id, full_name, age, gender, city, country,
  religion, sub_religion, mother_tongue, education, education_subject, employment_status, occupation,
  height, weight, ethnicity, marital_status, has_kids, id_verified,
  back_photo_1_path, back_photo_2_path, voice_path, front_photo_path,
  fav_reels, fav_youtube, fav_web_series, fav_travel, fav_foods, fav_ai_tools,
  zodiac_sign, hobby, university, other_qualifications, housing, voice_native_path,
  pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion, pref_sub_religion,
  pref_occupation, pref_height, pref_ethnicity
`

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Guard: onboarding must be complete + get plan
  const { data: me } = await supabase
    .from('profiles')
    .select('onboarding_complete, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!me?.onboarding_complete) redirect('/onboarding')

  const userPlan  = me?.plan ?? 'free'
  const canReveal = userPlan !== 'free'
  const canMeet   = userPlan !== 'free'

  const PLAN_LIMITS: Record<string, number> = { free: 0, starter: 2, standard: 4 }
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const [{ count: meetingsSent }, { count: extraPurchased }] = await Promise.all([
    supabase.from('video_meetings').select('*', { count: 'exact', head: true })
      .eq('requester_id', user.id).gte('created_at', monthStart.toISOString()),
    supabase.from('extra_meeting_purchases').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
  ])
  const planLimit    = PLAN_LIMITS[userPlan] ?? 0
  const meetingsLeft = Math.max(0, planLimit + (extraPurchased ?? 0) - (meetingsSent ?? 0))

  // Fetch all complete profiles except the current user
  const { data: rows } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // The current user's own profile — shown as a preview of how others see it
  const { data: myRow } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .eq('id', user.id)
    .single()

  // Which profiles has the current user already revealed?
  const { data: myReveals } = await supabase
    .from('photo_reveals')
    .select('viewed_id')
    .eq('viewer_id', user.id)

  const revealedSet = new Set((myReveals ?? []).map((r) => r.viewed_id as string))

  // Existing video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('room_id, requester_id, recipient_id, status')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const meetingByOther: Record<string, { room_id: string; status: string }> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = { room_id: m.room_id, status: m.status }
  }

  // Collect all storage paths we need signed URLs for
  const allPaths: string[] = []
  for (const p of rows ?? []) {
    if (p.back_photo_1_path) allPaths.push(p.back_photo_1_path)
    if (p.back_photo_2_path) allPaths.push(p.back_photo_2_path)
    if (p.voice_path) allPaths.push(p.voice_path)
    const nativePath = (p as Record<string, unknown>).voice_native_path as string | null
    if (nativePath) allPaths.push(nativePath)
    // front photo only for already-revealed profiles
    if (revealedSet.has(p.id) && p.front_photo_path) allPaths.push(p.front_photo_path)
  }
  if (myRow?.back_photo_1_path) allPaths.push(myRow.back_photo_1_path)
  if (myRow?.back_photo_2_path) allPaths.push(myRow.back_photo_2_path)
  if (myRow?.voice_path) allPaths.push(myRow.voice_path)
  if (myRow?.front_photo_path) allPaths.push(myRow.front_photo_path)
  const myNativePath = (myRow as Record<string, unknown>)?.voice_native_path as string | null
  if (myNativePath) allPaths.push(myNativePath)

  // Batch sign all URLs in one call
  const urlMap: Record<string, string> = {}
  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(allPaths, 3600)

    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlMap[item.path] = item.signedUrl
    }
  }

  const profiles: ProfileData[] = (rows ?? []).map((p) => ({
    id: p.id,
    member_id: (p as Record<string, unknown>).member_id as string ?? null,
    full_name: p.full_name,
    age: p.age,
    gender: p.gender,
    city: p.city,
    country: p.country,
    religion: p.religion,
    mother_tongue: p.mother_tongue,
    education: p.education,
    occupation: p.occupation,
    height: p.height ?? null,
    weight: p.weight ?? null,
    ethnicity: p.ethnicity ?? null,
    education_subject: p.education_subject ?? null,
    employment_status: p.employment_status ?? null,
    marital_status: p.marital_status ?? null,
    has_kids: p.has_kids ?? null,
    id_verified: p.id_verified ?? false,
    back_photo_1_url: p.back_photo_1_path ? (urlMap[p.back_photo_1_path] ?? null) : null,
    back_photo_2_url: p.back_photo_2_path ? (urlMap[p.back_photo_2_path] ?? null) : null,
    voice_url: p.voice_path ? (urlMap[p.voice_path] ?? null) : null,
    front_photo_url:
      revealedSet.has(p.id) && p.front_photo_path
        ? (urlMap[p.front_photo_path] ?? null)
        : null,
    already_revealed: revealedSet.has(p.id),
    meeting_room_id: meetingByOther[p.id]?.room_id ?? null,
    meeting_status: meetingByOther[p.id]?.status ?? null,
    fav_reels: p.fav_reels ?? null,
    fav_youtube: p.fav_youtube ?? null,
    fav_web_series: p.fav_web_series ?? null,
    fav_travel: p.fav_travel ?? null,
    fav_foods: p.fav_foods ?? null,
    fav_ai_tools: p.fav_ai_tools ?? null,
    zodiac_sign: (p as Record<string, unknown>).zodiac_sign as string ?? null,
    sub_religion: (p as Record<string, unknown>).sub_religion as string ?? null,
    hobby: (p as Record<string, unknown>).hobby as string ?? null,
    university: (p as Record<string, unknown>).university as string ?? null,
    other_qualifications: (p as Record<string, unknown>).other_qualifications as string ?? null,
    housing: (p as Record<string, unknown>).housing as string ?? null,
    voice_native_url: (p as Record<string, unknown>).voice_native_path
      ? (urlMap[(p as Record<string, unknown>).voice_native_path as string] ?? null)
      : null,
    pref_gender: (p as Record<string, unknown>).pref_gender as string ?? null,
    pref_age_min: (p as Record<string, unknown>).pref_age_min as number ?? null,
    pref_age_max: (p as Record<string, unknown>).pref_age_max as number ?? null,
    pref_location: (p as Record<string, unknown>).pref_location as string ?? null,
    pref_religion: (p as Record<string, unknown>).pref_religion as string ?? null,
    pref_sub_religion: (p as Record<string, unknown>).pref_sub_religion as string ?? null,
    pref_occupation: (p as Record<string, unknown>).pref_occupation as string ?? null,
    pref_height: (p as Record<string, unknown>).pref_height as string ?? null,
    pref_ethnicity: (p as Record<string, unknown>).pref_ethnicity as string ?? null,
  }))

  // Build a preview of the current user's own profile, as seen by other members
  const myProfile: ProfileData | null = myRow ? {
    id: myRow.id,
    member_id: (myRow as Record<string, unknown>).member_id as string ?? null,
    full_name: myRow.full_name,
    age: myRow.age,
    gender: myRow.gender,
    city: myRow.city,
    country: myRow.country,
    religion: myRow.religion,
    mother_tongue: myRow.mother_tongue,
    education: myRow.education,
    occupation: myRow.occupation,
    height: myRow.height ?? null,
    weight: myRow.weight ?? null,
    ethnicity: myRow.ethnicity ?? null,
    education_subject: myRow.education_subject ?? null,
    employment_status: myRow.employment_status ?? null,
    marital_status: myRow.marital_status ?? null,
    has_kids: myRow.has_kids ?? null,
    id_verified: myRow.id_verified ?? false,
    back_photo_1_url: myRow.back_photo_1_path ? (urlMap[myRow.back_photo_1_path] ?? null) : null,
    back_photo_2_url: myRow.back_photo_2_path ? (urlMap[myRow.back_photo_2_path] ?? null) : null,
    voice_url: myRow.voice_path ? (urlMap[myRow.voice_path] ?? null) : null,
    front_photo_url: myRow.front_photo_path ? (urlMap[myRow.front_photo_path] ?? null) : null,
    already_revealed: false,
    meeting_room_id: null,
    meeting_status: null,
    fav_reels: myRow.fav_reels ?? null,
    fav_youtube: myRow.fav_youtube ?? null,
    fav_web_series: myRow.fav_web_series ?? null,
    fav_travel: myRow.fav_travel ?? null,
    fav_foods: myRow.fav_foods ?? null,
    fav_ai_tools: myRow.fav_ai_tools ?? null,
    zodiac_sign: (myRow as Record<string, unknown>).zodiac_sign as string ?? null,
    sub_religion: (myRow as Record<string, unknown>).sub_religion as string ?? null,
    hobby: (myRow as Record<string, unknown>).hobby as string ?? null,
    university: (myRow as Record<string, unknown>).university as string ?? null,
    other_qualifications: (myRow as Record<string, unknown>).other_qualifications as string ?? null,
    housing: (myRow as Record<string, unknown>).housing as string ?? null,
    voice_native_url: (myRow as Record<string, unknown>).voice_native_path
      ? (urlMap[(myRow as Record<string, unknown>).voice_native_path as string] ?? null)
      : null,
    pref_gender: (myRow as Record<string, unknown>).pref_gender as string ?? null,
    pref_age_min: (myRow as Record<string, unknown>).pref_age_min as number ?? null,
    pref_age_max: (myRow as Record<string, unknown>).pref_age_max as number ?? null,
    pref_location: (myRow as Record<string, unknown>).pref_location as string ?? null,
    pref_religion: (myRow as Record<string, unknown>).pref_religion as string ?? null,
    pref_sub_religion: (myRow as Record<string, unknown>).pref_sub_religion as string ?? null,
    pref_occupation: (myRow as Record<string, unknown>).pref_occupation as string ?? null,
    pref_height: (myRow as Record<string, unknown>).pref_height as string ?? null,
    pref_ethnicity: (myRow as Record<string, unknown>).pref_ethnicity as string ?? null,
  } : null

  // Inbox: notifications + pending meeting requests received
  const [notifRes, pendingMeetingsRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, message, type, read, created_at, sender_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('video_meetings')
      .select('id, room_id, requester_id, status, preferred_date, preferred_time, message, created_at')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const notifications = notifRes.data ?? []
  const pendingMeetings = pendingMeetingsRes.data ?? []

  // Fetch sender names for notifications and meeting requesters
  const senderIds = [
    ...new Set([
      ...notifications.map(n => n.sender_id).filter(Boolean),
      ...pendingMeetings.map(m => m.requester_id),
    ])
  ]
  const senderNames: Record<string, string> = {}
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', senderIds)
    for (const s of senders ?? []) senderNames[s.id] = s.full_name ?? 'Someone'
  }

  const inboxNotifications = notifications.map(n => ({
    id: n.id,
    message: n.message,
    type: (n as Record<string, unknown>).type as string ?? 'general',
    read: n.read,
    created_at: n.created_at,
    sender_name: n.sender_id ? (senderNames[n.sender_id] ?? 'Someone') : null,
  }))

  const inboxMeetings = pendingMeetings.map(m => ({
    id: m.id,
    room_id: m.room_id,
    requester_name: senderNames[m.requester_id] ?? 'Someone',
    requester_id: m.requester_id,
    preferred_date: (m as Record<string, unknown>).preferred_date as string ?? null,
    preferred_time: (m as Record<string, unknown>).preferred_time as string ?? null,
    message: m.message ?? null,
    created_at: m.created_at,
  }))

  const unreadCount = notifications.filter(n => !n.read).length + pendingMeetings.length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07111f' }}>
      <style>{`
        .disc-main { padding: 5.5rem 1.5rem 5rem; }
        .disc-h1 { font-size: 2rem; }
        @media (max-width: 600px) {
          .disc-main { padding: 5rem 0.75rem 7rem; }
          .disc-h1 { font-size: 1.5rem; }
        }
        @media (max-width: 400px) {
          .disc-main { padding: 4.5rem 0.5rem 7rem; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

      <Navigation />

      <main className="disc-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Heading + Inbox button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <h1 className="disc-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: '#f5f0e6', margin: '0 0 0.5rem' }}>
              Discover
            </h1>
            <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)' }} />
          </div>
        </div>

        {/* Grid client — search, AI, inbox, cards */}
        <DiscoverClient
          profiles={profiles} canReveal={canReveal} canMeet={canMeet} meetingsLeft={meetingsLeft} myProfile={myProfile}
          inboxNotifications={inboxNotifications} inboxMeetings={inboxMeetings} unreadCount={unreadCount}
        />
      </main>
    </div>
  )
}
