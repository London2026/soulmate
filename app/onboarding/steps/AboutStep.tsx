interface Props {
  data: { fullName: string; age: string; gender: string; city: string; country: string }
  onChange: (key: string, value: string) => void
}

const GENDERS = ['Man', 'Woman', 'Other']

export default function AboutStep({ data, onChange }: Props) {
  const input = "w-full px-4 py-3 rounded-lg text-sm outline-none transition-all duration-200"
  const iStyle = { backgroundColor: 'var(--oxford-navy)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--ivory)' }
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--antique-gold)')
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(201,168,76,0.25)')

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
        Tell us about yourself
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ivory-dim)' }}>
        Help us find your perfect match
      </p>
      <div
        className="mb-6 h-px"
        style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
      />

      <div className="space-y-5">
        {/* Name – readonly */}
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Full Name
          </label>
          <input
            type="text"
            value={data.fullName}
            readOnly
            className={`${input} opacity-60 cursor-not-allowed`}
            style={iStyle}
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            Age
          </label>
          <input
            type="number"
            min={18}
            max={100}
            value={data.age}
            onChange={(e) => onChange('age', e.target.value)}
            placeholder="Your age"
            className={input}
            style={iStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-medium mb-3 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
            I am a
          </label>
          <div className="grid grid-cols-3 gap-3">
            {GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange('gender', g)}
                className="py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={
                  data.gender === g
                    ? { backgroundColor: 'rgba(201,168,76,0.15)', border: '1px solid var(--antique-gold)', color: 'var(--antique-gold)' }
                    : { backgroundColor: 'var(--oxford-navy)', border: '1px solid rgba(201,168,76,0.2)', color: 'var(--ivory-dim)' }
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* City + Country */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
              City
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="London"
              className={input}
              style={iStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wider uppercase" style={{ color: 'var(--ivory-dim)' }}>
              Country
            </label>
            <input
              type="text"
              value={data.country}
              onChange={(e) => onChange('country', e.target.value)}
              placeholder="United Kingdom"
              className={input}
              style={iStyle}
              onFocus={focus}
              onBlur={blur}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
