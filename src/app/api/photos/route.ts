import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    name: 'photos',
    limit: 60,
    windowMs: 60_000,
  })
  if (limited) return limited

  return NextResponse.json(
    { error: 'Photo storage not available in mock mode' },
    { status: 404 }
  )
}
