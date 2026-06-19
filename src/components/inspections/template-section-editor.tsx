'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TemplateItemEditor } from './template-item-editor'
import { Plus, Trash2 } from 'lucide-react'
import type { TemplateSection, TemplateItem } from '@/types/database'

interface TemplateSectionEditorProps {
  section: TemplateSection
  onUpdate: (section: TemplateSection) => void
  onRemove: () => void
  canRemove: boolean
}

export function TemplateSectionEditor({
  section,
  onUpdate,
  onRemove,
  canRemove,
}: TemplateSectionEditorProps) {
  const updateTitle = (title: string) => {
    onUpdate({ ...section, title })
  }

  const addItem = () => {
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      label: '',
      field_type: 'text',
      required: false,
      options: null,
      order: section.items.length,
    }
    onUpdate({ ...section, items: [...section.items, newItem] })
  }

  const updateItem = (index: number, item: TemplateItem) => {
    const newItems = [...section.items]
    newItems[index] = item
    onUpdate({ ...section, items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = section.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, order: i }))
    onUpdate({ ...section, items: newItems })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Section title"
            value={section.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="font-semibold"
          />
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {section.items.map((item, index) => (
          <TemplateItemEditor
            key={item.id}
            item={item}
            onUpdate={(updated) => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardContent>
    </Card>
  )
}
