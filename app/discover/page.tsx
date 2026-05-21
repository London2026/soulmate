import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import ProfileCard, { type ProfileData } from './ProfileCard'
import NotificationBanner from './NotificationBanner'
import DiscoverClient from './DiscoverClient'

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

  const userPlan = me?.plan ?? 'free'
  const canReveal = userPlan !== 'free'
  const canMeet   = userPlan !== 'free'

  // Fetch all complete profiles except the current user
  const { data: rows } = await supabase
    .from('profiles')
    .select(`
      id, full_name, age, gender, city, country,
      religion, mother_tongue, education, occupation,
      back_photo_1_path, back_photo_2_path, voice_path, front_photo_path,
      fav_reels, fav_youtube, fav_web_series, fav_travel, fav_foods, fav_ai_tools
    `)
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

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
    // front photo only for already-revealed profiles
    if (revealedSet.has(p.id) && p.front_photo_path) allPaths.push(p.front_photo_path)
  }

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
    full_name: p.full_name,
    age: p.age,
    gender: p.gender,
    city: p.city,
    country: p.country,
    religion: p.religion,
    mother_tongue: p.mother_tongue,
    education: p.education,
    occupation: p.occupation,
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
  }))

  // Fetch unread notifications for the current user
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, message, read, created_at')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0a1a 0%, #07111f 45%, #0f0a18 100%)' }}>
      <style>{`
        .disc-main { padding: 5.5rem 1.5rem 5rem; }
        .disc-h1 { font-size: 2rem; }
        @media (max-width: 600px) {
          .disc-main { padding: 5rem 0.85rem 6rem; }
          .disc-h1 { font-size: 1.5rem; }
        }

        /* Rose petal animation */
        @keyframes petalFall {
          0%   { transform: translateY(-40px) translateX(0px) rotate(0deg);   opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(105vh) translateX(var(--sway)) rotate(var(--spin)); opacity: 0; }
        }
        .petal {
          position: fixed;
          top: -40px;
          pointer-events: none;
          z-index: 1;
          border-radius: 150% 0 150% 0;
          animation: petalFall var(--dur) var(--delay) infinite ease-in;
          will-change: transform;
        }
      `}</style>

      {/* Rose petals */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {[
          { l:'3%',  w:10, h:14, c:'#ff8fab', dur:'9s',  delay:'0s',   sway:'40px',  spin:'600deg'  },
          { l:'8%',  w:8,  h:12, c:'#ffb3c6', dur:'12s', delay:'1.5s', sway:'-35px', spin:'480deg'  },
          { l:'15%', w:13, h:18, c:'#ff4d6d', dur:'8s',  delay:'3s',   sway:'50px',  spin:'720deg'  },
          { l:'22%', w:9,  h:13, c:'#ff8fab', dur:'14s', delay:'0.5s', sway:'-45px', spin:'540deg'  },
          { l:'30%', w:11, h:16, c:'#ffb3c6', dur:'10s', delay:'5s',   sway:'30px',  spin:'660deg'  },
          { l:'38%', w:7,  h:11, c:'#ff6b8b', dur:'11s', delay:'2s',   sway:'-50px', spin:'420deg'  },
          { l:'45%', w:14, h:19, c:'#ff4d6d', dur:'9s',  delay:'7s',   sway:'55px',  spin:'780deg'  },
          { l:'52%', w:9,  h:13, c:'#ffb3c6', dur:'13s', delay:'1s',   sway:'-30px', spin:'500deg'  },
          { l:'60%', w:11, h:15, c:'#ff8fab', dur:'8s',  delay:'4s',   sway:'45px',  spin:'640deg'  },
          { l:'67%', w:8,  h:12, c:'#ff6b8b', dur:'15s', delay:'0s',   sway:'-55px', spin:'460deg'  },
          { l:'74%', w:12, h:17, c:'#ff4d6d', dur:'10s', delay:'6s',   sway:'35px',  spin:'700deg'  },
          { l:'81%', w:10, h:14, c:'#ffb3c6', dur:'11s', delay:'2.5s', sway:'-40px', spin:'560deg'  },
          { l:'88%', w:8,  h:12, c:'#ff8fab', dur:'9s',  delay:'8s',   sway:'50px',  spin:'480deg'  },
          { l:'94%', w:13, h:18, c:'#ff6b8b', dur:'13s', delay:'3.5s', sway:'-35px', spin:'620deg'  },
          { l:'12%', w:9,  h:13, c:'#ff4d6d', dur:'11s', delay:'9s',   sway:'40px',  spin:'540deg'  },
          { l:'35%', w:7,  h:11, c:'#ffb3c6', dur:'14s', delay:'4.5s', sway:'-50px', spin:'660deg'  },
          { l:'57%', w:12, h:16, c:'#ff8fab', dur:'8s',  delay:'6.5s', sway:'30px',  spin:'720deg'  },
          { l:'78%', w:10, h:14, c:'#ff6b8b', dur:'12s', delay:'1.8s', sway:'-45px', spin:'500deg'  },
          { l:'92%', w:8,  h:12, c:'#ff4d6d', dur:'10s', delay:'7.5s', sway:'55px',  spin:'580deg'  },
          { l:'48%', w:11, h:15, c:'#ffb3c6', dur:'9s',  delay:'10s',  sway:'-30px', spin:'640deg'  },
        ].map((p, i) => (
          <span key={i} className="petal" style={{
            left: p.l,
            width: `${p.w}px`,
            height: `${p.h}px`,
            background: `radial-gradient(ellipse at 40% 35%, ${p.c}cc, ${p.c}66)`,
            boxShadow: `0 0 4px ${p.c}44`,
            ['--dur' as string]: p.dur,
            ['--delay' as string]: p.delay,
            ['--sway' as string]: p.sway,
            ['--spin' as string]: p.spin,
          }} />
        ))}
      </div>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(180,40,80,0.06) 0%, transparent 60%)' }} />

      <Navigation />

      <main className="disc-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="disc-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: '#f5f0e6', margin: '0 0 0.5rem' }}>
            Discover
          </h1>
          <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)' }} />
        </div>

        {/* Notifications */}
        <NotificationBanner notifications={notifications ?? []} />

        {/* Grid client — search, AI, cards */}
        {profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <DiscoverClient profiles={profiles} canReveal={canReveal} canMeet={canMeet} />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>
        💘
      </div>
      <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', color: '#f5f0e6', margin: '0 0 0.5rem' }}>
        No profiles yet
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: '#bdb5a6' }}>
        Be the first to invite someone to Soul Mate.
      </p>
    </div>
  )
}
