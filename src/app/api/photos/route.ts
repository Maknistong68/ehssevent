import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_BUCKETS = ['event-photos', 'observation-photos', 'inspection-photos']

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Validate authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const bucket = searchParams.get('bucket')
  const path = searchParams.get('path')

  if (!bucket || !path) {
    return NextResponse.json(
      { error: 'Missing bucket or path parameter' },
      { status: 400 }
    )
  }

  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error || !data) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }

  const contentType = data.type || 'image/jpeg'

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
