const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.5rem' }
const inp = { width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1.05rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.4rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const RELIGIONS         = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Other', 'Prefer not to say']
const EDUCATIONS        = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Other"]
const EMPLOYMENT_STATUS = ['Working Full Time', 'Working Part Time', 'Looking for a Job', 'Student']
const MARITAL_STATUS    = ['Single', 'Married', 'Separated', 'Widowed']
const KIDS_OPTIONS      = ['Have children', 'No children', 'Not applicable']
const HOUSING_OPTIONS   = ['Own House', 'Rented Property', 'Family Home', 'Council House', 'Flat / Apartment']

interface Props {
  data: {
    religion: string; subReligion: string; motherTongue: string
    education: string; university: string; educationSubject: string; otherQualifications: string
    employmentStatus: string; occupation: string; housing: string
    maritalStatus: string; hasKids: string
  }
  onChange: (key: string, value: string) => void
}

export default function BackgroundStep({ data, onChange }: Props) {
  return (
    <div>
      <style>{`.ob-bg-2col{display:grid;grid-template-columns:1fr 1fr;gap:1rem} @media(max-width:480px){.ob-bg-2col{grid-template-columns:1fr}}`}</style>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your heritage
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Background helps us find meaningful connections
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* Religion */}
      <div style={field}>
        <label style={label}>Religion</label>
        <select value={data.religion} onChange={e => onChange('religion', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select religion</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Sub-Religion */}
      <div style={field}>
        <label style={label}>Sub-Religion <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.78rem', color: c.sepia }}>(Optional)</span></label>
        <input type="text" value={data.subReligion} onChange={e => onChange('subReligion', e.target.value)}
          placeholder="e.g. Sunni, Shia, Catholic, Protestant, Vaishnavite…" style={inp} onFocus={focus} onBlur={blur} />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.88rem', color: c.sepia, margin: '0.3rem 0 0' }}>
          Specify your denomination or sect if relevant to your match preferences.
        </p>
      </div>

      {/* Mother Tongue */}
      <div style={field}>
        <label style={label}>Mother Tongue</label>
        <input type="text" value={data.motherTongue} onChange={e => onChange('motherTongue', e.target.value)}
          placeholder="e.g. English, Spanish, German…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Education */}
      <div style={field}>
        <label style={label}>Highest Level of Education</label>
        <select value={data.education} onChange={e => onChange('education', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select education level</option>
          {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* University */}
      <div style={field}>
        <label style={label}>University / College <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.78rem', color: c.sepia }}>(Optional)</span></label>
        <input type="text" value={data.university} onChange={e => onChange('university', e.target.value)}
          placeholder="e.g. University of Oxford, Harvard University…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Subject */}
      <div style={field}>
        <label style={label}>Subject / Field of Study</label>
        <input type="text" value={data.educationSubject} onChange={e => onChange('educationSubject', e.target.value)}
          placeholder="e.g. Computer Science, Medicine, Law…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Other Qualifications */}
      <div style={field}>
        <label style={label}>Additional Qualifications <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.78rem', color: c.sepia }}>(Optional)</span></label>
        <input type="text" value={data.otherQualifications} onChange={e => onChange('otherQualifications', e.target.value)}
          placeholder="e.g. MBA, ACCA, PhD, PMP Certification, Bar Exam…" style={inp} onFocus={focus} onBlur={blur} />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.88rem', color: c.sepia, margin: '0.3rem 0 0' }}>
          List any further degrees, professional certificates, or postgraduate qualifications.
        </p>
      </div>

      {/* Employment Status */}
      <div style={field}>
        <label style={label}>Employment Status</label>
        <select value={data.employmentStatus} onChange={e => onChange('employmentStatus', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select status</option>
          {EMPLOYMENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Occupation */}
      <div style={field}>
        <label style={label}>Occupation</label>
        <input type="text" value={data.occupation} onChange={e => onChange('occupation', e.target.value)}
          placeholder="e.g. Software Engineer, Doctor, Teacher…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Housing */}
      <div style={field}>
        <label style={label}>Housing Situation <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.78rem', color: c.sepia }}>(Optional)</span></label>
        <select value={data.housing} onChange={e => onChange('housing', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select housing situation</option>
          {HOUSING_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      {/* Marital Status + Children */}
      <div className="ob-bg-2col">
        <div style={field}>
          <label style={label}>Marital Status</label>
          <select value={data.maritalStatus} onChange={e => onChange('maritalStatus', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select status</option>
            {MARITAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={field}>
          <label style={label}>Children</label>
          <select value={data.hasKids} onChange={e => onChange('hasKids', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select option</option>
            {KIDS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
