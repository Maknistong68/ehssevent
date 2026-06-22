'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CaCard } from '@/components/corrective-actions/ca-card'
import { EventResponseTimeline } from './event-response-timeline'
import { EventResponseForm } from './event-response-form'
import { Plus, Timer } from 'lucide-react'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'
import { DeadlineBadge } from './deadline-badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { Can } from '@/components/shared/role-gate'
import { useAuth } from '@/components/auth/auth-provider'
import { allowedEventTransitions } from '@/lib/auth/permissions'
import { ApprovalBadge } from './approval-badge'
import { format } from 'date-fns'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateEventApprovalLevel, closeoutEvent } from '@/lib/actions/events'
import {
  EVENT_APPROVAL_LABELS,
  EVENT_APPROVAL_SEQUENCE,
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_HAZARD_LABELS,
  EVENT_IMPACTED_PARTY_LABELS,
} from '@/types/enums'
import type { Event, CorrectiveAction, EventResponse } from '@/types/database'
import type { AssignableUser } from '@/lib/queries/users'
import { resolvePerson, displayName } from '@/lib/utils/people'

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No')
const fmt = (d: string | null) =>
  d ? format(new Date(d), 'dd MMM yyyy, h:mm a') : ''

export function EventDetail({
  event,
  correctiveActions = [],
  responses = [],
  users = [],
}: {
  event: Event
  correctiveActions?: CorrectiveAction[]
  responses?: EventResponse[]
  users?: AssignableUser[]
}) {
  const router = useRouter()
  const { effectiveProfile, isImpersonating } = useAuth()
  const [level, setLevel] = useState(event.approval_level)
  const [savingLevel, setSavingLevel] = useState(false)

  // Stages this user may move the event to, derived from the data model
  // (stage ownership) via the permission matrix. Impersonated sessions are
  // strictly read-only. The current level is always shown for context.
  const transitions = isImpersonating
    ? []
    : allowedEventTransitions(effectiveProfile?.role, level)
  const levelOptions = EVENT_APPROVAL_SEQUENCE.filter(
    (s) => s === level || transitions.includes(s)
  )
  const canChangeLevel = transitions.length > 0
  const [closeoutPhotos, setCloseoutPhotos] = useState<string[]>(
    event.closeout_photo_urls || []
  )
  const [closing, setClosing] = useState(false)

  const handleLevelChange = async (value: string | null) => {
    if (!value) return
    setLevel(value as typeof level)
    setSavingLevel(true)
    const res = await updateEventApprovalLevel({
      event_id: event.id,
      approval_level: value,
    })
    setSavingLevel(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Approval level updated')
      router.refresh()
    }
  }

  const handleCloseout = async () => {
    setClosing(true)
    const res = await closeoutEvent({
      event_id: event.id,
      closeout_photo_urls: closeoutPhotos,
    })
    setClosing(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Event closed out')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-wide text-muted-foreground">
            {event.reference_number}
          </p>
          <h1 className="mt-1 font-heading text-xl font-bold tracking-tight md:text-2xl">
            {event.event_description?.trim() ||
              EVENT_CLASSIFICATION_LABELS[event.classification]}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <ApprovalBadge level={event.approval_level} />
            <span className="text-xs text-muted-foreground">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
          </div>
        </div>
      </div>

      {canChangeLevel && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-sm font-semibold">Approval Process Level</Label>
              {savingLevel && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select value={level} onValueChange={handleLevelChange}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((v) => (
                  <SelectItem key={v} value={v} disabled={v === level}>
                    {EVENT_APPROVAL_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Field label="Type" value={EVENT_TYPE_LABELS[event.type]} />
          <Field
            label="Classification"
            value={EVENT_CLASSIFICATION_LABELS[event.classification]}
          />
          <Field
            label="Significant Hazard"
            value={
              event.significant_hazard
                ? EVENT_HAZARD_LABELS[event.significant_hazard]
                : undefined
            }
          />
          <Field
            label="Impacted Party"
            value={
              event.impacted_party
                ? EVENT_IMPACTED_PARTY_LABELS[event.impacted_party]
                : undefined
            }
          />
          <Field label="Other Impact" value={event.impact_other} />
          <Field label="Was there a fire?" value={yesNo(event.was_fire)} />
          <Field label="Injury or illness?" value={yesNo(event.was_injury)} />
          <Field
            label="Environment impacted?"
            value={yesNo(event.was_environment_impacted)}
          />
          <Field label="Security involved?" value={yesNo(event.was_security)} />
          <Field label="Work-related?" value={yesNo(event.work_related)} />
          <Field label="Repeat incident?" value={yesNo(event.repeat_incident)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Field label="Site" value={event.site} />
          <Field label="Contractor" value={event.contractor} />
          <Field label="Specific Area" value={event.specific_area} />
          <Field label="Project" value={event.project?.name} />
          <Field label="Latitude" value={event.latitude?.toString()} />
          <Field label="Longitude" value={event.longitude?.toString()} />
          <Field label="Event Date" value={fmt(event.event_date)} />
          <Field label="Reported Date" value={fmt(event.reported_date)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <Field label="Event Description" value={event.event_description} />
          <Field label="Conditions" value={event.conditions} />
          <Field
            label="Immediate Corrective Actions"
            value={event.immediate_corrective_actions}
          />
          <Field label="Stop Work?" value={yesNo(event.stop_work)} />
          <Field label="Stop Work Details" value={event.stop_work_details} />
          <Field
            label="Further Corrective Action Required?"
            value={yesNo(event.further_action_required)}
          />
          <Field
            label="Leadership Member"
            value={
              event.leadership_member_id
                ? resolvePerson(event.leadership_member_id, users)
                : undefined
            }
          />
          <Field
            label="Attendees"
            value={
              event.attendee_ids && event.attendee_ids.length > 0
                ? event.attendee_ids
                    .map((id) => resolvePerson(id, users))
                    .join(', ')
                : undefined
            }
          />
          <Field
            label="Notify attendees by email"
            value={yesNo(event.notify_attendees_by_email)}
          />
        </CardContent>
      </Card>

      {event.photo_urls.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <Label className="text-sm font-semibold">Attachments</Label>
            <div className="flex flex-wrap gap-3">
              {event.photo_urls.map((url, i) => (
                <div
                  key={i}
                  className="relative h-24 w-24 overflow-hidden rounded-md border"
                >
                  <Image
                    src={toSecurePhotoUrl(url)}
                    alt={`Attachment ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(event.contractor_reviewer_id ||
        event.reviewer_id ||
        event.contractor_investigator_id ||
        event.lead_investigator_id ||
        event.validator_id ||
        event.approver_id ||
        event.creator) && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
            <Field
              label="Contractor Reviewer"
              value={
                event.contractor_reviewer_id
                  ? resolvePerson(event.contractor_reviewer_id, users)
                  : undefined
              }
            />
            <Field
              label="Reviewer"
              value={
                event.reviewer_id
                  ? resolvePerson(event.reviewer_id, users)
                  : undefined
              }
            />
            <Field
              label="Contractor Investigator"
              value={
                event.contractor_investigator_id
                  ? resolvePerson(event.contractor_investigator_id, users)
                  : undefined
              }
            />
            <Field
              label="Lead Investigator"
              value={
                event.lead_investigator_id
                  ? resolvePerson(event.lead_investigator_id, users)
                  : undefined
              }
            />
            <Field
              label="Validator"
              value={
                event.validator_id
                  ? resolvePerson(event.validator_id, users)
                  : undefined
              }
            />
            <Field
              label="Approver"
              value={
                event.approver_id
                  ? resolvePerson(event.approver_id, users)
                  : undefined
              }
            />
            <Field
              label="Created By"
              value={event.creator ? displayName(event.creator) : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* GOSI Reporting Deadlines */}
      {(event.reporting_deadline_24h || event.reporting_deadline_3day) && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                GOSI Reporting Deadlines
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {event.reporting_deadline_24h && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    24-Hour Deadline (Labor Law)
                  </p>
                  <p className="text-sm">{fmt(event.reporting_deadline_24h)}</p>
                  {event.deadline_24h_met ? (
                    <p className="text-xs text-green-600">
                      Met {event.deadline_24h_met_at ? fmt(event.deadline_24h_met_at) : ''}
                    </p>
                  ) : (
                    <DeadlineBadge event={event} />
                  )}
                </div>
              )}
              {event.reporting_deadline_3day && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    3-Day Deadline (GOSI)
                  </p>
                  <p className="text-sm">{fmt(event.reporting_deadline_3day)}</p>
                  {event.deadline_3day_met ? (
                    <p className="text-xs text-green-600">
                      Met {event.deadline_3day_met_at ? fmt(event.deadline_3day_met_at) : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Pending</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Corrective Actions */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Corrective Actions
            </h3>
            <Link href={`/corrective-actions/new?event_id=${event.id}`}>
              <Button size="sm" variant="outline" data-icon="inline-start">
                <Plus className="h-4 w-4" />
                Raise Corrective Action
              </Button>
            </Link>
          </div>

          {correctiveActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No corrective actions raised for this event yet.
            </p>
          ) : (
            <div className="space-y-3">
              {correctiveActions.map((ca) => (
                <CaCard key={ca.id} correctiveAction={ca} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses */}
      <div className="space-y-4">
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          Responses
        </h3>
        <EventResponseTimeline responses={responses} />
        <EventResponseForm eventId={event.id} canClose />
      </div>

      {/* Closeout */}
      <Can permission="event:manage">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                Contractor Closeout
              </h3>
              {event.date_closure && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Closed {fmt(event.date_closure)}
                </span>
              )}
            </div>

            <PhotoUpload
              photos={closeoutPhotos}
              onPhotosChange={setCloseoutPhotos}
              bucket="event-photos"
            />

            <Button onClick={handleCloseout} disabled={closing}>
              {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {event.date_closure ? 'Update Closeout' : 'Close Out Event'}
            </Button>
          </CardContent>
        </Card>
      </Can>
    </div>
  )
}
