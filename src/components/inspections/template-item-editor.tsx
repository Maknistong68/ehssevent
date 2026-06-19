'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, GripVertical, Plus, X } from 'lucide-react'
import { INSPECTION_FIELD_TYPE_LABELS } from '@/types/enums'
import type { InspectionFieldType } from '@/types/enums'
import type { TemplateItem } from '@/types/database'

interface TemplateItemEditorProps {
  item: TemplateItem
  onUpdate: (item: TemplateItem) => void
  onRemove: () => void
}

export function TemplateItemEditor({ item, onUpdate, onRemove }: TemplateItemEditorProps) {
  const updateField = (field: string, value: unknown) => {
    const updated = { ...item, [field]: value }
    // Clear options when changing away from dropdown
    if (field === 'field_type' && value !== 'dropdown') {
      updated.options = null
    }
    // Initialize options when switching to dropdown
    if (field === 'field_type' && value === 'dropdown' && !item.options) {
      updated.options = ['']
    }
    onUpdate(updated)
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(item.options || [])]
    newOptions[index] = value
    onUpdate({ ...item, options: newOptions })
  }

  const addOption = () => {
    onUpdate({ ...item, options: [...(item.options || []), ''] })
  }

  const removeOption = (index: number) => {
    const newOptions = (item.options || []).filter((_, i) => i !== index)
    onUpdate({ ...item, options: newOptions.length > 0 ? newOptions : [''] })
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-background">
      <div className="flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0 cursor-grab" />

        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Item question / label"
                value={item.label}
                onChange={(e) => updateField('label', e.target.value)}
              />
            </div>
            <Select
              value={item.field_type}
              onValueChange={(v) => updateField('field_type', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSPECTION_FIELD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(e) => updateField('required', e.target.checked)}
                className="rounded"
              />
              Required
            </label>
          </div>

          {item.field_type === 'dropdown' && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Dropdown Options</Label>
              {(item.options || ['']).map((option, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={option}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeOption(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={addOption}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Option
              </Button>
            </div>
          )}

          {item.field_type === 'compliance' && (
            <p className="text-xs text-muted-foreground">
              Scored item · auto-weighted · 4 levels (Fully / Partially / Non-Compliant /
              N/A). N/A is excluded and the checklist re-normalises to 100%.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
