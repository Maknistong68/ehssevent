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
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { createCorrectiveAction } from '@/lib/actions/corrective-actions'
import { CA_PRIORITY_LABELS } from '@/types/enums'
import type { CorrectiveActionPriority } from '@/types/enums'
import type { Project } from '@/types/database'
import { format } from 'date-fns'
import Link from 'next/link'

interface CreateCaFormProps {
  projects: Project[]
  users: { id: string; full_name: string | null; email: string }[]
  eventId?: string
  inspectionId?: string
  sectionId?: string
  itemId?: string
  itemLabel?: string
}

export function CreateCaForm({
  projects,
  users,
  eventId,
  inspectionId,
  sectionId,
  itemId,
  itemLabel,
}: CreateCaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [title, setTitle] = useState(itemLabel ? `Corrective action: ${itemLabel}` : '')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<CorrectiveActionPriority>('medium')
  const [projectId, setProjectId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [approverId, setApproverId] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createCorrectiveAction({
      title,
      description: description || undefined,
      event_id: eventId || undefined,
      inspection_id: inspectionId || undefined,
      section_id: sectionId || undefined,
      item_id: itemId || undefined,
      item_label: itemLabel || undefined,
      project_id: projectId || undefined,
      assigned_to: assignedTo || undefined,
      approver_id: approverId || undefined,
      priority,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      photo_urls: photos,
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
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {inspectionId && itemLabel && (
        <div className="rounded-2xl border border-input bg-secondary/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Source: inspection item — </span>
          <span className="font-medium">{itemLabel}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Brief description of the corrective action"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What needs to be done to correct the issue..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority((v ?? 'medium') as CorrectiveActionPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CA_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
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

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">Assignment</h3>

          <div className="space-y-2">
            <Label>Responsible Person</Label>
            <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select responsible person (optional)" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Approver</Label>
            <Select value={approverId} onValueChange={(v) => setApproverId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select approver (optional)" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold tracking-tight">Due Date</h3>
            {dueDate && (
              <span className="text-sm font-medium text-muted-foreground">
                {format(dueDate, 'dd MMM yyyy')}
              </span>
            )}
          </div>
          <div className="flex justify-center rounded-2xl border border-input bg-secondary/30">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">Photos</h3>
          <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href="/corrective-actions" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Corrective Action
        </Button>
      </div>
    </form>
  )
}
