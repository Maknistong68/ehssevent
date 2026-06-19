'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, ArrowLeft, Loader2, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { createEvent } from '@/lib/actions/events'
import {
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_HAZARD_LABELS,
  EVENT_IMPACTED_PARTY_LABELS,
  type EventType,
} from '@/types/enums'
import { SITE_OPTIONS, CONTRACTOR_OPTIONS } from '@/lib/constants/events'
import type { Project } from '@/types/database'
import Link from 'next/link'

interface CreateEventFormProps {
  projects: Project[]
  defaultProjectId?: string
}

const NONE = '__none__'

// Classifications offered in the dropdown for the variable types.
const CLASSIFICATION_OPTIONS: Array<keyof typeof EVENT_CLASSIFICATION_LABELS> = [
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
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v)} />
      {label}
    </label>
  )
}

export function CreateEventForm({ projects, defaultProjectId = '' }: CreateEventFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)
  const [showGps, setShowGps] = useState(false)

  const [type, setType] = useState<EventType>('hazard_identification')
  const [classification, setClassification] = useState('')
  const [significantHazard, setSignificantHazard] = useState('')
  const [impactedParty, setImpactedParty] = useState('')
  const [site, setSite] = useState('')
  const [contractor, setContractor] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId)

  const [specificArea, setSpecificArea] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [conditions, setConditions] = useState('')
  const [immediateCorrectiveActions, setImmediateCorrectiveActions] =
    useState('')
  const [stopWorkDetails, setStopWorkDetails] = useState('')
  const [leadershipMemberName, setLeadershipMemberName] = useState('')
  const [attendees, setAttendees] = useState('')
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
  const showClassification = WITH_RESPONSE.includes(type)
  const showSignificantHazard = WITH_RESPONSE.includes(type)
  const showWorkRepeat = WITH_RESPONSE.includes(type)
  const showConditions = type === 'incident' || type === 'hazard_identification'
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
      impacted_party: isIncident && impactedParty ? impactedParty : undefined,
      was_fire: isIncident ? wasFire : false,
      was_injury: isIncident ? wasInjury : false,
      was_environment_impacted: isIncident ? wasEnvironment : false,
      was_security: isIncident ? wasSecurity : false,
      impact_other: isIncident ? impactOther || undefined : undefined,
      work_related: showWorkRepeat ? workRelated : true,
      repeat_incident: showWorkRepeat ? repeatIncident : false,
      stop_work: showResponse ? stopWork : false,
      stop_work_details: showResponse ? stopWorkDetails || undefined : undefined,
      conditions: showConditions ? conditions || undefined : undefined,
      immediate_corrective_actions: showResponse
        ? immediateCorrectiveActions || undefined
        : undefined,
      leadership_member_name: isLeadership
        ? leadershipMemberName || undefined
        : undefined,
      attendees: isLeadership ? attendees || undefined : undefined,
      project_id: projectId || undefined,
      site: site || undefined,
      contractor: contractor || undefined,
      specific_area: specificArea || undefined,
      latitude: showGps ? latitude || undefined : undefined,
      longitude: showGps ? longitude || undefined : undefined,
      event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : undefined,
      event_description: eventDescription || undefined,
      photo_urls: photos,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
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
                value={classification || NONE}
                onValueChange={(v) =>
                  setClassification(v === NONE ? '' : (v ?? ''))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
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
                value={significantHazard || NONE}
                onValueChange={(v) =>
                  setSignificantHazard(v === NONE ? '' : (v ?? ''))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hazard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
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
            <Select
              value={site || NONE}
              onValueChange={(v) => setSite(v === NONE ? '' : (v ?? ''))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {SITE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Contractor</Label>
              <Select
                value={contractor || NONE}
                onValueChange={(v) => setContractor(v === NONE ? '' : (v ?? ''))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contractor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {CONTRACTOR_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
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
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>Linked Project (optional)</Label>
              <Select
                value={projectId || NONE}
                onValueChange={(v) => setProjectId(v === NONE ? '' : (v ?? ''))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Link to a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!showGps ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGps(true)}
              data-icon="inline-start"
            >
              <MapPin className="h-4 w-4" />
              Add GPS coordinates
            </Button>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Date */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Event Date
            </h3>
            {eventDate && (
              <span className="text-sm font-medium text-muted-foreground">
                {format(eventDate, 'dd MMM yyyy')}
              </span>
            )}
          </div>
          <div className="flex justify-center rounded-2xl border border-input bg-secondary/30">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              disabled={{ after: new Date() }}
            />
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
                value={impactedParty || NONE}
                onValueChange={(v) =>
                  setImpactedParty(v === NONE ? '' : (v ?? ''))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
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
              <Label htmlFor="leadership_member_name">
                Leadership Member Name
              </Label>
              <Input
                id="leadership_member_name"
                value={leadershipMemberName}
                onChange={(e) => setLeadershipMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees</Label>
              <Textarea
                id="attendees"
                rows={2}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
              />
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
          </div>

          {showConditions && (
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (optional)</Label>
              <Textarea
                id="conditions"
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>
          )}

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
                onChange={(e) =>
                  setImmediateCorrectiveActions(e.target.value)
                }
              />
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
