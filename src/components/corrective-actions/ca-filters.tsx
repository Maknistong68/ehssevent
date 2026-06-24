'use client'

import { ListFilters } from '@/components/shared/list-filters'
import { CA_STATUS_LABELS, CA_PRIORITY_LABELS } from '@/types/enums'
import type { Profile } from '@/types/database'

interface CaFiltersProps {
  creators: Profile[]
  assignees: Profile[]
}

const personOptions = (people: Profile[]) =>
  people.map((p) => ({
    value: p.id,
    label: p.full_name ?? p.email ?? p.username,
  }))

export function CaFilters({ creators, assignees }: CaFiltersProps) {
  return (
    <ListFilters
      fields={[
        {
          type: 'search',
          key: 'search',
          placeholder: 'Search corrective actions...',
        },
        {
          type: 'select',
          key: 'status',
          label: 'Status',
          placeholder: 'All Status',
          options: Object.entries(CA_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          type: 'select',
          key: 'priority',
          label: 'Priority',
          placeholder: 'All Priorities',
          options: Object.entries(CA_PRIORITY_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        },
        {
          type: 'multiselect',
          key: 'created_by',
          label: 'Creator',
          options: personOptions(creators),
        },
        {
          type: 'multiselect',
          key: 'assigned_to',
          label: 'Responsible person',
          options: personOptions(assignees),
        },
        {
          type: 'daterange',
          fromKey: 'date_from',
          toKey: 'date_to',
          label: 'Created date',
        },
      ]}
      sortOptions={[
        { value: 'status:asc', label: 'Status' },
        { value: 'reference:asc', label: 'Reference (A–Z)' },
        { value: 'reference:desc', label: 'Reference (Z–A)' },
        { value: 'creator:asc', label: 'Creator (A–Z)' },
        { value: 'creator:desc', label: 'Creator (Z–A)' },
        { value: 'assignee:asc', label: 'Responsible person (A–Z)' },
        { value: 'assignee:desc', label: 'Responsible person (Z–A)' },
      ]}
    />
  )
}
