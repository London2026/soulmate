import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Payments are not yet configured. Please check back soon.' },
    { status: 503 }
  )
}
