interface Props {
  data: { religion: string; motherTongue: string; education: string; occupation: string }
  onChange: (key: string, value: string) => void
}

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Other', 'Prefer not to say']
const EDUCATIONS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Other"]

export default function BackgroundStep({ data, onChange }: Props) {
  const input = "w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 appearance-none"
  const iStyle = { backgroundColor: 'var(--oxford-navy)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--ivory)' }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--antique-gold)')
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(201,168,76,0.25)')

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
        Your heritage
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ivory-dim)' }}>
        Background helps us find meaningful connections
      </p>
      <div
        className="mb-6 h-px"
        style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
      />

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Religion
          </label>
          <select
            value={data.religion}
            onChange={(e) => onChange('religion', e.target.value)}
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--oxford-navy)' }}>Select religion</option>
            {RELIGIONS.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: 'var(--oxford-navy)' }}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Mother Tongue
          </label>
          <input
            type="text"
            value={data.motherTongue}
            onChange={(e) => onChange('motherTongue', e.target.value)}
            placeholder="e.g. Gujarati, Tamil, Punjabi…"
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Education
          </label>
          <select
            value={data.education}
            onChange={(e) => onChange('education', e.target.value)}
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--oxford-navy)' }}>Select education level</option>
            {EDUCATIONS.map((e) => (
              <option key={e} value={e} style={{ backgroundColor: 'var(--oxford-navy)' }}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Occupation
          </label>
          <input
            type="text"
            value={data.occupation}
            onChange={(e) => onChange('occupation', e.target.value)}
            placeholder="e.g. Software Engineer, Doctor…"
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>
      </div>
    </div>
  )
}
