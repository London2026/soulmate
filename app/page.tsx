import { redirect } from 'next/navigation'

// Serve the existing index.html landing page at /
export default function Home() {
  redirect('/index.html')
}
