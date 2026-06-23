'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Plus } from 'lucide-react'
import { createEvent } from '@/lib/actions/events'
import {
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_HAZARD_LABELS,
  EVENT_IMPACTED_PARTY_LABELS,
  type EventType,
} from '@/types/enums'
import { SITE_OPTIONS } from '@/lib/constants/events'
import type { AssignableUser } from '@/lib/queries/users'
import { displayName } from '@/lib/utils/people'
import Link from 'next/link'

const PII_HINT =
  'Avoid names, ID numbers, or health details — reference people by their account or role.'

interface CreateEventFormProps {
  users: AssignableUser[]
}

// Classifications offered in the dropdown for the variable types.
const CLASSIFICATION_OPTIONS: Array<keyof typeof EVENT_CLASSIFICATION_LABELS> =
  [
    'incident',
    'unsafe_act',
    'unsafe_condition',
    'non_conformance',
    'leadership_event',
  ]

const WITH_RESPONSE: EventType[] = [
  'near_miss',
  'incident',
  'hazard_identification',
]

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-secondary/30 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/60"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v)}
      />
      {label}
    </label>
  )
}

export function CreateEventForm({ users }: CreateEventFormProps) {
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')

  const [type, setType] = useState<EventType>('hazard_identification')
  const [classification, setClassification] = useState('')
  const [significantHazard, setSignificantHazard] = useState('')
  const [impactedParty, setImpactedParty] = useState('')
  const [site, setSite] = useState('')

  const [specificArea, setSpecificArea] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [immediateCorrectiveActions, setImmediateCorrectiveActions] =
    useState('')
  const [stopWorkDetails, setStopWorkDetails] = useState('')
  const [leadershipMemberId, setLeadershipMemberId] = useState('')
  const [attendeeIds, setAttendeeIds] = useState<string[]>([])
  const [impactOther, setImpactOther] = useState('')

  const [wasFire, setWasFire] = useState(false)
  const [wasInjury, setWasInjury] = useState(false)
  const [wasEnvironment, setWasEnvironment] = useState(false)
  const [wasSecurity, setWasSecurity] = useState(false)
  const [workRelated, setWorkRelated] = useState(true)
  const [repeatIncident, setRepeatIncident] = useState(false)
  const [stopWork, setStopWork] = useState(false)

  // Field visibility derived from the selected type.
  const isIncident = type === 'incident'
  const isLeadership = type === 'leadership_event'
  // Impact checkboxes are driven by the Classification selection: choosing
  // "Incident" reveals the same impact checkboxes as before.
  const showImpact = classification === 'incident'
  const showClassification = WITH_RESPONSE.includes(type)
  const showSignificantHazard = WITH_RESPONSE.includes(type)
  const showWorkRepeat = WITH_RESPONSE.includes(type)
  const showResponse = WITH_RESPONSE.includes(type)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createEvent({
      type,
      classification:
        showClassification && classification ? classification : undefined,
      significant_hazard:
        showSignificantHazard && significantHazard
          ? significantHazard
          : undefined,
      impacted_party: showImpact && impactedParty ? impactedParty : undefined,
      was_fire: showImpact ? wasFire : false,
      was_injury: showImpact ? wasInjury : false,
      was_environment_impacted: showImpact ? wasEnvironment : false,
      was_security: showImpact ? wasSecurity : false,
      impact_other: showImpact ? impactOther || undefined : undefined,
      work_related: showWorkRepeat ? workRelated : true,
      repeat_incident: showWorkRepeat ? repeatIncident : false,
      stop_work: showResponse ? stopWork : false,
      stop_work_details: showResponse
        ? stopWorkDetails || undefined
        : undefined,
      immediate_corrective_actions: showResponse
        ? immediateCorrectiveActions || undefined
        : undefined,
      leadership_member_id: isLeadership
        ? leadershipMemberId || undefined
        : undefined,
      attendee_ids: isLeadership ? attendeeIds : [],
      site: site || undefined,
      specific_area: specificArea || undefined,
      event_date: eventDate
        ? eventDate + (eventTime ? 'T' + eventTime : '')
        : undefined,
      event_description: eventDescription || undefined,
      photo_urls: photos,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result?.success) {
      setCreatedEventId(result.event_id ?? null)
      setCreated(true)
      setLoading(false)
    }
  }

  if (created) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading text-lg font-semibold tracking-tight">
              Event created.
            </h3>
            <p className="text-sm text-muted-foreground">
              Add a corrective action to track follow-up for this event.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={
                createdEventId
                  ? `/corrective-actions/new?event_id=${createdEventId}`
                  : '/corrective-actions/new'
              }
              className="flex-1 sm:flex-none"
            >
              <Button className="w-full" data-icon="inline-start">
                <Plus className="h-4 w-4" />
                Add Corrective Action
              </Button>
            </Link>
            <Link href="/events" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full">
                Back to Events
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Type */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Event Type
          </h3>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType((v ?? 'hazard_identification') as EventType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showClassification && (
            <div className="space-y-2">
              <Label>Classification</Label>
              <Select
                value={classification || null}
                onValueChange={(v) => setClassification(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  {CLASSIFICATION_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {EVENT_CLASSIFICATION_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showSignificantHazard && (
            <div className="space-y-2">
              <Label>
                Significant Hazard
                {isIncident || type === 'hazard_identification' ? ' *' : ''}
              </Label>
              <Select
                value={significantHazard || null}
                onValueChange={(v) => setSignificantHazard(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hazard" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_HAZARD_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Location
          </h3>

          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={site || null} onValueChange={(v) => setSite(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {SITE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specific_area">Specific Area</Label>
            <Input
              id="specific_area"
              value={specificArea}
              onChange={(e) => setSpecificArea(e.target.value)}
              placeholder="e.g. Hive Work Area"
            />
          </div>

        </CardContent>
      </Card>

      {/* Event Date */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Event Date
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event_date">Date</Label>
              <DatePicker
                id="event_date"
                value={eventDate}
                onChange={setEventDate}
                placeholder="Select event date"
                disableFuture
              />
            </div>
            <div className="space-y-2">
              <Label>Time (optional)</Label>
              <TimePicker value={eventTime} onChange={setEventTime} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact (shown when Classification = Incident) */}
      {showImpact && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Impact
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckboxRow
                id="was_fire"
                label="Was there a fire?"
                checked={wasFire}
                onChange={setWasFire}
              />
              <CheckboxRow
                id="was_injury"
                label="Injury or illness?"
                checked={wasInjury}
                onChange={setWasInjury}
              />
              <CheckboxRow
                id="was_environment"
                label="Environment impacted?"
                checked={wasEnvironment}
                onChange={setWasEnvironment}
              />
              <CheckboxRow
                id="was_security"
                label="Security impacted?"
                checked={wasSecurity}
                onChange={setWasSecurity}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact_other">Other impact (optional)</Label>
              <Input
                id="impact_other"
                value={impactOther}
                onChange={(e) => setImpactOther(e.target.value)}
                placeholder="Describe any other impact"
              />
            </div>

            <div className="space-y-2">
              <Label>Impacted Party</Label>
              <Select
                value={impactedParty || null}
                onValueChange={(v) => setImpactedParty(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_IMPACTED_PARTY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leadership (leadership only) */}
      {isLeadership && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Leadership
            </h3>
            <div className="space-y-2">
              <Label>Leadership Member</Label>
              <Select
                value={leadershipMemberId || null}
                onValueChange={(v) => setLeadershipMemberId(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {displayName(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Attendees</Label>
              <div className="space-y-2 rounded-xl border border-input bg-secondary/30 p-3">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active users available.
                  </p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      htmlFor={`attendee-${u.id}`}
                      className="flex cursor-pointer items-center gap-3 text-sm font-medium"
                    >
                      <Checkbox
                        id={`attendee-${u.id}`}
                        checked={attendeeIds.includes(u.id)}
                        onCheckedChange={(v) =>
                          setAttendeeIds((prev) =>
                            v
                              ? [...prev, u.id]
                              : prev.filter((id) => id !== u.id)
                          )
                        }
                      />
                      {displayName(u)}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">{PII_HINT}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Details
          </h3>

          <div className="space-y-2">
            <Label htmlFor="event_description">Event Description</Label>
            <Textarea
              id="event_description"
              rows={4}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Describe what was observed..."
            />
            <p className="text-xs text-muted-foreground">{PII_HINT}</p>
          </div>

          {showWorkRepeat && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckboxRow
                id="work_related"
                label="Work-related?"
                checked={workRelated}
                onChange={setWorkRelated}
              />
              <CheckboxRow
                id="repeat_incident"
                label="Repeat incident?"
                checked={repeatIncident}
                onChange={setRepeatIncident}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immediate Corrective Action + Stop Work */}
      {showResponse && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Immediate Corrective Action
            </h3>

            <div className="space-y-2">
              <Label htmlFor="immediate_corrective_actions">
                Immediate corrective action taken
              </Label>
              <Textarea
                id="immediate_corrective_actions"
                rows={3}
                value={immediateCorrectiveActions}
                onChange={(e) => setImmediateCorrectiveActions(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{PII_HINT}</p>
            </div>

            <CheckboxRow
              id="stop_work"
              label="Stop Work?"
              checked={stopWork}
              onChange={setStopWork}
            />

            {stopWork && (
              <div className="space-y-2">
                <Label htmlFor="stop_work_details">Stop Work Details</Label>
                <Textarea
                  id="stop_work_details"
                  rows={2}
                  value={stopWorkDetails}
                  onChange={(e) => setStopWorkDetails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{PII_HINT}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Attachments
          </h3>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            bucket="event-photos"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/events" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Event
        </Button>
      </div>
    </form>
  )
}
