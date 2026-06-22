'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, Loader2, Send, CheckCircle2 } from 'lucide-react'
import { addEventResponse } from '@/lib/actions/events'

interface EventResponseFormProps {
  eventId: string
  canClose?: boolean
}

export function EventResponseForm({ eventId, canClose = false }: EventResponseFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [responseText, setResponseText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const router = useRouter()

  const handleSubmit = async (isClosing: boolean) => {
    if (!responseText.trim()) {
      setError('Response text is required')
      return
    }

    setError('')
    setLoading(true)

    const result = await addEventResponse({
      event_id: eventId,
      response_text: responseText,
      photo_urls: photos,
      is_closing: isClosing,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setResponseText('')
    setPhotos([])
    setLoading(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Add Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="response">Response</Label>
          <Textarea
            id="response"
            placeholder="Write your response..."
            rows={4}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Avoid names, ID numbers, or health details — reference people by their
            account or role.
          </p>
        </div>

        <PhotoUpload photos={photos} onPhotosChange={setPhotos} bucket="event-photos" />

        <div className="flex gap-2">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Response
          </Button>
          {canClose && (
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
