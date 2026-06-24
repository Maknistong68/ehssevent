'use client'

import { ListFilters } from '@/components/shared/list-filters'
import { INSPECTION_STATUS_LABELS } from '@/types/enums'
import type { Project, InspectionTemplate, Profile } from '@/types/database'

interface InspectionFiltersProps {
  projects: Project[]
  templates: InspectionTemplate[]
  conductors: Profile[]
}

export function InspectionFilters({
  projects,
  templates,
  conductors,
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
        {
          type: 'multiselect',
          key: 'conducted_by',
          label: 'Conducted by',
          options: conductors.map((c) => ({
            value: c.id,
            label: c.full_name ?? c.email ?? c.username,
          })),
        },
      ]}
      sortOptions={[
        { value: 'score:desc', label: 'Score (high–low)' },
        { value: 'score:asc', label: 'Score (low–high)' },
        { value: 'status:asc', label: 'Status' },
        { value: 'reference:asc', label: 'Reference (A–Z)' },
        { value: 'reference:desc', label: 'Reference (Z–A)' },
        { value: 'conductor:asc', label: 'Conducted by (A–Z)' },
        { value: 'conductor:desc', label: 'Conducted by (Z–A)' },
      ]}
    />
  )
}
