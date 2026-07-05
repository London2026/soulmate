'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import AboutStep from './steps/AboutStep'
import BackgroundStep from './steps/BackgroundStep'
import PreferencesStep from './steps/PreferencesStep'
import VoiceStep from './steps/VoiceStep'
import PhotosStep from './steps/PhotosStep'
import PersonalityStep from './steps/PersonalityStep'
import IdVerificationStep from './steps/IdVerificationStep'
import HabitsStep from './steps/HabitsStep'

const STEPS = ['About You', 'Your Heritage', 'Preferences', 'Voice Intro', 'Your Photos', 'Personality', 'Lifestyle & Habits', 'ID Verification']
const STEP_TIME = ['~2 minutes', '~2 minutes', '~2 minutes', '~3 minutes', '~3 minutes', '~5 minutes', '~2 minutes', '~2 minutes']

function buildTextUpdate(d: Draft): Record<string, unknown> {
  return {
    full_name: (d.firstName.trim() + ' ' + d.lastName.trim()).trim() || null,
    age: d.age ? parseInt(d.age) : null,
    gender: d.gender || null,
    city: d.city || null, country: d.country || null,
    height: d.height || null, weight: d.weight || null, ethnicity: d.ethnicity || null,
    zodiac_sign: d.zodiacSign || null,
    religion: d.religion || null,
    sub_religion: d.subReligion || null,
    mother_tongue: d.motherTongue || null,
    education: d.education || null,
    university: d.university || null,
    education_subject: d.educationSubject || null,
    other_qualifications: d.otherQualifications || null,
    employment_status: d.employmentStatus || null,
    occupation: d.occupation || null,
    housing: d.housing || null,
    marital_status: d.maritalStatus || null, has_kids: d.hasKids || null,
    pref_gender: d.prefGender || null,
    pref_age_min: d.prefAgeMin ? parseInt(d.prefAgeMin) : null,
    pref_age_max: d.prefAgeMax ? parseInt(d.prefAgeMax) : null,
    pref_location: d.prefLocation || null, pref_religion: d.prefReligion || null,
    pref_sub_religion: d.prefSubReligion || null,
    pref_occupation: d.prefOccupation || null, pref_height: d.prefHeight || null, pref_ethnicity: d.prefEthnicity || null,
    other_preferences: d.otherPreferences || null,
    phone: d.phone.trim() || null,
    fav_reels: d.favReels || null, fav_youtube: d.favYoutube || null,
    fav_web_series: d.favWebSeries || null, fav_travel: d.favTravel || null,
    fav_foods: d.favFoods || null, fav_ai_tools: d.favAiTools || null,
    hobby: d.hobby || null,
    habit_smoking: d.habitSmoking || null,
    habit_drinking: d.habitDrinking || null,
    habit_drugs: d.habitDrugs || null,
    habit_betting: d.habitBetting || null,
    id_country: d.idCountry || null,
    updated_at: new Date().toISOString(),
  }
}

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', rose: '#9e2a2b',
}

interface Draft {
  firstName: string; lastName: string; age: string; gender: string; city: string; country: string; phone: string; height: string; weight: string; ethnicity: string; zodiacSign: string
  religion: string; subReligion: string; motherTongue: string
  education: string; university: string; educationSubject: string; otherQualifications: string
  employmentStatus: string; occupation: string; housing: string
  maritalStatus: string; hasKids: string
  prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string; prefSubReligion: string; prefOccupation: string; prefHeight: string; prefEthnicity: string; otherPreferences: string
  favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string; hobby: string
  habitSmoking: string; habitDrinking: string; habitDrugs: string; habitBetting: string
  idCountry: string
}

