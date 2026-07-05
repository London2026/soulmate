'use client'

const c = {
  navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', rose: '#9e2a2b', cream: '#f4f1eb',
}

const OPTIONS = ['', 'Yes', 'No', 'Sometimes', 'Never'] as const

interface HabitsData {
  habitSmoking: string
  habitDrinking: string
  habitDrugs: string
  habitBetting: string
}

const FIELDS: { key: keyof HabitsData; label: string; description: string }[] = [
  {
    key: 'habitSmoking',
    label: 'Smoking',
    description: 'Do you smoke cigarettes, cigars, or any other tobacco or nicotine products?',
  },
  {
    key: 'habitDrinking',
    label: 'Drinking',
    description: 'Do you drink alcohol?',
  },
  {
    key: 'habitDrugs',
    label: 'Recreational Drugs',
    description: 'Do you use recreational drugs?',
  },
  {
    key: 'habitBetting',
    label: 'Gambling',
    description: 'Do you gamble or bet regularly?',
  },
]

export default function HabitsStep({
  data,
  onChange,
}: {
  data: HabitsData
  onChange: (key: string, value: string) => void
}) {
  return (
    <div>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.4rem' }}>
        Step 7 of 8
      </p>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.35rem' }}>
        Lifestyle &amp; Habits
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 1.75rem' }}>
        Being open and honest about your lifestyle helps ensure both you and your potential partner are on the same page from the very beginning.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {FIELDS.map(({ key, label, description }) => (
          <div key={key}>
            <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.navy, marginBottom: '0.3rem' }}>
              {label}
            </label>
            <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '0.95rem', color: c.sepia, margin: '0 0 0.5rem', lineHeight: 1.6 }}>
              {description}
            </p>
            <select
              value={data[key]}
              onChange={e => onChange(key, e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: `1px solid rgba(13,31,60,0.2)`, borderRadius: 4, fontFamily: 'Raleway, sans-serif', fontSize: '0.88rem', color: data[key] ? c.navy : c.sepia, background: '#fff', appearance: 'none', WebkitAppearance: 'none', outline: 'none', cursor: 'pointer' }}
            >
              {OPTIONS.map(opt => (
                <option key={opt} value={opt} disabled={opt === ''} hidden={opt === ''}>
                  {opt === '' ? 'Select an answer…' : opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: '1.75rem 0 0', lineHeight: 1.7 }}>
        All fields on this page are optional. You may skip any question you are not comfortable answering.
      </p>
    </div>
  )
}
