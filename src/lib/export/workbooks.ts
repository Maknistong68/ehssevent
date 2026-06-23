import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import type {
  Event,
  CorrectiveAction,
  Inspection,
  InspectionResponse,
} from '@/types/database'
import {
  EVENT_TYPE_LABELS,
  EVENT_CLASSIFICATION_LABELS,
  EVENT_APPROVAL_LABELS,
  CA_STATUS_LABELS,
  CA_PRIORITY_LABELS,
} from '@/types/enums'
import { pseudonym } from '@/lib/utils/people'

function fmtDate(value: string | null | undefined, withTime = false): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return format(d, withTime ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy')
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No'
}

/** Styles a worksheet's first row as a bold header and auto-sizes columns. */
function finalizeSheet(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1)
  header.font = { bold: true }
  header.alignment = { vertical: 'middle' }
  sheet.columns.forEach((col) => {
    let max = 10
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0
      if (len > max) max = len
    })
    col.width = Math.min(max + 2, 60)
  })
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
}

/**
 * Workbook of events with two sheets: a full register and a statutory
 * reporting-deadline compliance view (24h / 3-day).
 */
export async function eventsToWorkbook(
  events: Event[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Event Report'
  wb.created = new Date()

  const sheet = wb.addWorksheet('Events')
  sheet.columns = [
    { header: 'Reference', key: 'ref' },
    { header: 'Type', key: 'type' },
    { header: 'Classification', key: 'classification' },
    { header: 'Stage', key: 'stage' },
    { header: 'Site', key: 'site' },
    { header: 'Area', key: 'area' },
    { header: 'Event Date', key: 'event_date' },
    { header: 'Reported', key: 'reported' },
    { header: 'Reported By', key: 'reporter' },
    { header: 'Work Related', key: 'work_related' },
    { header: 'Stop Work', key: 'stop_work' },
    { header: 'Description', key: 'description' },
    { header: 'Closed', key: 'closed' },
  ]
  for (const e of events) {
    sheet.addRow({
      ref: e.reference_number,
      type: EVENT_TYPE_LABELS[e.type] ?? e.type,
      classification:
        EVENT_CLASSIFICATION_LABELS[e.classification] ?? e.classification,
      stage: EVENT_APPROVAL_LABELS[e.approval_level] ?? e.approval_level,
      site: e.site ?? '',
      area: e.specific_area ?? '',
      event_date: fmtDate(e.event_date, true),
      reported: fmtDate(e.reported_date, true),
      reporter: pseudonym(e.created_by),
      work_related: yesNo(e.work_related),
      stop_work: yesNo(e.stop_work),
      description: e.event_description ?? '',
      closed: fmtDate(e.date_closure, true),
    })
  }
  finalizeSheet(sheet)

  // Statutory reporting-deadline compliance view.
  const deadlines = wb.addWorksheet('Reporting Deadlines')
  deadlines.columns = [
    { header: 'Reference', key: 'ref' },
    { header: 'Event Date', key: 'event_date' },
    { header: '24h Deadline', key: 'd24' },
    { header: '24h Met', key: 'm24' },
    { header: '24h Met At', key: 'm24at' },
    { header: '3-day Deadline', key: 'd3' },
    { header: '3-day Met', key: 'm3' },
    { header: '3-day Met At', key: 'm3at' },
  ]
  for (const e of events) {
    deadlines.addRow({
      ref: e.reference_number,
      event_date: fmtDate(e.event_date, true),
      d24: fmtDate(e.reporting_deadline_24h, true),
      m24: yesNo(e.deadline_24h_met),
      m24at: fmtDate(e.deadline_24h_met_at, true),
      d3: fmtDate(e.reporting_deadline_3day, true),
      m3: yesNo(e.deadline_3day_met),
      m3at: fmtDate(e.deadline_3day_met_at, true),
    })
  }
  finalizeSheet(deadlines)

  return wb
}

export async function correctiveActionsToWorkbook(
  actions: CorrectiveAction[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Event Report'
  wb.created = new Date()

  const sheet = wb.addWorksheet('Corrective Actions')
  sheet.columns = [
    { header: 'Reference', key: 'ref' },
    { header: 'Title', key: 'title' },
    { header: 'Status', key: 'status' },
    { header: 'Priority', key: 'priority' },
    { header: 'Assigned To', key: 'assignee' },
    { header: 'Approver', key: 'approver' },
    { header: 'Due Date', key: 'due' },
    { header: 'Created', key: 'created' },
    { header: 'Submitted', key: 'submitted' },
    { header: 'Approved', key: 'approved' },
    { header: 'Description', key: 'description' },
  ]
  for (const ca of actions) {
    sheet.addRow({
      ref: ca.reference_number,
      title: ca.title,
      status: CA_STATUS_LABELS[ca.status] ?? ca.status,
      priority: CA_PRIORITY_LABELS[ca.priority] ?? ca.priority,
      assignee: pseudonym(ca.assigned_to),
      approver: pseudonym(ca.approver_id),
      due: fmtDate(ca.due_date),
      created: fmtDate(ca.created_at, true),
      submitted: fmtDate(ca.completed_at, true),
      approved: fmtDate(ca.approved_at, true),
      description: ca.description ?? '',
    })
  }
  finalizeSheet(sheet)

  return wb
}

export async function inspectionToWorkbook(
  inspection: Inspection,
  responses: InspectionResponse[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Event Report'
  wb.created = new Date()

  const summary = wb.addWorksheet('Summary')
  summary.columns = [
    { header: 'Field', key: 'field' },
    { header: 'Value', key: 'value' },
  ]
  const template = inspection.template
  const rows: [string, string][] = [
    ['Reference', inspection.reference_number],
    ['Template', template?.name ?? ''],
    ['Status', inspection.status],
    ['Score', inspection.score != null ? `${inspection.score}%` : ''],
    ['Total Items', String(inspection.total_items)],
    ['Scorable Items', String(inspection.scorable_items)],
    ['Compliant Items', String(inspection.compliant_items)],
    ['Conducted By', pseudonym(inspection.conducted_by)],
    ['Completed', fmtDate(inspection.completed_at, true)],
    ['Notes', inspection.notes ?? ''],
  ]
  for (const [field, value] of rows) summary.addRow({ field, value })
  finalizeSheet(summary)

  // Map item/section ids to labels via the template, when present.
  const itemLabel = new Map<string, string>()
  const sectionTitle = new Map<string, string>()
  for (const section of template?.sections ?? []) {
    sectionTitle.set(section.id, section.title)
    for (const item of section.items) itemLabel.set(item.id, item.label)
  }

  const details = wb.addWorksheet('Responses')
  details.columns = [
    { header: 'Section', key: 'section' },
    { header: 'Item', key: 'item' },
    { header: 'Type', key: 'type' },
    { header: 'Value', key: 'value' },
    { header: 'Observation', key: 'observation' },
    { header: 'Action Plan', key: 'action_plan' },
    { header: 'Comment', key: 'comment' },
  ]
  for (const r of responses) {
    details.addRow({
      section: sectionTitle.get(r.section_id) ?? r.section_id,
      item: itemLabel.get(r.item_id) ?? r.item_id,
      type: r.field_type,
      value: r.value ?? '',
      observation: r.observation ?? '',
      action_plan: r.action_plan ?? '',
      comment: r.comment ?? '',
    })
  }
  finalizeSheet(details)

  return wb
}

/** Serializes a workbook to a Node Buffer for an HTTP response. */
export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const data = await wb.xlsx.writeBuffer()
  return Buffer.from(data)
}
