'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AboutStep from './steps/AboutStep'
import BackgroundStep from './steps/BackgroundStep'
import PreferencesStep from './steps/PreferencesStep'
import VoiceStep from './steps/VoiceStep'
import PhotosStep from './steps/PhotosStep'
import PersonalityStep from './steps/PersonalityStep'

const STEPS = ['About You', 'Your Heritage', 'Preferences', 'Voice Intro', 'Your Photos', 'Personality']

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', rose: '#9e2a2b',
}

interface Draft {
  fullName: string; age: string; gender: string; city: string; country: string
  religion: string; motherTongue: string; education: string; occupation: string
  prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string
  favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string
}

const EMPTY: Draft = {
  fullName: '', age: '', gender: '', city: '', country: '',
  religion: '', motherTongue: '', education: '', occupation: '',
  prefGender: '', prefAgeMin: '18', prefAgeMax: '50', prefLocation: '', prefReligion: '',
  favReels: '', favYoutube: '', favWebSeries: '', favTravel: '', favFoods: '', favAiTools: '',
}

export default function OnboardingPageWrapper() {
  return (
    <Suspense>
      <OnboardingPage />
    </Suspense>
  )
}

function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [back1, setBack1] = useState<File | null>(null)
  const [back2, setBack2] = useState<File | null>(null)
  const [front, setFront] = useState<File | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === 'true'

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (profile?.onboarding_complete && !isEdit) { router.replace('/discover'); return }
      setUserId(user.id)
      // Pre-fill draft with existing profile data when editing
      if (profile) {
        setDraft({
          fullName: profile.full_name ?? user.user_metadata?.full_name ?? '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          religion: profile.religion ?? '',
          motherTongue: profile.mother_tongue ?? '',
          education: profile.education ?? '',
          occupation: profile.occupation ?? '',
          prefGender: profile.pref_gender ?? '',
          prefAgeMin: profile.pref_age_min ? String(profile.pref_age_min) : '18',
          prefAgeMax: profile.pref_age_max ? String(profile.pref_age_max) : '50',
          prefLocation: profile.pref_location ?? '',
          prefReligion: profile.pref_religion ?? '',
          favReels: profile.fav_reels ?? '',
          favYoutube: profile.fav_youtube ?? '',
          favWebSeries: profile.fav_web_series ?? '',
          favTravel: profile.fav_travel ?? '',
          favFoods: profile.fav_foods ?? '',
          favAiTools: profile.fav_ai_tools ?? '',
        })
      } else {
        setDraft(d => ({ ...d, fullName: user.user_metadata?.full_name ?? '' }))
      }
      setReady(true)
    }
    init()
  }, [router, isEdit])

  function change(key: string, value: string) { setDraft(d => ({ ...d, [key]: value })); setError('') }

  function validate(): string {
    if (step === 0) {
      if (!draft.age || parseInt(draft.age) < 18) return 'Please enter a valid age (18+).'
      if (!draft.gender) return 'Please select your gender.'
      if (!draft.city || !draft.country) return 'Please enter your city and country.'
    }
    if (step === 1 && (!draft.religion || !draft.motherTongue || !draft.education || !draft.occupation))
      return 'Please complete all fields.'
    if (step === 2) {
      if (!draft.prefGender) return 'Please select who you are looking for.'
      if (parseInt(draft.prefAgeMin) >= parseInt(draft.prefAgeMax)) return 'Max age must be greater than min age.'
      if (!draft.prefReligion) return 'Please select a religion preference.'
    }
    if (step === 3 && !voiceBlob && !isEdit) return 'Please record your voice introduction.'
    if (step === 4 && !isEdit) {
      if (!back1 || !back2) return 'Please upload both back-side photos.'
      if (!front) return 'Please upload your reveal photo.'
    }
    // Step 5 (personality) is optional — no validation required
    return ''
  }

  async function handleNext() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setError('')
    if (step < 5) { setStep(s => s + 1); return }

    setSaving(true)
    try {
      const supabase = createClient()

      let voicePath: string | null = null
      if (voiceBlob) {
        const ext = MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'
        const { data, error: vErr } = await supabase.storage.from('profile-media').upload(`${userId}/voice.${ext}`, voiceBlob, { upsert: true })
        if (vErr) console.warn('Voice upload:', vErr.message)
        voicePath = data?.path ?? null
      }

      // Only upload photos if new ones were selected
      let back1Path: string | null = null
      let back2Path: string | null = null
      let frontPath: string | null = null

      if (back1 && back2 && front) {
        const ext1 = back1.name.split('.').pop() ?? 'jpg'
        const ext2 = back2.name.split('.').pop() ?? 'jpg'
        const ext3 = front.name.split('.').pop() ?? 'jpg'
        const [r1, r2, r3] = await Promise.all([
          supabase.storage.from('profile-media').upload(`${userId}/back-1.${ext1}`, back1, { upsert: true }),
          supabase.storage.from('profile-media').upload(`${userId}/back-2.${ext2}`, back2, { upsert: true }),
          supabase.storage.from('profile-media').upload(`${userId}/front.${ext3}`, front, { upsert: true }),
        ])
        back1Path = r1.data?.path ?? null
        back2Path = r2.data?.path ?? null
        frontPath = r3.data?.path ?? null
      }

      const update: Record<string, unknown> = {
        id: userId,
        full_name: draft.fullName, age: parseInt(draft.age), gender: draft.gender,
        city: draft.city, country: draft.country, religion: draft.religion,
        mother_tongue: draft.motherTongue, education: draft.education, occupation: draft.occupation,
        pref_gender: draft.prefGender, pref_age_min: parseInt(draft.prefAgeMin),
        pref_age_max: parseInt(draft.prefAgeMax), pref_location: draft.prefLocation,
        pref_religion: draft.prefReligion,
        fav_reels: draft.favReels || null, fav_youtube: draft.favYoutube || null,
        fav_web_series: draft.favWebSeries || null, fav_travel: draft.favTravel || null,
        fav_foods: draft.favFoods || null, fav_ai_tools: draft.favAiTools || null,
        onboarding_complete: true, updated_at: new Date().toISOString(),
      }
      if (voicePath) update.voice_path = voicePath
      if (back1Path) update.back_photo_1_path = back1Path
      if (back2Path) update.back_photo_2_path = back2Path
      if (frontPath) update.front_photo_path = frontPath

      const { error: dbErr } = await supabase.from('profiles').upsert(update)

      if (dbErr) throw dbErr
      router.refresh()
      router.push(isEdit ? '/profile' : '/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💘</div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia }}>Preparing your profile…</p>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      {/* Logo + Progress */}
      <div style={{ width: '100%', maxWidth: '540px', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>💘</span>
            <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.4rem', fontWeight: 700, color: c.navy }}>Soul Mate</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia }}>{STEPS[step]}</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(13,31,60,0.08)', borderRadius: '2px' }}>
          <div style={{ height: '100%', background: c.gold, borderRadius: '2px', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i <= step ? c.gold : 'rgba(13,31,60,0.12)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '540px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: '1px solid rgba(13,31,60,0.08)', overflow: 'hidden' }}>

        <div style={{ padding: '2rem 2rem 1.25rem' }}>
          {step === 0 && <AboutStep data={draft} onChange={change} />}
          {step === 1 && <BackgroundStep data={draft} onChange={change} />}
          {step === 2 && <PreferencesStep data={draft} onChange={change} />}
          {step === 3 && <VoiceStep onVoiceChange={setVoiceBlob} hasRecording={!!voiceBlob} />}
          {step === 4 && <PhotosStep back1={back1} back2={back2} front={front} onPhotosChange={(b1, b2, f) => { setBack1(b1); setBack2(b2); setFront(f) }} />}
          {step === 5 && <PersonalityStep data={{ favReels: draft.favReels, favYoutube: draft.favYoutube, favWebSeries: draft.favWebSeries, favTravel: draft.favTravel, favFoods: draft.favFoods, favAiTools: draft.favAiTools }} onChange={change} />}

          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ padding: '1rem 2rem 1.75rem', display: 'flex', justifyContent: step > 0 ? 'space-between' : 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(13,31,60,0.06)' }}>
          {step > 0 && (
            <button onClick={() => { setStep(s => s - 1); setError('') }} disabled={saving}
              style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(13,31,60,0.2)', color: c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>
              ← Back
            </button>
          )}
          <button onClick={handleNext} disabled={saving}
            style={{ padding: '0.75rem 2rem', background: saving ? c.navyMid : c.navy, color: c.goldLight, border: 'none', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: saving ? 'default' : 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}>
            {saving ? 'Saving…' : step === 5 ? (isEdit ? 'Save Changes ✓' : 'Complete Profile ✓') : 'Continue →'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
        Your data is encrypted and private
      </p>
    </div>
  )
}
