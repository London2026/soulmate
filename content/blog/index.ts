import type { BlogPost } from './types'
import voiceFirstMatching from './posts/voice-first-matching'
import idVerificationSafety from './posts/id-verification-safety'
import safeVideoMeetingTips from './posts/safe-video-meeting-tips'
import howToUseBanduraaVideo from './posts/how-to-use-banduraa-video'

const allPosts: BlogPost[] = [
  voiceFirstMatching,
  idVerificationSafety,
  safeVideoMeetingTips,
  howToUseBanduraaVideo,
]

export function getAllPosts(): BlogPost[] {
  return [...allPosts].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find(post => post.slug === slug)
}

export type { BlogPost, BlogBlock } from './types'
