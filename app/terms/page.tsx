import type { Metadata } from 'next'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Terms & Conditions — Banduraa',
  description: 'The terms and conditions governing your use of the Banduraa matrimony platform.',
  alternates: { canonical: 'https://banduraa.com/terms' },
}

const c = {
  bg: '#07111f', navy: '#0d1f3c', gold: '#c9a84c',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', sepia: '#5a6e82',
  border: 'rgba(201,168,76,0.15)',
}

const h2 = { fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '2rem 0 0.75rem' } as const
const p  = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, margin: '0 0 0.9rem' } as const
const li = { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.8, marginBottom: '0.4rem' } as const

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: c.bg }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      <Navigation />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 1.5rem 5rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.5rem' }}>Legal</p>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>Terms of Service</h1>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia, margin: 0 }}>Last updated: July 2026</p>
          <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '1.25rem' }} />
        </div>

        <p style={p}>
          Welcome to Banduraa. These Terms of Service govern your use of our website and services. By creating an account or using Banduraa, you agree to be bound by these terms. Please read them carefully.
        </p>

        <h2 style={h2}>1. Eligibility</h2>
        <p style={p}>
          You must be at least 18 years old to use Banduraa. By registering, you confirm that you are 18 or older and that all information you provide is accurate, current, and complete. Banduraa is a matrimony platform intended for individuals seeking a long-term committed relationship or marriage.
        </p>

        <h2 style={h2}>2. Your Account</h2>
        <p style={p}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to:
        </p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Provide truthful and accurate profile information',
            'Upload only photos of yourself',
            'Not impersonate any other person',
            'Notify us immediately of any unauthorised use of your account',
            'Not share your account with any other person',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>

        <h2 style={h2}>3. Subscription & Payments</h2>
        <p style={p}>
          Banduraa offers a Free plan and paid subscription plans (Starter and Standard). Paid subscriptions are billed monthly. By subscribing to a paid plan, you authorise Banduraa to charge your payment method on a recurring monthly basis until you cancel.
        </p>
        <p style={p}>
          All payments are processed securely through our payment provider. Banduraa does not store your card details. Prices are displayed in USD and may be subject to currency conversion by your bank.
        </p>

        <h2 style={h2}>4. Cancellation & Account Deletion</h2>
        <p style={p}>
          You may cancel your subscription at any time through the Subscription page in your account settings. Upon cancellation, you will retain access to paid features until the end of your current billing period. No refunds are provided for partial months. Your account will revert to the Free plan at the end of the billing period.
        </p>
        <p style={p}>
          You may permanently delete your account at any time from your Profile settings. Deleting your account will immediately and irreversibly remove your profile, photos, voice recordings, meeting history, and all associated data from our systems. This action cannot be undone. Any active subscription will be cancelled at the point of deletion with no refund for any remaining period.
        </p>

        <h2 style={h2}>5. User Content</h2>
        <p style={p}>
          You retain ownership of the photos, voice recordings, and other content you upload to Banduraa. By uploading content, you grant Banduraa a limited licence to display that content to other members as part of the service. You must not upload content that is offensive, illegal, or that you do not have the right to share.
        </p>

        <h2 style={h2}>6. Privacy</h2>
        <p style={p}>
          Your privacy is important to us. Your face photo is never shown to other members unless you explicitly choose to reveal it. Voice recordings and back-side photos are visible to other members as part of the discovery experience.
        </p>
        <p style={p}>
          When another member reveals your face photo, you will be notified by email and can view a list of who has revealed your photo within the platform. The identity of members you have revealed remains private to you alone.
        </p>
        <p style={p}>
          Please review our <Link href="/privacy" style={{ color: c.gold, textDecoration: 'underline' }}>Privacy Policy</Link> for full details on how we collect and use your data.
        </p>

        <h2 style={h2}>7. Prohibited Conduct</h2>
        <p style={p}>You agree not to:</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0 0 0.9rem' }}>
          {[
            'Harass, abuse, or harm other members',
            'Send unsolicited messages or spam',
            'Create fake or misleading profiles',
            'Use the service for commercial purposes without our consent',
            'Attempt to extract personal contact details from other members outside the platform',
            'Use automated tools to access or scrape the service',
          ].map(item => <li key={item} style={li}>{item}</li>)}
        </ul>
        <p style={p}>
          Banduraa reserves the right to suspend or permanently ban any account found to be in violation of these terms.
        </p>

        <h2 style={h2}>8. Member Safety Tools</h2>
        <p style={p}>
          Banduraa provides built-in tools to help members manage their safety and comfort on the platform.
        </p>
        <p style={p}>
          <strong style={{ color: c.ivory }}>Blocking.</strong> You may block any member at any time from their profile page. When you block a member, they will no longer appear in your Discover feed, and your profile will no longer be visible to them. Blocking is immediate and bidirectional. Blocked members are not notified that they have been blocked. Blocking does not delete any existing meeting records or notifications.
        </p>
        <p style={p}>
          <strong style={{ color: c.ivory }}>Reporting.</strong> You may report any member whose behaviour or profile content you believe violates these Terms. Reports are reviewed by our moderation team. Where a report is substantiated, we may issue a warning, temporarily suspend, or permanently remove the reported member. Submitting a false or malicious report is itself a violation of these Terms.
        </p>
        <p style={p}>
          <strong style={{ color: c.ivory }}>Account suspension.</strong> Banduraa may suspend an account pending investigation of a report. Suspended members will be unable to access the Discover feed or contact other members until the investigation is resolved.
        </p>

        <h2 style={h2}>9. Meeting Feedback</h2>
        <p style={p}>
          Following a completed video meeting, both participating members may be invited to provide feedback on the experience through a star rating (1–5) and an optional written note. Submitting feedback is voluntary.
        </p>
        <p style={p}>
          Feedback responses are strictly private. They are never shared with the other member and are used solely by Banduraa to improve the quality of matches, identify patterns of inappropriate conduct, and enhance the overall platform experience. By submitting feedback, you grant Banduraa the right to use it for these internal purposes.
        </p>
        <p style={p}>
          If your feedback indicates a serious concern about another member's conduct, our moderation team may review it and take appropriate action under section 8 above.
        </p>

        <h2 style={h2}>10. Limitation of Liability</h2>
        <p style={p}>
          Banduraa is a platform that facilitates connections between individuals. We do not conduct background checks on members and are not responsible for the conduct of any member on or off the platform. You use the service at your own risk. Banduraa's total liability to you shall not exceed the amount you paid us in the three months prior to the claim.
        </p>

        <h2 style={h2}>11. Changes to These Terms</h2>
        <p style={p}>
          We may update these Terms of Service from time to time. We will notify you of significant changes by email or through a notice on the platform. Continued use of Banduraa after changes take effect constitutes your acceptance of the revised terms.
        </p>

        <h2 style={h2}>12. Governing Law</h2>
        <p style={p}>
          These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>

        <h2 style={h2}>13. Contact</h2>
        <p style={p}>
          If you have any questions about these Terms, please contact us at{' '}
          <a href="mailto:support@banduraa.com" style={{ color: c.gold }}>support@banduraa.com</a>.
        </p>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'none', letterSpacing: '0.06em' }}>Privacy Policy →</Link>
          <Link href="/" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, textDecoration: 'none', letterSpacing: '0.06em' }}>← Back to Home</Link>
        </div>

        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, lineHeight: 1.7, marginTop: '1.5rem' }}>
          banduraa.com is owned and operated by Oxyn AI Ltd, Company Registration Number: 17134431, Registered office: Brentford London.
        </p>

      </main>
    </div>
  )
}
