'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { submitInspection } from '@/lib/actions/inspections'
import type { InspectionTemplate, Project } from '@/types/database'
import { COMPLIANCE_LABELS, COMPLIANCE_COLORS, type ComplianceValue } from '@/types/enums'
import type { AssignableUser } from '@/lib/queries/users'
import Link from 'next/link'

interface InspectionFormProps {
  template: InspectionTemplate
  projects: Project[]
  organizationName: string
  conductedByName: string
  assignableUsers: AssignableUser[]
}

interface ItemResponse {
  value: string | null
  photo_urls: string[]
  comment: string | null
  observation: string | null
  action_plan: string | null
}

interface ResponseState {
  [key: string]: ItemResponse
}

const EMPTY_RESPONSE: ItemResponse = {
  value: null,
  photo_urls: [],
  comment: null,
  observation: null,
  action_plan: null,
}

interface NonCompliantItem {
  section_id: string
  section_title: string
  item_id: string
  item_label: string
  compliance_value: ComplianceValue
  ca_title: string
  assigned_to: string
}

type FormStep = 'checklist' | 'assign_ca'

export function InspectionForm({
  template,
  projects,
  organizationName,
  conductedByName,
  assignableUsers,
}: InspectionFormProps) {
  const [step, setStep] = useState<FormStep>('checklist')
  const [projectId, setProjectId] = useState('')
  const [auditTitle, setAuditTitle] = useState(template.name)
  const [auditDate, setAuditDate] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [notes, setNotes] = useState('')
  const [responses, setResponses] = useState<ResponseState>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [nonCompliantItems, setNonCompliantItems] = useState<NonCompliantItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getResponseKey = (sectionId: string, itemId: string) => `${sectionId}:${itemId}`

  const getResponse = (sectionId: string, itemId: string): ItemResponse => {
    return responses[getResponseKey(sectionId, itemId)] || EMPTY_RESPONSE
  }

  const patchResponse = (
    sectionId: string,
    itemId: string,
    patch: Partial<ItemResponse>
  ) => {
    const key = getResponseKey(sectionId, itemId)
    setResponses((prev) => ({
      ...prev,
      [key]: { ...EMPTY_RESPONSE, ...prev[key], ...patch },
    }))
  }

  const setResponseValue = (sectionId: string, itemId: string, value: string | null) => {
    patchResponse(sectionId, itemId, { value })
    // Auto-expand detail for non/partially-compliant items
    if (value === 'non_compliant' || value === 'partially_compliant') {
      setExpandedItems((prev) => new Set(prev).add(getResponseKey(sectionId, itemId)))
    }
  }

  const setResponsePhotos = (sectionId: string, itemId: string, photos: string[]) => {
    patchResponse(sectionId, itemId, { photo_urls: photos })
  }

  const toggleExpanded = (sectionId: string, itemId: string) => {
    const key = getResponseKey(sectionId, itemId)
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const buildResponseArray = () =>
    template.sections.flatMap((section) =>
      section.items.map((item) => {
        const resp = getResponse(section.id, item.id)
        return {
          section_id: section.id,
          item_id: item.id,
          field_type: item.field_type,
          value: resp.value,
          comment: resp.comment,
          observation: resp.observation,
          action_plan: resp.action_plan,
          photo_urls: resp.photo_urls,
        }
      })
    )

  const handleChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Scan for non-compliant items
    const failingItems: NonCompliantItem[] = []
    for (const section of template.sections) {
      for (const item of section.items) {
        if (item.field_type === 'compliance') {
          const resp = getResponse(section.id, item.id)
          if (resp.value === 'non_compliant' || resp.value === 'partially_compliant') {
            failingItems.push({
              section_id: section.id,
              section_title: section.title,
              item_id: item.id,
              item_label: item.label,
              compliance_value: resp.value as ComplianceValue,
              ca_title: `Corrective action: ${item.label}`,
              assigned_to: '',
            })
          }
        }
      }
    }

    if (failingItems.length > 0) {
      setNonCompliantItems(failingItems)
      setStep('assign_ca')
    } else {
      doSubmit()
    }
  }

  const handleCaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all CA items have an assigned person
    const unassigned = nonCompliantItems.some((item) => !item.assigned_to)
    if (unassigned) {
      setError('Please assign a responsible person for each corrective action.')
      return
    }

    const invalidTitle = nonCompliantItems.some((item) => item.ca_title.trim().length < 3)
    if (invalidTitle) {
      setError('Each corrective action title must be at least 3 characters.')
      return
    }

    doSubmit()
  }

  const doSubmit = async () => {
    setLoading(true)
    setError('')

    const responseArray = buildResponseArray()

    const corrective_actions =
      nonCompliantItems.length > 0
        ? nonCompliantItems.map((item) => ({
            section_id: item.section_id,
            item_id: item.item_id,
            item_label: item.item_label,
            title: item.ca_title,
            assigned_to: item.assigned_to,
          }))
        : undefined

    const result = await submitInspection({
      template_id: template.id,
      project_id: projectId,
      notes: notes || undefined,
      responses: responseArray,
      corrective_actions,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, the server action redirects
  }

  const updateCaItem = (index: number, field: keyof NonCompliantItem, value: string) => {
    setNonCompliantItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  if (step === 'assign_ca') {
    return (
      <form onSubmit={handleCaSubmit} className="space-y-6">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assign Corrective Actions</CardTitle>
            <p className="text-sm text-muted-foreground">
              The following items were marked as non-compliant or partially compliant.
              Please assign a responsible person for each corrective action.
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {nonCompliantItems.map((item, index) => (
                <div key={`${item.section_id}:${item.item_id}`} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.item_label}</p>
                      <p className="text-xs text-muted-foreground">{item.section_title}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={COMPLIANCE_COLORS[item.compliance_value]}
                    >
                      {COMPLIANCE_LABELS[item.compliance_value]}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">CA Title</Label>
                    <Input
                      value={item.ca_title}
                      onChange={(e) => updateCaItem(index, 'ca_title', e.target.value)}
                      placeholder="Corrective action title"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Responsible Person *</Label>
                    <Select
                      value={item.assigned_to}
                      onValueChange={(v) => updateCaItem(index, 'assigned_to', v ?? '')}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep('checklist')}
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Checklist
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Inspection & Create Actions
          </Button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleChecklistSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Audit Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={organizationName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-title">Audit Title</Label>
              <Input
                id="audit-title"
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-date">Date & Time</Label>
              <Input
                id="audit-date"
                type="datetime-local"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Conducted By</Label>
              <Input value={conductedByName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Input value={template.name} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? '')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Sections */}
      {template.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {section.items.map((item) => {
                const resp = getResponse(section.id, item.id)
                const itemKey = getResponseKey(section.id, item.id)
                const isExpanded = expandedItems.has(itemKey)
                return (
                  <div key={item.id} className="flex flex-col gap-2 px-6 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="flex-1 font-normal sm:font-medium">
                      {item.label}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    <div className="w-full sm:w-56 shrink-0">
                      {item.field_type === 'compliance' && (
                        <Select
                          value={resp.value || ''}
                          onValueChange={(v) => setResponseValue(section.id, item.id, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fully_compliant">Fully Compliant</SelectItem>
                            <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                            <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                            <SelectItem value="not_applicable">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {item.field_type === 'yes_no' && (
                        <Select
                          value={resp.value || ''}
                          onValueChange={(v) => setResponseValue(section.id, item.id, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {item.field_type === 'pass_fail' && (
                        <Select
                          value={resp.value || ''}
                          onValueChange={(v) => setResponseValue(section.id, item.id, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {item.field_type === 'text' && (
                        <Textarea
                          value={resp.value || ''}
                          onChange={(e) => setResponseValue(section.id, item.id, e.target.value)}
                          placeholder="Enter response..."
                          rows={2}
                        />
                      )}

                      {item.field_type === 'numeric' && (
                        <Input
                          type="number"
                          value={resp.value || ''}
                          onChange={(e) => setResponseValue(section.id, item.id, e.target.value)}
                          placeholder="Enter a number..."
                          className="h-9"
                        />
                      )}

                      {item.field_type === 'dropdown' && item.options && (
                        <Select
                          value={resp.value || ''}
                          onValueChange={(v) => setResponseValue(section.id, item.id, v)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {item.field_type === 'photo' && (
                        <PhotoUpload
                          photos={resp.photo_urls}
                          onPhotosChange={(photos) => setResponsePhotos(section.id, item.id, photos)}
                          bucket="inspection-photos"
                        />
                      )}
                    </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(section.id, item.id)}
                      className="self-start text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? 'Hide detail' : 'Add comment / observation / action'}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Comment</Label>
                          <Textarea
                            value={resp.comment ?? ''}
                            onChange={(e) =>
                              patchResponse(section.id, item.id, { comment: e.target.value || null })
                            }
                            placeholder="Comment"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Observation</Label>
                          <Textarea
                            value={resp.observation ?? ''}
                            onChange={(e) =>
                              patchResponse(section.id, item.id, { observation: e.target.value || null })
                            }
                            placeholder="Observation"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Action Plan</Label>
                          <Textarea
                            value={resp.action_plan ?? ''}
                            onChange={(e) =>
                              patchResponse(section.id, item.id, { action_plan: e.target.value || null })
                            }
                            placeholder="Action Plan"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Notes */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations or notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/inspections" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={loading || !projectId}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Inspection
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
