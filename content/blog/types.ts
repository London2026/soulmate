export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'video'; youtubeId: string; caption?: string }

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string // 'YYYY-MM-DD'
  tag: string
  readingMinutes: number
  body: BlogBlock[]
}
