'use client'

import { ListFilters } from '@/components/shared/list-filters'
import {
  EVENT_APPROVAL_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
} from '@/types/enums'
import { SITE_OPTIONS } from '@/lib/constants/events'

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

export function EventFilters() {
  return (
    <ListFilters
      fields={[
        { type: 'search', key: 'search', placeholder: 'Search events...' },
        {
          type: 'select',
          key: 'site',
          label: 'Site',
          placeholder: 'All Sites',
          options: SITE_OPTIONS.map((s) => ({ value: s, label: s })),
        },
        {
          type: 'select',
          key: 'approval_level',
          label: 'Approval level',
          placeholder: 'All Levels',
          options: toOptions(EVENT_APPROVAL_LABELS),
        },
        {
          type: 'select',
          key: 'type',
          label: 'Type',
          placeholder: 'All Types',
          options: toOptions(EVENT_TYPE_LABELS),
        },
        {
          type: 'select',
          key: 'classification',
          label: 'Classification',
          placeholder: 'All Classifications',
          options: toOptions(EVENT_CLASSIFICATION_LABELS),
        },
      ]}
      sortOptions={[
        { value: 'date:desc', label: 'Newest first' },
        { value: 'date:asc', label: 'Oldest first' },
        { value: 'reference:asc', label: 'Reference (A–Z)' },
        { value: 'reference:desc', label: 'Reference (Z–A)' },
        { value: 'approval:asc', label: 'Approval stage' },
      ]}
    />
  )
}
