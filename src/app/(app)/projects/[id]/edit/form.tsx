'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { updateProject } from '@/lib/actions/projects'
import type { Project } from '@/types/database'

export function EditProjectForm({ project }: { project: Project }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(project.is_active)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateProject({
      id: project.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      is_active: isActive,
    })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project.name}
              placeholder="e.g. Highway Bridge Repair"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project.description ?? ''}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={project.location ?? ''}
              placeholder="e.g. Site A, Building 3"
            />
          </div>

          <label
            htmlFor="is_active"
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-secondary/30 px-4 py-3 text-sm font-medium"
          >
            <Checkbox
              id="is_active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(!!v)}
            />
            Active
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Link href={`/projects/${project.id}`} className="flex-1">
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
