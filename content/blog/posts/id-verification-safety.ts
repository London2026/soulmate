import type { BlogPost } from '../types'

const post: BlogPost = {
  slug: 'how-we-verify-every-profile',
  title: 'How We Verify Every Profile on Banduraa',
  description:
    'No profile reaches Discover without an ID check and a manual review first. Here is exactly how verification works, and what to do if something feels off.',
  date: '2026-07-14',
  tag: 'Safety',
  readingMinutes: 3,
  body: [
    {
      type: 'p',
      text:
        'Almost everyone who has used a dating or matrimony app has matched with a profile that turned out to be fake, stolen, or badly misrepresented. It is common enough that it barely surprises anyone anymore — which is exactly the problem.',
    },
    {
      type: 'p',
      text:
        'Banduraa was built to make that the exception, not something you have to plan around. Verification is not an optional badge you can skip. It is a requirement to appear on the platform at all.',
    },
    { type: 'h2', text: 'What happens before a profile goes live' },
    {
      type: 'list',
      items: [
        'Every member uploads a government ID during onboarding, before their profile can be discovered by others',
        'Our team reviews each submission — this is a manual check, not just an automated pass',
        'Only approved, verified profiles ever appear in the Discover feed',
      ],
    },
    {
      type: 'p',
      text:
        'This is also why voice introductions and photo uploads matter so much on Banduraa — they are one more layer of evidence that the person on the other side of a match is who they say they are.',
    },
    { type: 'h2', text: 'What you can do if something still feels off' },
    {
      type: 'p',
      text:
        'Verification reduces bad actors dramatically, but we do not ask you to simply trust the system and stop paying attention. If a conversation, a profile, or a meeting ever feels wrong, you have direct control in the moment:',
    },
    {
      type: 'list',
      items: [
        'Report a profile directly from Discover, with a reason and a message to our team',
        'Block a profile instantly — they will not be able to see or contact you again',
        'Our admin team reviews every report and can suspend an account when needed',
      ],
    },
    { type: 'h2', text: 'Your own privacy stays protected too' },
    {
      type: 'p',
      text:
        'Verification is a two-way street. While we confirm who you are, we also make sure your own contact details — phone number and email — are never shared with a match. Everything happens inside the app: liking, mutual matching, and video meetings, without ever handing out personal contact information.',
    },
    {
      type: 'quote',
      text: 'Verified people. Real intentions. That is the whole idea.',
    },
  ],
}

export default post
