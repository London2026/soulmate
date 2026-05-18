import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, age, gender, city, country, religion, mother_tongue, education, occupation, pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion')
    .eq('id', user.id)
    .single()

  if (!me) return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 })

  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, full_name, age, gender, city, country, religion, mother_tongue, education, occupation, pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion')
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(20)

  if (!candidates?.length) return NextResponse.json({ matches: [] })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are an expert matrimony matchmaker. Score compatibility between the user and each candidate from 0-100.

USER PROFILE:
Name: ${me.full_name} | Age: ${me.age} | Gender: ${me.gender}
Location: ${me.city}, ${me.country}
Religion: ${me.religion} | Mother Tongue: ${me.mother_tongue}
Education: ${me.education} | Occupation: ${me.occupation}
Looking for: A ${me.pref_gender}, aged ${me.pref_age_min}–${me.pref_age_max}
Religion preference: ${me.pref_religion} | Location preference: ${me.pref_location || 'Any'}

CANDIDATES:
${candidates.map((p, i) => `${i + 1}. ID:${p.id.slice(0, 8)} | ${p.full_name}
   ${p.age}yo ${p.gender} | ${p.city}, ${p.country} | ${p.religion}
   ${p.education} | ${p.occupation} | Seeks: ${p.pref_gender} aged ${p.pref_age_min}–${p.pref_age_max}`).join('\n')}

Score each candidate 0–100 based on: religion compatibility, age within preference range, location match, education/occupation compatibility, and mutual preference alignment.

Return ONLY this JSON (no markdown, no explanation outside JSON):
{"matches":[{"id":"first8charsOfId","score":85,"reasons":["reason1","reason2","reason3"]}]}

Include all ${candidates.length} candidates, sorted by score descending.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const result = JSON.parse(text)

  // Enrich with full profile data
  const enriched = result.matches.map((m: { id: string; score: number; reasons: string[] }) => {
    const profile = candidates.find(c => c.id.startsWith(m.id) || c.id.slice(0, 8) === m.id)
    return { ...m, profile }
  }).filter((m: { profile: unknown }) => m.profile)

  return NextResponse.json({ matches: enriched })
}
