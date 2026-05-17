'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AboutStep from './steps/AboutStep'
import BackgroundStep from './steps/BackgroundStep'
import PreferencesStep from './steps/PreferencesStep'
import VoiceStep from './steps/VoiceStep'
import PhotosStep from './steps/PhotosStep'

const STEPS = ['About You', 'Your Heritage', 'Preferences', 'Voice Intro', 'Your Photos']

interface Draft {
  fullName: string; age: string; gender: string; city: string; country: string
  religion: string; motherTongue: string; education: string; occupation: string
  prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string
}

const EMPTY: Draft = {
  fullName: '', age: '', gender: '', city: '', country: '',
  religion: '', motherTongue: '', education: '', occupation: '',
  prefGender: '', prefAgeMin: '18', prefAgeMax: '50', prefLocation: '', prefReligion: '',
}

export default function OnboardingPage() {
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

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete, full_name')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.onboarding_complete) { router.replace('/discover'); return }

      setUserId(user.id)
      setDraft((d) => ({
        ...d,
        fullName: profile?.full_name ?? user.user_metadata?.full_name ?? '',
      }))
      setReady(true)
    }
    init()
  }, [router])

  function change(key: string, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
    setError('')
  }

  function validate(): string {
    switch (step) {
      case 0:
        if (!draft.age || parseInt(draft.age) < 18) return 'Please enter a valid age (18+).'
        if (!draft.gender) return 'Please select your gender.'
        if (!draft.city || !draft.country) return 'Please enter your city and country.'
        break
      case 1:
        if (!draft.religion || !draft.motherTongue || !draft.education || !draft.occupation)
          return 'Please complete all fields.'
        break
      case 2:
        if (!draft.prefGender) return 'Please select who you are looking for.'
        if (!draft.prefAgeMin || !draft.prefAgeMax) return 'Please enter an age range.'
        if (parseInt(draft.prefAgeMin) >= parseInt(draft.prefAgeMax))
          return 'Maximum age must be greater than minimum age.'
        if (!draft.prefReligion) return 'Please select a religion preference.'
        break
      case 3:
        if (!voiceBlob) return 'Please record your voice introduction.'
        break
      case 4:
        if (!back1 || !back2) return 'Please upload both back-side photos.'
        if (!front) return 'Please upload your reveal (face) photo.'
        break
    }
    return ''
  }

  async function handleNext() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setError('')

    if (step < 4) { setStep((s) => s + 1); return }

    // Final step — upload everything and save profile
    setSaving(true)
    try {
      const supabase = createClient()

      // Upload voice
      let voicePath: string | null = null
      if (voiceBlob) {
        const ext = MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'
        const { data } = await supabase.storage
          .from('profile-media')
          .upload(`${userId}/voice.${ext}`, voiceBlob, { upsert: true })
        voicePath = data?.path ?? null
      }

      // Upload photos in parallel
      const ext1 = back1!.name.split('.').pop() ?? 'jpg'
      const ext2 = back2!.name.split('.').pop() ?? 'jpg'
      const ext3 = front!.name.split('.').pop() ?? 'jpg'

      const [r1, r2, r3] = await Promise.all([
        supabase.storage.from('profile-media').upload(`${userId}/back-1.${ext1}`, back1!, { upsert: true }),
        supabase.storage.from('profile-media').upload(`${userId}/back-2.${ext2}`, back2!, { upsert: true }),
        supabase.storage.from('profile-media').upload(`${userId}/front.${ext3}`, front!, { upsert: true }),
      ])

      // Save profile row
      const { error: dbErr } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: draft.fullName,
        age: parseInt(draft.age),
        gender: draft.gender,
        city: draft.city,
        country: draft.country,
        religion: draft.religion,
        mother_tongue: draft.motherTongue,
        education: draft.education,
        occupation: draft.occupation,
        pref_gender: draft.prefGender,
        pref_age_min: parseInt(draft.prefAgeMin),
        pref_age_max: parseInt(draft.prefAgeMax),
        pref_location: draft.prefLocation,
        pref_religion: draft.prefReligion,
        voice_path: voicePath,
        back_photo_1_path: r1.data?.path ?? null,
        back_photo_2_path: r2.data?.path ?? null,
        front_photo_path: r3.data?.path ?? null,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })

      if (dbErr) throw dbErr
      router.push('/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--oxford-navy)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💘</div>
          <p className="text-sm" style={{ color: 'var(--ivory-dim)' }}>Preparing your profile…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: 'var(--oxford-navy)' }}>

      <div className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">💘</span>
            <span style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)', fontSize: '1.4rem' }}>
              Soul Mate
            </span>
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs tracking-widest" style={{ color: 'var(--antique-gold)' }}>
              STEP {step + 1} OF {STEPS.length}
            </span>
            <span className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
              {STEPS[step]}
            </span>
          </div>
          <div className="h-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.12)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
                background: 'linear-gradient(to right, var(--antique-gold-dark), var(--antique-gold-light))',
              }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= step ? 'var(--antique-gold)' : 'rgba(201,168,76,0.2)' }}
              />
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl px-8 py-8"
          style={{ backgroundColor: 'var(--oxford-navy-mid)', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>

          {step === 0 && <AboutStep data={draft} onChange={change} />}
          {step === 1 && <BackgroundStep data={draft} onChange={change} />}
          {step === 2 && <PreferencesStep data={draft} onChange={change} />}
          {step === 3 && <VoiceStep onVoiceChange={setVoiceBlob} hasRecording={!!voiceBlob} />}
          {step === 4 && (
            <PhotosStep
              back1={back1} back2={back2} front={front}
              onPhotosChange={(b1, b2, f) => { setBack1(b1); setBack2(b2); setFront(f) }}
            />
          )}

          {error && (
            <p className="mt-5 text-sm text-center rounded-lg px-3 py-2"
              style={{ color: '#F87171', backgroundColor: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className={`flex mt-8 gap-3 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setStep((s) => s - 1); setError('') }}
                disabled={saving}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all"
                style={{ color: 'var(--ivory-dim)', border: '1px solid rgba(201,168,76,0.2)' }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-8 py-3 rounded-lg text-sm font-semibold tracking-wider transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
                color: 'var(--oxford-navy)',
                boxShadow: '0 4px 20px rgba(201,168,76,0.25)',
              }}
            >
              {saving ? 'Saving…' : step === 4 ? 'Complete Profile ✓' : 'Continue →'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(189,181,166,0.35)' }}>
          Your data is encrypted and private
        </p>
      </div>
    </div>
  )
}
