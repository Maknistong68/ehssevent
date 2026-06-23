'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { updateEvent } from '@/lib/actions/events'
import {
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_HAZARD_LABELS,
  EVENT_IMPACTED_PARTY_LABELS,
  type EventType,
} from '@/types/enums'
import { SITE_OPTIONS } from '@/lib/constants/events'
import type { Event } from '@/types/database'
import type { AssignableUser } from '@/lib/queries/users'
import { displayName } from '@/lib/utils/people'
import Link from 'next/link'

const PII_HINT =
  'Avoid names, ID numbers, or health details — reference people by their account or role.'

interface EditEventFormProps {
  event: Event
  users: AssignableUser[]
}

const CLASSIFICATION_OPTIONS: Array<keyof typeof EVENT_CLASSIFICATION_LABELS> =
  [
    'safety',
    'fire',
    'environment',
    'welfare',
    'unsafe_act',
    'unsafe_condition',
    'non_conformance',
    'to_be_determined',
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

function splitDate(value: string | null): { date: string; time: string } {
  if (!value) return { date: '', time: '' }
  const [datePart, timePart] = value.split('T')
  return {
    date: datePart ?? '',
    time: timePart ? timePart.slice(0, 5) : '',
  }
}

export function EditEventForm({ event, users }: EditEventFormProps) {
  const router = useRouter()
  const initialDate = splitDate(event.event_date)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>(event.photo_urls ?? [])
  const [eventDate, setEventDate] = useState(initialDate.date)
  const [eventTime, setEventTime] = useState(initialDate.time)
  const [reason, setReason] = useState('')

  const type = event.type
  const [classification, setClassification] = useState<string>(
    event.classification ?? ''
  )
  const [significantHazard, setSignificantHazard] = useState<string>(
    event.significant_hazard ?? ''
  )
  const [impactedParty, setImpactedParty] = useState(event.impacted_party ?? '')
  const [site, setSite] = useState(event.site ?? '')

  const [specificArea, setSpecificArea] = useState(event.specific_area ?? '')
  const [eventDescription, setEventDescription] = useState(
    event.event_description ?? ''
  )
  const [immediateCorrectiveActions, setImmediateCorrectiveActions] = useState(
    event.immediate_corrective_actions ?? ''
  )
  const [stopWorkDetails, setStopWorkDetails] = useState(
    event.stop_work_details ?? ''
  )
  const [leadershipMemberId, setLeadershipMemberId] = useState(
    event.leadership_member_id ?? ''
  )
  const [attendeeIds, setAttendeeIds] = useState<string[]>(
    event.attendee_ids ?? []
  )
  const [impactOther, setImpactOther] = useState(event.impact_other ?? '')

  const [wasFire, setWasFire] = useState(event.was_fire)
  const [wasInjury, setWasInjury] = useState(event.was_injury)
  const [wasEnvironment, setWasEnvironment] = useState(
    event.was_environment_impacted
  )
  const [wasSecurity, setWasSecurity] = useState(event.was_security)
  const [workRelated, setWorkRelated] = useState(event.work_related)
  const [repeatIncident, setRepeatIncident] = useState(event.repeat_incident)
  const [stopWork, setStopWork] = useState(event.stop_work)

  const isIncident = type === 'incident'
  const isLeadership = type === 'leadership_event'
  const showClassification = WITH_RESPONSE.includes(type)
  const showSignificantHazard = WITH_RESPONSE.includes(type)
  const showWorkRepeat = WITH_RESPONSE.includes(type)
  const showResponse = WITH_RESPONSE.includes(type)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await updateEvent({
      event_id: event.id,
      expected_updated_at: event.updated_at,
      reason: reason || undefined,
      classification:
        showClassification && classification ? classification : undefined,
      significant_hazard:
        showSignificantHazard && significantHazard
          ? significantHazard
          : undefined,
      impacted_party: isIncident && impactedParty ? impactedParty : undefined,
      was_fire: isIncident ? wasFire : false,
      was_injury: isIncident ? wasInjury : false,
      was_environment_impacted: isIncident ? wasEnvironment : false,
      was_security: isIncident ? wasSecurity : false,
      impact_other: isIncident ? impactOther || undefined : undefined,
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
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Event updated')
    router.push(`/events/${event.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Type (locked) */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Event Type
          </h3>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex h-11 w-full items-center rounded-xl border border-input bg-secondary/30 px-4 text-sm text-muted-foreground">
              {EVENT_TYPE_LABELS[type]} (cannot be changed)
            </div>
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
              <Label>Significant Hazard</Label>
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

      {/* Impact (incident only) */}
      {isIncident && (
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

      {/* Reason for change */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="reason">Reason for change (optional)</Label>
          <Textarea
            id="reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this event being edited? Recorded in the audit trail."
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href={`/events/${event.id}`} className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
