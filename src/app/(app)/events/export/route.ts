export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { getEvents } from '@/lib/queries/events'
import { EXPORT_COLUMNS } from '@/lib/constants/events'
import {
  EVENT_APPROVAL_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_HAZARD_LABELS,
  EVENT_IMPACTED_PARTY_LABELS,
} from '@/types/enums'
import type {
  EventApprovalLevel,
  EventType,
  EventClassification,
} from '@/types/enums'

const yn = (v: boolean) => (v ? 'Yes' : 'No')
const dt = (d: string | null) => (d ? format(new Date(d), 'dd/MM/yyyy h:mm a') : '')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const events = await getEvents({
    approval_level: (searchParams.get('approval_level') as EventApprovalLevel) || undefined,
    type: (searchParams.get('type') as EventType) || undefined,
    classification: (searchParams.get('classification') as EventClassification) || undefined,
    project_id: searchParams.get('project_id') || undefined,
    search: searchParams.get('search') || undefined,
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Importable File')

  sheet.addRow(EXPORT_COLUMNS)
  sheet.getRow(1).font = { bold: true }

  for (const e of events) {
    sheet.addRow([
      EVENT_APPROVAL_LABELS[e.approval_level],
      EVENT_TYPE_LABELS[e.type],
      yn(e.was_fire),
      yn(e.was_injury),
      yn(e.was_environment_impacted),
      EVENT_CLASSIFICATION_LABELS[e.classification],
      e.site ?? '',
      e.contractor ?? '',
      e.specific_area ?? '',
      e.latitude ?? '',
      e.longitude ?? '',
      dt(e.event_date),
      dt(e.reported_date),
      yn(e.work_related),
      e.impacted_party ? EVENT_IMPACTED_PARTY_LABELS[e.impacted_party] : '',
      e.leadership_member_name ?? '',
      e.attendees ?? '',
      yn(e.notify_attendees_by_email),
      e.event_description ?? '',
      e.conditions ?? '',
      e.significant_hazard ? EVENT_HAZARD_LABELS[e.significant_hazard] : '',
      yn(e.repeat_incident),
      e.immediate_corrective_actions ?? '',
      yn(e.stop_work),
      e.stop_work_details ?? '',
      yn(e.further_action_required),
      (e.photo_urls || []).join('\n'),
      e.contractor_reviewer ?? '',
      e.reviewer ?? '',
      e.contractor_investigator ?? '',
      e.lead_investigator ?? '',
      e.validator ?? '',
      e.approver ?? '',
      e.created_by_name ?? '',
    ])
  }

  // Reasonable default widths
  sheet.columns.forEach((col) => {
    col.width = 22
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `event-import-${format(new Date(), 'yyyy-MM-dd')}.xlsx`

  return new NextResponse(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
