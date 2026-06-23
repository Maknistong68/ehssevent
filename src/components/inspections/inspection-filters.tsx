'use client'

import { ListFilters } from '@/components/shared/list-filters'
import { INSPECTION_STATUS_LABELS } from '@/types/enums'
import type { Project, InspectionTemplate } from '@/types/database'

interface InspectionFiltersProps {
  projects: Project[]
  templates: InspectionTemplate[]
}

export function InspectionFilters({
  projects,
  templates,
}: InspectionFiltersProps) {
  return (
    <ListFilters
      fields={[
        { type: 'search', key: 'search', placeholder: 'Search inspections...' },
        {
          type: 'select',
          key: 'status',
          label: 'Status',
          placeholder: 'All Status',
          options: Object.entries(INSPECTION_STATUS_LABELS).map(
            ([value, label]) => ({ value, label })
          ),
        },
        {
          type: 'select',
          key: 'project_id',
          label: 'Project',
          placeholder: 'All Projects',
          options: projects.map((p) => ({ value: p.id, label: p.name })),
        },
        {
          type: 'select',
          key: 'template_id',
          label: 'Template',
          placeholder: 'All Templates',
          options: templates.map((t) => ({ value: t.id, label: t.name })),
        },
      ]}
      sortOptions={[
        { value: 'score:desc', label: 'Score (high–low)' },
        { value: 'score:asc', label: 'Score (low–high)' },
        { value: 'status:asc', label: 'Status' },
        { value: 'reference:asc', label: 'Reference (A–Z)' },
        { value: 'reference:desc', label: 'Reference (Z–A)' },
      ]}
    />
  )
}
