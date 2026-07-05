import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Privacy Policy — Banduraa',
  description: 'How Banduraa collects, uses, and protects your personal data. Your privacy is our priority.',
  alternates: { canonical: 'https://banduraa.com/privacy' },
}

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', sepia: '#5a6e82',
  border: 'rgba(201,168,76,0.15)',
}

const h2 = { fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.75rem' } as const
const p  = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, margin: '0 0 0.9rem' } as const
const li = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, marginBottom: '0.4rem' } as const

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <Navigation />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 1.5rem 5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>Privacy Policy</h1>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia, margin: 0 }}>Last updated: July 2026</p>
          <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '1.25rem' }} />
        </div>

        <p style={p}>
          Banduraa is committed to protecting your privacy. This Privacy Policy explains what personal data we collect, how we use it, and your rights under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
        </p>

        <h2 style={h2}>1. Who We Are</h2>
        <p style={p}>
          Banduraa is a privacy-first matrimony platform based in the United Kingdom. For any privacy-related enquiries, please contact us at{' '}
          <a href="mailto:support@banduraa.com" style={{ color: c.gold }}>support@banduraa.com</a>.
        </p>

        <h2 style={h2}>2. Data We Collect</h2>
        <p style={p}>When you create a Banduraa account we collect:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Email address (for account creation and communication)',
            'First name and last name',
            'Age, gender, city, country',
            'Religion, mother tongue, education, occupation',
            'Partner preferences (used to personalise the order of profiles shown to you)',
            'Back-side photos (visible to other members)',
            'Face/reveal photo (hidden until you choose to reveal)',
            'Voice introduction recording',
            'Personality and interest information',
            'Subscription and billing information (processed by our payment provider)',
            'Photo reveal history (records of which members have revealed your photo)',
            'Meeting feedback (voluntary star rating and optional note submitted after a video meeting)',
            'Block records (when you block another member)',
            'Email communication preferences (whether you have opted out of non-essential emails)',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>3. How We Use Your Data</h2>
        <p style={p}>We use your personal data to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Provide the Banduraa matchmaking service',
            'Display your profile to other members',
            'Facilitate photo reveals and video meeting requests',
            'Order your Discover feed based on compatibility with your stated partner preferences',
            'Show you a list of members who have revealed your photo (visible only to you)',
            'Process subscription payments and manage your subscription plan',
            'Send you service notifications including meeting requests, mutual shortlists, and account alerts',
            'Send you optional engagement emails such as weekly activity digests and post-meeting feedback requests (you may opt out at any time)',
            'Use anonymised meeting feedback to improve matchmaking quality and identify patterns of inappropriate conduct',
            'Enforce block relationships to prevent unwanted contact between members',
            'Improve and personalise your experience using AI matching',
            'Comply with our legal obligations',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          We do not sell your personal data to third parties. We do not use your data for advertising purposes.
        </p>

        <h2 style={h2}>4. Your Face Photo & Reveal History</h2>
        <p style={p}>
          Your face (reveal) photo is stored securely and is <strong style={{ color: c.ivory }}>never visible</strong> to other members by default. It is only revealed when you actively choose to reveal it on another member's profile. This is central to how Banduraa works — personality and voice come before appearance.
        </p>
        <p style={p}>
          When a member reveals your photo, this event is recorded and you are notified by email. You can also view the full list of members who have revealed your photo in the "Reveals" panel within Discover. This information is visible only to you — the photo owner. The list of members whose photos you have revealed is private to you alone and is not shared with anyone else.
        </p>

        <h2 style={h2}>5. Third-Party Services</h2>
        <p style={p}>We use the following trusted third-party services:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Supabase — secure database and file storage (EU/US servers)',
            'Payment provider — secure payment processing (PCI-DSS compliant, no card data stored by us)',
            'Vercel — website hosting',
            'Anthropic Claude — AI-powered compatibility matching (no data retained)',
            'Jitsi Meet — video calls (end-to-end encrypted, no data stored)',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>6. Data Retention</h2>
        <p style={p}>
          We retain your account data for as long as your account is active. You may delete your account at any time from your Profile settings. Upon deletion, your profile, photos, voice recordings, reveal history, meeting feedback, block records, shortlists, and notifications are removed immediately and permanently. Payment records may be retained for up to 7 years as required by financial regulations.
        </p>

        <h2 style={h2}>7. Your Rights (UK GDPR)</h2>
        <p style={p}>Under UK data protection law, you have the right to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Access the personal data we hold about you',
            'Correct any inaccurate data',
            'Request deletion of your data ("right to be forgotten")',
            'Object to or restrict how we process your data',
            'Data portability — receive your data in a portable format',
            'Withdraw consent at any time',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          To exercise any of these rights, please email us at{' '}
          <a href="mailto:support@banduraa.com" style={{ color: c.gold }}>support@banduraa.com</a>.
          We will respond within 30 days.
        </p>

        <h2 style={h2}>8. Email Communications</h2>
        <p style={p}>
          We send two categories of email:
        </p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Transactional emails — account verification, meeting requests, mutual shortlist alerts, photo reveal notifications, and other service-critical messages. These cannot be opted out of as they are necessary to operate the service.',
            'Engagement emails — weekly activity digests and post-meeting feedback requests. These are optional. You may unsubscribe at any time by clicking the unsubscribe link in any such email. Your opt-out preference is stored and respected immediately.',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          We use Resend to deliver emails. Your email address is shared with Resend solely for the purpose of message delivery. Resend does not use it for any other purpose.
        </p>

        <h2 style={h2}>9. Blocking & Safety Data</h2>
        <p style={p}>
          When you block a member, a record is created that prevents your profile from appearing in their Discover feed and theirs from appearing in yours. Blocked members are not informed that they have been blocked. Block records are stored for as long as your account is active and are permanently deleted when you delete your account.
        </p>
        <p style={p}>
          When you report a member, the report — including your identity as the reporter, the reason, and any message — is shared with Banduraa's moderation team for review. Reports are not shared with the reported member. We retain report records to identify repeated patterns of conduct, even if a reported account is later deleted.
        </p>
        <p style={p}>
          Meeting feedback (star rating and optional note) is stored privately against your account. It is never disclosed to the member you are rating and is accessible only by Banduraa's internal team for the purposes described in section 3.
        </p>

        <h2 style={h2}>10. Cookies</h2>
        <p style={p}>
          Banduraa uses only essential cookies required for authentication and security. We do not use advertising or tracking cookies.
        </p>

        <h2 style={h2}>11. Security</h2>
        <p style={p}>
          All data is transmitted over HTTPS. Photos and voice recordings are stored in a private, access-controlled storage system. Signed URLs are generated on demand and expire within 1 hour. We take reasonable technical and organisational measures to protect your data against unauthorised access.
        </p>

        <h2 style={h2}>12. Changes to This Policy</h2>
        <p style={p}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes by email. The date at the top of this page reflects when the policy was last updated.
        </p>

        <h2 style={h2}>13. Complaints</h2>
        <p style={p}>
          If you are not satisfied with how we handle your data, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: c.gold }}>ico.org.uk</a>.
        </p>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'none', letterSpacing: '0.06em' }}>Terms of Service →</Link>
          <Link href="/" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, textDecoration: 'none', letterSpacing: '0.06em' }}>← Back to Home</Link>
        </div>

        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, lineHeight: 1.7, marginTop: '1.5rem' }}>
          banduraa.com is owned and operated by Oxyn AI Ltd, Company Registration Number: 17134431, Registered office: Brentford London.
        </p>

      </main>
    </div>
  )
}
