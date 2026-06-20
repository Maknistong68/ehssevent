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
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { createCorrectiveAction } from '@/lib/actions/corrective-actions'
import Link from 'next/link'

interface CreateCaFormProps {
  users: { id: string; full_name: string | null; email: string }[]
  eventId?: string
  inspectionId?: string
  sectionId?: string
  itemId?: string
  itemLabel?: string
}

export function CreateCaForm({
  users,
  eventId,
  inspectionId,
  sectionId,
  itemId,
  itemLabel,
}: CreateCaFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(itemLabel ? `Corrective action: ${itemLabel}` : '')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!assignedTo) {
      setError('Please select a responsible person')
      return
    }

    setLoading(true)

    const result = await createCorrectiveAction({
      title,
      description: description || undefined,
      event_id: eventId || undefined,
      inspection_id: inspectionId || undefined,
      section_id: sectionId || undefined,
      item_id: itemId || undefined,
      item_label: itemLabel || undefined,
      assigned_to: assignedTo,
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
            <Label htmlFor="title">Corrective Action *</Label>
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

          <div className="space-y-2">
            <Label>Responsible Person *</Label>
            <Select value={assignedTo} onValueChange={(v) => setAssignedTo(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select responsible person" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The responsible person uploads the evidence to submit this action for
              your approval.
            </p>
          </div>
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
