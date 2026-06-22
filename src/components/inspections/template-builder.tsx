'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { TemplateSectionEditor } from './template-section-editor'
import { AlertCircle, ArrowLeft, Loader2, Plus } from 'lucide-react'
import { createTemplate, updateTemplate } from '@/lib/actions/inspections'
import type { TemplateSection, InspectionTemplate } from '@/types/database'
import Link from 'next/link'

interface TemplateBuilderProps {
  template?: InspectionTemplate
}

function createEmptySection(order: number): TemplateSection {
  return {
    id: crypto.randomUUID(),
    title: '',
    order,
    items: [
      {
        id: crypto.randomUUID(),
        label: '',
        field_type: 'text',
        required: false,
        options: null,
        order: 0,
      },
    ],
  }
}

export function TemplateBuilder({ template }: TemplateBuilderProps) {
  const isEditing = !!template
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [sections, setSections] = useState<TemplateSection[]>(
    template?.sections?.length ? template.sections : [createEmptySection(0)]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const addSection = () => {
    setSections([...sections, createEmptySection(sections.length)])
  }

  const updateSection = (index: number, section: TemplateSection) => {
    const newSections = [...sections]
    newSections[index] = section
    setSections(newSections)
  }

  const removeSection = (index: number) => {
    const newSections = sections
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i }))
    setSections(newSections)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      ...(isEditing ? { id: template.id } : {}),
      name,
      description: description || undefined,
      sections: sections.map((s, si) => ({
        ...s,
        order: si,
        items: s.items.map((item, ii) => ({ ...item, order: ii })),
      })),
    }

    const result = isEditing
      ? await updateTemplate(payload)
      : await createTemplate(payload)

    if (result && 'error' in result && result.error) {
      setError(result.error)
      setLoading(false)
    } else if (isEditing) {
      router.push(`/inspections/templates/${template.id}`)
    }
    // createTemplate redirects on success
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Fire Safety Inspection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this template is used for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sections</h2>

        {sections.map((section, index) => (
          <TemplateSectionEditor
            key={section.id}
            section={section}
            onUpdate={(updated) => updateSection(index, updated)}
            onRemove={() => removeSection(index)}
            canRemove={sections.length > 1}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addSection}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="flex gap-3">
        <Link href="/inspections/templates" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Create Template'}
        </Button>
      </div>
    </form>
  )
}
