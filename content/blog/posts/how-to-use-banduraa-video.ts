import type { BlogPost } from '../types'

const post: BlogPost = {
  slug: 'how-to-use-banduraa-video',
  title: 'Watch: How to Use Banduraa',
  description:
    'A full walkthrough of Banduraa, from creating your profile to your first video meeting — in one video.',
  date: '2026-08-23',
  tag: 'Guide',
  readingMinutes: 2,
  body: [
    {
      type: 'p',
      text:
        'New to Banduraa and want to see it in action before you dive in? This short video walks through the whole journey — building your profile, browsing Discover, revealing a photo, and getting to a video meeting — so you know exactly what to expect at every step.',
    },
    {
      type: 'video',
      youtubeId: 's8Agp_Yw2iM',
      caption: 'How to use Banduraa — a complete walkthrough',
    },
    { type: 'h2', text: 'What the video covers' },
    {
      type: 'list',
      items: [
        'Creating your profile, including your voice introduction',
        'Setting who you are looking for and your preferences',
        'Browsing and liking profiles in Discover',
        'Revealing a face photo, and what happens when you do',
        'Getting from a mutual like to booking a video meeting',
      ],
    },
    {
      type: 'p',
      text:
        'If you would rather read a step-by-step breakdown, our other posts cover the details behind voice-first matching, profile verification, and meeting safely. Or just get started — your first month is free.',
    },
  ],
}

export default post