const EMPTY: Draft = {
  firstName: '', lastName: '', age: '', gender: '', city: '', country: '', phone: '', height: '', weight: '', ethnicity: '', zodiacSign: '',
  religion: '', subReligion: '', motherTongue: '',
  education: '', university: '', educationSubject: '', otherQualifications: '',
  employmentStatus: '', occupation: '', housing: '',
  maritalStatus: '', hasKids: '',
  prefGender: '', prefAgeMin: '18', prefAgeMax: '50', prefLocation: '', prefReligion: '', prefSubReligion: '', prefOccupation: '', prefHeight: '', prefEthnicity: '', otherPreferences: '',
  favReels: '', favYoutube: '', favWebSeries: '', favTravel: '', favFoods: '', favAiTools: '', hobby: '',
  habitSmoking: '', habitDrinking: '', habitDrugs: '', habitBetting: '',
  idCountry: '',
}

export default function OnboardingPageWrapper() {
  return (
    <Suspense>
      <OnboardingPage />
    </Suspense>
  )
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' as const } }),
}

function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [nativeVoiceBlob, setNativeVoiceBlob] = useState<Blob | null>(null)
  const [existingEnglishUrl, setExistingEnglishUrl] = useState<string | null>(null)
  const [existingNativeUrl, setExistingNativeUrl] = useState<string | null>(null)
  const [back1, setBack1] = useState<File | null>(null)
  const [back2, setBack2] = useState<File | null>(null)
  const [front, setFront] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [hasExistingPhotos, setHasExistingPhotos] = useState(false)
  const [hasExistingVoice, setHasExistingVoice] = useState(false)
  const [existingBack1Url, setExistingBack1Url] = useState<string | null>(null)
  const [existingBack2Url, setExistingBack2Url] = useState<string | null>(null)
  const [existingFrontUrl, setExistingFrontUrl] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveClear = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)
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
      setHasExistingPhotos(!!(profile?.back_photo_1_path && profile?.back_photo_2_path && profile?.front_photo_path))
      setHasExistingVoice(!!profile?.voice_path)
      // Fetch signed URLs for existing media so they can be shown on return
      const nativePath = (profile as Record<string, unknown>)?.voice_native_path as string | null
      const voicePaths = [profile?.voice_path, nativePath, profile?.back_photo_1_path, profile?.back_photo_2_path, (profile as Record<string, unknown>)?.front_photo_path as string | null].filter((p): p is string => !!p)
      if (voicePaths.length) {
        const { data: signed } = await supabase.storage.from('profile-media').createSignedUrls(voicePaths, 3600)
        const urlMap: Record<string, string> = {}
        for (const s of signed ?? []) { if (s.path && s.signedUrl) urlMap[s.path] = s.signedUrl }
        if (profile?.voice_path) setExistingEnglishUrl(urlMap[profile.voice_path] ?? null)
        if (nativePath) setExistingNativeUrl(urlMap[nativePath] ?? null)
        if (profile?.back_photo_1_path) setExistingBack1Url(urlMap[profile.back_photo_1_path] ?? null)
        if (profile?.back_photo_2_path) setExistingBack2Url(urlMap[profile.back_photo_2_path] ?? null)
        const fp = (profile as Record<string, unknown>)?.front_photo_path as string | null
        if (fp) setExistingFrontUrl(urlMap[fp] ?? null)
      }
      // Pre-fill draft with existing profile data when editing
      if (profile) {
        const rawName = (profile.full_name ?? user.user_metadata?.full_name ?? '').trim()
        const nameParts = rawName.split(/\s+/).filter(Boolean)
        setDraft({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' ') ?? '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          religion: profile.religion ?? '',
          subReligion: (profile as Record<string, unknown>).sub_religion as string ?? '',
          motherTongue: profile.mother_tongue ?? '',
          education: profile.education ?? '',
          university: (profile as Record<string, unknown>).university as string ?? '',
          educationSubject: (profile as Record<string, unknown>).education_subject as string ?? '',
          otherQualifications: (profile as Record<string, unknown>).other_qualifications as string ?? '',
          employmentStatus: (profile as Record<string, unknown>).employment_status as string ?? '',
          occupation: profile.occupation ?? '',
          housing: (profile as Record<string, unknown>).housing as string ?? '',
          prefGender: profile.pref_gender ?? '',
          prefAgeMin: profile.pref_age_min ? String(profile.pref_age_min) : '18',
          prefAgeMax: profile.pref_age_max ? String(profile.pref_age_max) : '50',
          prefLocation: profile.pref_location ?? '',
          prefReligion: profile.pref_religion ?? '',
          prefSubReligion: (profile as Record<string, unknown>).pref_sub_religion as string ?? '',
          prefOccupation: (profile as Record<string, unknown>).pref_occupation as string ?? '',
          prefHeight: (profile as Record<string, unknown>).pref_height as string ?? '',
          prefEthnicity: (profile as Record<string, unknown>).pref_ethnicity as string ?? '',
          otherPreferences: (profile as Record<string, unknown>).other_preferences as string ?? '',
          phone: profile.phone ?? '',
          height: (profile as Record<string, unknown>).height as string ?? '',
          weight: (profile as Record<string, unknown>).weight as string ?? '',
          ethnicity: (profile as Record<string, unknown>).ethnicity as string ?? '',
          zodiacSign: (profile as Record<string, unknown>).zodiac_sign as string ?? '',
          maritalStatus: profile.marital_status ?? '',
          hasKids: profile.has_kids ?? '',
          favReels: profile.fav_reels ?? '',
          favYoutube: profile.fav_youtube ?? '',
          favWebSeries: profile.fav_web_series ?? '',
          favTravel: profile.fav_travel ?? '',
          favFoods: profile.fav_foods ?? '',
          favAiTools: profile.fav_ai_tools ?? '',
          hobby: profile.hobby ?? '',
          habitSmoking: (profile as Record<string, unknown>).habit_smoking as string ?? '',
          habitDrinking: (profile as Record<string, unknown>).habit_drinking as string ?? '',
          habitDrugs: (profile as Record<string, unknown>).habit_drugs as string ?? '',
          habitBetting: (profile as Record<string, unknown>).habit_betting as string ?? '',
          idCountry: profile.id_country ?? '',
        })
      } else {
        const rawName = (user.user_metadata?.full_name ?? '').trim()
        const nameParts = rawName.split(/\s+/).filter(Boolean)
        setDraft(d => ({ ...d, firstName: nameParts[0] ?? '', lastName: nameParts.slice(1).join(' ') ?? '' }))
      }
      setReady(true)
    }
    init()
  }, [router, isEdit])

  // Auto-save text fields 2.5 s after the last keystroke
  useEffect(() => {
    if (!ready || !userId) return
    if (!initialized.current) { initialized.current = true; return }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (autoSaveClear.current) clearTimeout(autoSaveClear.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving')
      try {
        const supabase = createClient()
        await supabase.from('profiles').upsert({ id: userId, ...buildTextUpdate(draft) })
        setAutoSaveStatus('saved')
        autoSaveClear.current = setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } catch { setAutoSaveStatus('idle') }
    }, 2500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  function change(key: string, value: string) { setDraft(d => ({ ...d, [key]: value })); setError('') }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      await supabase.from('profiles').upsert({ id: userId, ...buildTextUpdate(draft) })
      setAutoSaveStatus('saved')
      if (autoSaveClear.current) clearTimeout(autoSaveClear.current)
      autoSaveClear.current = setTimeout(() => setAutoSaveStatus('idle'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function validate(): string {
    if (step === 0) {
      if (!draft.firstName.trim() || !draft.lastName.trim()) return 'Please enter your first and last name.'
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
    if (step === 3 && !voiceBlob && !hasExistingVoice) return 'Please record your English voice introduction — it is required to continue.'
    if (step === 4) {
      if (!back1 && !hasExistingPhotos) return 'Please upload both back-side photos.'
      if ((!back1 || !back2) && !hasExistingPhotos) return 'Please upload both back-side photos.'
      if (!front && !hasExistingPhotos) return 'Please upload your reveal photo.'
    }
    if (step === 5) {
      if (!draft.favReels.trim())     return 'Please add at least one favourite Social Media Reel.'
      if (!draft.favYoutube.trim())   return 'Please add at least one favourite YouTube Channel.'
      if (!draft.favWebSeries.trim()) return 'Please add at least one favourite Web Series.'
      if (!draft.favTravel.trim())    return 'Please add at least one favourite Travel Destination.'
      if (!draft.favFoods.trim())     return 'Please add at least one favourite Food.'
      if (!draft.favAiTools.trim())   return 'Please add at least one favourite AI Tool.'
      if (!draft.hobby.trim())        return 'Please add at least one Hobby or Interest.'
    }
    return ''
  }

  async function handleNext() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setError('')
    if (step < 7) { setDirection(1); setStep(s => s + 1); return }

    setSaving(true)
    try {
      const supabase = createClient()

      const audioExt = MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'
      let voicePath: string | null = null
      if (voiceBlob) {
        const { data, error: vErr } = await supabase.storage.from('profile-media').upload(`${userId}/voice.${audioExt}`, voiceBlob, { upsert: true })
        if (vErr) console.warn('Voice upload:', vErr.message)
        voicePath = data?.path ?? null
      }
      let nativeVoicePath: string | null = null
      if (nativeVoiceBlob) {
        const { data } = await supabase.storage.from('profile-media').upload(`${userId}/voice-native.${audioExt}`, nativeVoiceBlob, { upsert: true })
        nativeVoicePath = data?.path ?? null
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

      // Upload ID document if provided
      let idDocPath: string | null = null
      if (idFile) {
        const idExt = idFile.name.split('.').pop() ?? 'jpg'
        const { data: idData } = await supabase.storage.from('profile-media').upload(`${userId}/id-document.${idExt}`, idFile, { upsert: true })
        idDocPath = idData?.path ?? null
      }

      const update: Record<string, unknown> = {
        id: userId,
        full_name: (draft.firstName.trim() + ' ' + draft.lastName.trim()).trim(),
        age: parseInt(draft.age), gender: draft.gender,
        city: draft.city, country: draft.country,
        height: draft.height || null, weight: draft.weight || null, ethnicity: draft.ethnicity || null,
        zodiac_sign: draft.zodiacSign || null,
        religion: draft.religion,
        mother_tongue: draft.motherTongue, education: draft.education,
        education_subject: draft.educationSubject || null, employment_status: draft.employmentStatus || null,
        occupation: draft.occupation,
        marital_status: draft.maritalStatus || null, has_kids: draft.hasKids || null,
        pref_gender: draft.prefGender, pref_age_min: parseInt(draft.prefAgeMin),
        pref_age_max: parseInt(draft.prefAgeMax), pref_location: draft.prefLocation,
        pref_religion: draft.prefReligion,
        pref_sub_religion: draft.prefSubReligion || null,
        pref_occupation: draft.prefOccupation || null, pref_height: draft.prefHeight || null, pref_ethnicity: draft.prefEthnicity || null,
        other_preferences: draft.otherPreferences || null,
        phone: draft.phone.trim() || null,
        fav_reels: draft.favReels || null, fav_youtube: draft.favYoutube || null,
        fav_web_series: draft.favWebSeries || null, fav_travel: draft.favTravel || null,
        fav_foods: draft.favFoods || null, fav_ai_tools: draft.favAiTools || null,
        hobby: draft.hobby || null,
        habit_smoking: draft.habitSmoking || null,
        habit_drinking: draft.habitDrinking || null,
        habit_drugs: draft.habitDrugs || null,
        habit_betting: draft.habitBetting || null,
        id_country: draft.idCountry || null,
        onboarding_complete: true, updated_at: new Date().toISOString(),
      }
      if (idDocPath) update.id_document_path = idDocPath
      if (voicePath) update.voice_path = voicePath
      if (nativeVoicePath) update.voice_native_path = nativeVoicePath
      if (back1Path) update.back_photo_1_path = back1Path
      if (back2Path) update.back_photo_2_path = back2Path
      if (frontPath) update.front_photo_path = frontPath

      const { error: dbErr } = await supabase.from('profiles').upsert(update)

      if (dbErr) throw dbErr

      // Notify admin when a new member completes onboarding (not on edits)
      if (!isEdit) {
        fetch('/api/notify-admin-onboarding', { method: 'POST' }).catch(() => {})
      }

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
          <img src="/banduraa-logo.png" alt="Banduraa" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '12px', marginBottom: '0.75rem' }} />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia }}>Preparing your profile…</p>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleSaveAndExit() {
    setSaving(true); setError('')
    try {
      const supabase = createClient()

      const audioExt2 = MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'
      let voicePath: string | null = null
      if (voiceBlob) {
        const { data } = await supabase.storage.from('profile-media').upload(`${userId}/voice.${audioExt2}`, voiceBlob, { upsert: true })
        voicePath = data?.path ?? null
      }
      let nativeVoicePath2: string | null = null
      if (nativeVoiceBlob) {
        const { data } = await supabase.storage.from('profile-media').upload(`${userId}/voice-native.${audioExt2}`, nativeVoiceBlob, { upsert: true })
        nativeVoicePath2 = data?.path ?? null
      }

      let back1Path: string | null = null, back2Path: string | null = null, frontPath: string | null = null
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

      let idDocPath: string | null = null
      if (idFile) {
        const idExt = idFile.name.split('.').pop() ?? 'jpg'
        const { data: idData } = await supabase.storage.from('profile-media').upload(`${userId}/id-document.${idExt}`, idFile, { upsert: true })
        idDocPath = idData?.path ?? null
      }

      const update: Record<string, unknown> = { id: userId, ...buildTextUpdate(draft) }
      if (idDocPath) update.id_document_path = idDocPath
      if (voicePath) update.voice_path = voicePath
      if (nativeVoicePath2) update.voice_native_path = nativeVoicePath2
      if (back1Path) update.back_photo_1_path = back1Path
      if (back2Path) update.back_photo_2_path = back2Path
      if (frontPath) update.front_photo_path = frontPath

      const { error: dbErr } = await supabase.from('profiles').upsert(update)
      if (dbErr) throw dbErr

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ob-page" style={{ minHeight: '100dvh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 0.75rem' }}>
      <style>{`
        .ob-page { box-sizing: border-box; }
        .ob-logo { width: 120px; height: 120px; }
        .ob-progress { width: 100%; max-width: 720px; margin-bottom: 1rem; }
        .ob-topnav { width: 100%; max-width: 720px; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
        .ob-topnav a, .ob-topnav button { font-family: Raleway, sans-serif; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 0.35rem 0.85rem; border-radius: 4px; cursor: pointer; border: 1px solid rgba(13,31,60,0.18); background: transparent; color: #2c4a6e; }
        .ob-topnav button { color: #9e2a2b; border-color: rgba(158,42,43,0.2); }
        .ob-card { width: 100%; max-width: 720px; background: #fff; border-radius: 10px; box-shadow: 0 16px 60px rgba(13,31,60,0.12); border: 1px solid rgba(13,31,60,0.08); overflow: hidden; }
        .ob-card-inner { padding: 2.5rem 2.5rem 1.5rem; }
        .ob-nav { padding: 1.25rem 2.5rem 2rem; display: flex; gap: 0.75rem; border-top: 1px solid rgba(13,31,60,0.06); }
        .ob-btn-back { padding: 0.9rem 2rem; background: transparent; border: 1px solid rgba(13,31,60,0.2); color: #5a6e82; font-family: Raleway, sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; white-space: nowrap; }
        .ob-btn-next { padding: 0.9rem 2.25rem; border: none; font-family: Raleway, sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; transition: background 0.2s; white-space: nowrap; }
        .ob-step-h2 { font-family: var(--font-playfair, "Playfair Display", serif); font-size: 1.9rem; font-weight: 600; }
        @keyframes obFieldIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ob-step-anim > div > * { opacity: 0; animation: obFieldIn 0.55s ease forwards; }
        .ob-step-anim > div > *:nth-child(1)  { animation-delay: 0.05s; }
        .ob-step-anim > div > *:nth-child(2)  { animation-delay: 0.12s; }
        .ob-step-anim > div > *:nth-child(3)  { animation-delay: 0.19s; }
        .ob-step-anim > div > *:nth-child(4)  { animation-delay: 0.26s; }
        .ob-step-anim > div > *:nth-child(5)  { animation-delay: 0.33s; }
        .ob-step-anim > div > *:nth-child(6)  { animation-delay: 0.40s; }
        .ob-step-anim > div > *:nth-child(7)  { animation-delay: 0.47s; }
        .ob-step-anim > div > *:nth-child(8)  { animation-delay: 0.54s; }
        .ob-step-anim > div > *:nth-child(n+9){ animation-delay: 0.6s; }
        @media (prefers-reduced-motion: reduce) {
          .ob-step-anim > div > * { animation: none; opacity: 1; }
        }
        @media (max-width: 640px) {
          .ob-page { justify-content: flex-start !important; padding-top: 1.25rem !important; padding-bottom: 1.5rem !important; }
          .ob-logo { width: 80px !important; height: 80px !important; }
          .ob-progress { margin-bottom: 0.75rem; }
          .ob-card-inner { padding: 1.1rem 1rem 0.9rem !important; }
          .ob-nav { padding: 0.85rem 1rem 1.25rem !important; }
          .ob-btn-back { padding: 0.8rem 1rem !important; font-size: 0.75rem !important; }
          .ob-btn-next { padding: 0.8rem 1rem !important; font-size: 0.75rem !important; flex: 1 !important; }
          .ob-step-h2 { font-size: 1.5rem !important; }
          .ob-topnav a, .ob-topnav button { font-size: 0.65rem !important; padding: 0.3rem 0.6rem !important; }
        }
      `}</style>

      {/* Top navigation */}
      <nav className="ob-topnav">
        <Link href="/discover">← Discover</Link>
        <Link href="/">Home</Link>
        <button onClick={handleLogout}>Log out</button>
      </nav>

      {/* Logo + Progress */}
      <div className="ob-progress">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <img src="/banduraa-logo.png" alt="Banduraa" className="ob-logo" style={{ objectFit: 'contain', borderRadius: '12px', boxShadow: '0 4px 20px rgba(13,31,60,0.12)' }} />
          </Link>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#fff', background: 'rgba(139,105,20,0.75)', padding: '0.2rem 0.6rem', borderRadius: '20px', letterSpacing: '0.05em' }}>
              ⏱ {STEP_TIME[step]}
            </span>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', color: c.sepia }}>{STEPS[step]}</span>
          </div>
        </div>
        <div style={{ height: '3px', background: 'rgba(13,31,60,0.08)', borderRadius: '2px' }}>
          <motion.div
            style={{ height: '100%', background: c.gold, borderRadius: '2px' }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          {STEPS.map((_, i) => (
            <motion.div key={i}
              style={{ width: '6px', height: '6px', borderRadius: '50%' }}
              initial={false}
              animate={{ background: i <= step ? c.gold : 'rgba(13,31,60,0.12)', scale: i === step ? 1.5 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="ob-card">

        <div className="ob-card-inner" style={{ overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div key={step} className="ob-step-anim" custom={direction}
            variants={stepVariants} initial="enter" animate="center" exit="exit">
          {step === 0 && <AboutStep data={{ ...draft }} onChange={change} />}
          {step === 1 && <BackgroundStep data={{ religion: draft.religion, subReligion: draft.subReligion, motherTongue: draft.motherTongue, education: draft.education, university: draft.university, educationSubject: draft.educationSubject, otherQualifications: draft.otherQualifications, employmentStatus: draft.employmentStatus, occupation: draft.occupation, housing: draft.housing, maritalStatus: draft.maritalStatus, hasKids: draft.hasKids }} onChange={change} />}
          {step === 2 && <PreferencesStep data={draft} onChange={change} />}
          {step === 3 && <VoiceStep
            onEnglishChange={setVoiceBlob}
            onNativeChange={setNativeVoiceBlob}
            existingEnglishUrl={existingEnglishUrl}
            existingNativeUrl={existingNativeUrl}
          />}
          {step === 4 && <PhotosStep back1={back1} back2={back2} front={front} onPhotosChange={(b1, b2, f) => { setBack1(b1); setBack2(b2); setFront(f) }} existingBack1Url={existingBack1Url} existingBack2Url={existingBack2Url} existingFrontUrl={existingFrontUrl} />}
          {step === 5 && <PersonalityStep data={{ favReels: draft.favReels, favYoutube: draft.favYoutube, favWebSeries: draft.favWebSeries, favTravel: draft.favTravel, favFoods: draft.favFoods, favAiTools: draft.favAiTools, hobby: draft.hobby }} onChange={change} />}
          {step === 6 && <HabitsStep data={{ habitSmoking: draft.habitSmoking, habitDrinking: draft.habitDrinking, habitDrugs: draft.habitDrugs, habitBetting: draft.habitBetting }} onChange={change} />}
          {step === 7 && <IdVerificationStep idCountry={draft.idCountry} idFile={idFile} onIdChange={(country, file) => { change('idCountry', country); setIdFile(file) }} />}
          </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              style={{ marginTop: '1rem', background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center' }}>
              {error}
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="ob-nav" style={{ flexDirection: 'column', gap: '0.85rem' }}>

          {/* Row 1 — Back (left) | Continue (right) */}
          <div style={{ display: 'flex', justifyContent: step > 0 ? 'space-between' : 'flex-end', width: '100%' }}>
            {step > 0 && (
              <motion.button onClick={() => { setDirection(-1); setStep(s => s - 1); setError('') }} disabled={saving} className="ob-btn-back"
                whileHover={{ y: -1, borderColor: 'rgba(13,31,60,0.45)' }} whileTap={{ scale: 0.97 }}>
                ← Back
              </motion.button>
            )}
            <motion.button onClick={handleNext} disabled={saving} className="ob-btn-next"
              whileHover={saving ? undefined : { y: -1, boxShadow: '0 0 22px rgba(201,168,76,0.45)' }}
              whileTap={saving ? undefined : { scale: 0.97 }}
              style={{ background: saving ? c.navyMid : c.navy, color: c.goldLight, cursor: saving ? 'default' : 'pointer' }}>
              {saving ? 'Saving…' : step === 6 ? (isEdit ? 'Save Changes ✓' : 'Complete Profile ✓') : 'Continue →'}
            </motion.button>
          </div>

          {/* Row 2 — Save | Save & Exit centred */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              title="Save your progress on this step without continuing"
              style={{ padding: '0.7rem 1.6rem', background: 'transparent', border: `1px solid rgba(13,31,60,0.22)`, color: c.navyMid, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: saving ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              💾 Save Progress
            </button>
            <button
              onClick={handleSaveAndExit}
              disabled={saving}
              style={{ padding: '0.7rem 1.6rem', background: 'transparent', border: '1px solid rgba(13,31,60,0.22)', color: '#2c4a6e', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: saving ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              Save &amp; Exit
            </button>
          </div>

          {/* Row 3 — auto-save status + note */}
          <div style={{ textAlign: 'center' }}>
            <AnimatePresence mode="wait">
            {autoSaveStatus === 'saving' && (
              <motion.p key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.sepia, margin: '0 0 0.3rem', letterSpacing: '0.06em' }}>↻ Auto-saving…</motion.p>
            )}
            {autoSaveStatus === 'saved' && (
              <motion.p key="saved"
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: '#16a34a', margin: '0 0 0.3rem', letterSpacing: '0.06em' }}>✓ Progress saved</motion.p>
            )}
            </AnimatePresence>
            <p style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: '#7a8a9a', lineHeight: 1.55 }}>
              Your progress is saved automatically as you type. Use <strong>Save Progress</strong> to save manually, or <strong>Save &amp; Exit</strong> to continue later — simply log back in to pick up exactly where you left off.
            </p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
        Your data is encrypted and private
      </p>
    </div>
  )
}
