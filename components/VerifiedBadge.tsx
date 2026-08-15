// Blue verified checkmark shown once an admin approves a member's uploaded ID —
// intentionally matches the familiar "verified account" convention (X, Instagram,
// WhatsApp Business) so it reads as trustworthy at a glance in the Discover grid.
export default function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="ID Verified" style={{ flexShrink: 0 }}>
      <title>ID Verified</title>
      <path
        d="M12 1.5l2.55 1.9 3.17-.5 1.35 2.9 2.9 1.35-.5 3.17L23.5 12l-2.03 2.6.5 3.17-2.9 1.35-1.35 2.9-3.17-.5L12 23.5l-2.55-1.9-3.17.5-1.35-2.9-2.9-1.35.5-3.17L.5 12l2.03-2.6-.5-3.17 2.9-1.35 1.35-2.9 3.17.5L12 1.5z"
        fill="#1d9bf0"
      />
      <path d="M7.5 12.4l2.8 2.8 6-6.6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}
