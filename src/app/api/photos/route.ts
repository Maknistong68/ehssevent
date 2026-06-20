import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Photo storage not available in mock mode' },
    { status: 404 }
  )
}
