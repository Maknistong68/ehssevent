import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import type { EventResponse } from '@/types/database'
import Image from 'next/image'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'

interface EventResponseTimelineProps {
  responses: EventResponse[]
}

export function EventResponseTimeline({
  responses,
}: EventResponseTimelineProps) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No responses yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {responses.map((response) => {
        const responder = response.responder as
          | { id: string; full_name?: string; email: string }
          | undefined
        const org = response.responder_organization as
          | { id: string; name: string }
          | undefined

        return (
          <Card
            key={response.id}
            className={
              response.is_closing ? 'border-green-200 bg-green-50/50' : ''
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {response.is_closing ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {responder?.full_name || responder?.email || 'Unknown'}
                    </p>
                    {org && (
                      <p className="text-xs text-muted-foreground">
                        {org.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {response.is_closing && (
                    <Badge className="bg-green-100 text-green-800">
                      Closing Response
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(response.created_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap">
                {response.response_text}
              </p>

              {response.photo_urls && response.photo_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {response.photo_urls.map((url, i) => (
                    <div
                      key={i}
                      className="relative h-16 w-16 rounded-md overflow-hidden border"
                    >
                      <Image
                        src={toSecurePhotoUrl(url)}
                        alt={`Response photo ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
