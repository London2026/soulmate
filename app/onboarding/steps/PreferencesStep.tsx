interface Props {
  data: { prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string }
  onChange: (key: string, value: string) => void
}

const GENDERS   = ['Man', 'Woman', 'Either']
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Any']

export default function PreferencesStep({ data, onChange }: Props) {
  const input = "w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 appearance-none"
  const iStyle = { backgroundColor: 'var(--oxford-navy)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--ivory)' }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--antique-gold)')
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(201,168,76,0.25)')

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
        Who are you looking for?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ivory-dim)' }}>
        Set your partner preferences
      </p>
      <div
        className="mb-6 h-px"
        style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
      />

      <div className="space-y-5">
        {/* Gender preference */}
        <div>
          <label className="block text-xs font-medium mb-3 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Looking for a
          </label>
          <div className="grid grid-cols-3 gap-3">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange('prefGender', g)}
                className="py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  data.prefGender === g
                    ? { backgroundColor: 'rgba(201,168,76,0.15)', border: '1px solid var(--antique-gold)', color: 'var(--antique-gold)' }
                    : { backgroundColor: 'var(--oxford-navy)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--ivory-dim)' }
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Age range */}
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Age Range
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={18}
              max={99}
              value={data.prefAgeMin}
              onChange={(e) => onChange('prefAgeMin', e.target.value)}
              className={`${input} text-center`}
              style={iStyle}
              onFocus={focus}
              onBlur={blur}
            />
            <span style={{ color: 'var(--ivory-dim)', flexShrink: 0 }}>to</span>
            <input
              type="number"
              min={18}
              max={100}
              value={data.prefAgeMax}
              onChange={(e) => onChange('prefAgeMax', e.target.value)}
              className={`${input} text-center`}
              style={iStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>

        {/* Location preference */}
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Preferred Location
          </label>
          <input
            type="text"
            value={data.prefLocation}
            onChange={(e) => onChange('prefLocation', e.target.value)}
            placeholder="e.g. London, UK or Any"
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        {/* Religion preference */}
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Religion Preference
          </label>
          <select
            value={data.prefReligion}
            onChange={(e) => onChange('prefReligion', e.target.value)}
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          >
            <option value="" disabled style={{ backgroundColor: 'var(--oxford-navy)' }}>Select preference</option>
            {RELIGIONS.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: 'var(--oxford-navy)' }}>{r}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
