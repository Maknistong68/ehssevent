'use client'

import { ListFilters } from '@/components/shared/list-filters'
import { CA_STATUS_LABELS, CA_PRIORITY_LABELS } from '@/types/enums'

export function CaFilters() {
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
          type: 'daterange',
          fromKey: 'date_from',
          toKey: 'date_to',
          label: 'Created date',
        },
      ]}
      sortOptions={[
        { value: 'status:asc', label: 'Status' },
        { value: 'reference:asc', label: 'Reference (A–Z)' },
      ]}
    />
  )
}
