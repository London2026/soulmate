'use client'

import { useState } from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e', ivory: '#f5f0e6', border: 'rgba(13,31,60,0.18)' }

const CATEGORIES = [
  { key: 'favReels',      icon: '🎬', label: 'Favourite Reels',        placeholder: 'e.g. Travel vlogs, Comedy skits, Tech reviews' },
  { key: 'favYoutube',    icon: '▶️', label: 'YouTube Channels',        placeholder: 'e.g. Veritasium, Kurzgesagt, MrBeast' },
  { key: 'favWebSeries',  icon: '📺', label: 'Web Series',              placeholder: 'e.g. Succession, Black Mirror, The Crown' },
  { key: 'favTravel',     icon: '✈️', label: 'Travel Destinations',     placeholder: 'e.g. Japan, Iceland, New Zealand' },
  { key: 'favFoods',      icon: '🍽️', label: 'Favourite Foods',         placeholder: 'e.g. Sushi, Pasta, Tacos' },
  { key: 'favAiTools',    icon: '🤖', label: 'Favourite AI Tools',      placeholder: 'e.g. Claude, Midjourney, Notion AI' },
]

type PersonalityData = { favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string }

interface Props {
  data: PersonalityData
  onChange: (key: string, value: string) => void
}

export default function PersonalityStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', fontWeight: 600, color: c.navy, margin: '0 0 0.25rem' }}>
        Your personality
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 0.25rem' }}>
        Helps others understand your lifestyle &amp; mindset
      </p>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.gold, letterSpacing: '0.1em', margin: '0 0 1rem' }}>
        ADD UP TO 3 ITEMS PER CATEGORY — press Enter or comma to add
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {CATEGORIES.map(cat => (
          <ChipField
            key={cat.key}
            icon={cat.icon}
            label={cat.label}
            placeholder={cat.placeholder}
            value={data[cat.key as keyof PersonalityData] || ''}
            onChange={v => onChange(cat.key, v)}
          />
        ))}
      </div>
    </div>
  )
}

function ChipField({ icon, label, placeholder, value, onChange }: {
  icon: string; label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const [input, setInput] = useState('')
  const chips = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  function addChip() {
    const trimmed = input.trim()
    if (!trimmed || chips.length >= 3) return
    const next = [...chips, trimmed].join(', ')
    onChange(next)
    setInput('')
  }

  function removeChip(i: number) {
    const next = chips.filter((_, idx) => idx !== i).join(', ')
    onChange(next)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip() }
  }

  return (
    <div style={{ background: 'rgba(244,241,235,0.3)', border: `1px solid ${c.border}`, borderRadius: '6px', padding: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.textMid }}>
          {label}
        </label>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: chips.length >= 3 ? c.gold : c.sepia, marginLeft: 'auto' }}>
          {chips.length}/3
        </span>
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.4rem' }}>
          {chips.map((chip, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', background: 'rgba(139,105,20,0.1)', border: '1px solid rgba(139,105,20,0.3)', borderRadius: '20px', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.navy }}>
              {chip}
              <button type="button" onClick={() => removeChip(i)} style={{ background: 'none', border: 'none', color: c.sepia, cursor: 'pointer', padding: 0, fontSize: '0.75rem', lineHeight: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {chips.length < 3 && (
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={chips.length === 0 ? placeholder : 'Add another…'}
            style={{ flex: 1, padding: '0.4rem 0.6rem', border: `1px solid ${c.border}`, background: 'rgba(244,241,235,0.6)', color: c.navy, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', fontStyle: 'italic', borderRadius: '4px', outline: 'none', minWidth: 0 }}
            onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
          <button type="button" onClick={addChip} disabled={!input.trim()}
            style={{ padding: '0.4rem 0.7rem', background: input.trim() ? c.navy : 'rgba(13,31,60,0.2)', color: '#f5f0e6', border: 'none', borderRadius: '4px', cursor: input.trim() ? 'pointer' : 'default', fontSize: '0.85rem', fontWeight: 600 }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}
