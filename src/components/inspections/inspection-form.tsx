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
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { submitInspection } from '@/lib/actions/inspections'
import type { InspectionTemplate, Project } from '@/types/database'
import { COMPLIANCE_LABELS, type ComplianceValue } from '@/types/enums'
import Link from 'next/link'

const COMPLIANCE_OPTIONS: { value: ComplianceValue; activeClass: string }[] = [
  { value: 'fully_compliant', activeClass: 'bg-green-600 hover:bg-green-700' },
  { value: 'partially_compliant', activeClass: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'non_compliant', activeClass: 'bg-red-600 hover:bg-red-700' },
  { value: 'not_applicable', activeClass: 'bg-slate-500 hover:bg-slate-600' },
]

interface InspectionFormProps {
  template: InspectionTemplate
  projects: Project[]
}

interface ResponseState {
  [key: string]: {
    value: string | null
    photo_urls: string[]
  }
}

export function InspectionForm({ template, projects }: InspectionFormProps) {
  const [projectId, setProjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [responses, setResponses] = useState<ResponseState>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getResponseKey = (sectionId: string, itemId: string) => `${sectionId}:${itemId}`

  const getResponse = (sectionId: string, itemId: string) => {
    return responses[getResponseKey(sectionId, itemId)] || { value: null, photo_urls: [] }
  }

  const setResponseValue = (sectionId: string, itemId: string, value: string | null) => {
    const key = getResponseKey(sectionId, itemId)
    setResponses((prev) => ({
      ...prev,
      [key]: { ...prev[key], value, photo_urls: prev[key]?.photo_urls || [] },
    }))
  }

  const setResponsePhotos = (sectionId: string, itemId: string, photos: string[]) => {
    const key = getResponseKey(sectionId, itemId)
    setResponses((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: prev[key]?.value ?? null, photo_urls: photos },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const responseArray = template.sections.flatMap((section) =>
      section.items.map((item) => {
        const resp = getResponse(section.id, item.id)
        return {
          section_id: section.id,
          item_id: item.id,
          field_type: item.field_type,
          value: resp.value,
          photo_urls: resp.photo_urls,
        }
      })
    )

    const result = await submitInspection({
      template_id: template.id,
      project_id: projectId,
      notes: notes || undefined,
      responses: responseArray,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, the server action redirects
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Template</Label>
            <p className="text-sm font-medium">{template.name}</p>
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
        </CardContent>
      </Card>

      {template.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {section.items.map((item) => {
              const resp = getResponse(section.id, item.id)
              return (
                <div key={item.id} className="space-y-2">
                  <Label>
                    {item.label}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {item.field_type === 'text' && (
                    <Textarea
                      value={resp.value || ''}
                      onChange={(e) => setResponseValue(section.id, item.id, e.target.value)}
                      placeholder="Enter response..."
                      rows={2}
                    />
                  )}

                  {item.field_type === 'yes_no' && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={resp.value === 'yes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResponseValue(section.id, item.id, 'yes')}
                        className={resp.value === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={resp.value === 'no' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResponseValue(section.id, item.id, 'no')}
                        className={resp.value === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        No
                      </Button>
                    </div>
                  )}

                  {item.field_type === 'pass_fail' && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={resp.value === 'pass' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResponseValue(section.id, item.id, 'pass')}
                        className={resp.value === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        Pass
                      </Button>
                      <Button
                        type="button"
                        variant={resp.value === 'fail' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setResponseValue(section.id, item.id, 'fail')}
                        className={resp.value === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                      >
                        Fail
                      </Button>
                    </div>
                  )}

                  {item.field_type === 'numeric' && (
                    <Input
                      type="number"
                      value={resp.value || ''}
                      onChange={(e) => setResponseValue(section.id, item.id, e.target.value)}
                      placeholder="Enter a number..."
                    />
                  )}

                  {item.field_type === 'dropdown' && item.options && (
                    <Select
                      value={resp.value || ''}
                      onValueChange={(v) => setResponseValue(section.id, item.id, v)}
                    >
                      <SelectTrigger>
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

                  {item.field_type === 'compliance' && (
                    <div className="flex flex-wrap gap-2">
                      {COMPLIANCE_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={resp.value === opt.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setResponseValue(section.id, item.id, opt.value)}
                          className={resp.value === opt.value ? opt.activeClass : ''}
                        >
                          {COMPLIANCE_LABELS[opt.value]}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

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
        </Button>
      </div>
    </form>
  )
}
