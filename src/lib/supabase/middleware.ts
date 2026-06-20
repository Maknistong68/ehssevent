import { NextResponse, type NextRequest } from 'next/server'

// Mock — no Supabase session handling, just pass through
export async function updateSession(_request: NextRequest) {
  return NextResponse.next()
}
