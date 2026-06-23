import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth/guards'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getEvents } from '@/lib/queries/events'
import { getCorrectiveActions } from '@/lib/queries/corrective-actions'
import {
  getInspectionById,
  getInspectionResponses,
  getTemplateById,
} from '@/lib/queries/inspections'
import {
  eventsToWorkbook,
  correctiveActionsToWorkbook,
  inspectionToWorkbook,
  workbookToBuffer,
} from '@/lib/export/workbooks'
import type {
  EventApprovalLevel,
  EventType,
  EventClassification,
  CorrectiveActionStatus,
  CorrectiveActionPriority,
} from '@/types/enums'
import type ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function param(v: string | null): string | undefined {
  return v && v.trim() ? v : undefined
}

function xlsxResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': XLSX_CONTENT_TYPE,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

export async function GET(request: NextRequest) {
  // Export builds an XLSX workbook on each call — throttle to deter abuse.
  const limited = enforceRateLimit(request, {
    name: 'export',
    limit: 10,
    windowMs: 60_000,
  })
  if (limited) return limited

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const stamp = new Date().toISOString().slice(0, 10)

  if (type === 'events') {
    const auth = await requirePermission('event:view')
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: 403 })

    const events = await getEvents({
      approval_level: param(searchParams.get('approval_level')) as
        | EventApprovalLevel
        | undefined,
      type: param(searchParams.get('event_type')) as EventType | undefined,
      classification: param(searchParams.get('classification')) as
        | EventClassification
        | undefined,
      project_id: param(searchParams.get('project_id')),
      site: param(searchParams.get('site')),
      date_from: param(searchParams.get('date_from')),
      date_to: param(searchParams.get('date_to')),
      search: param(searchParams.get('search')),
    })
    const wb = await eventsToWorkbook(events)
    return xlsxResponse(await workbookToBuffer(wb), `events-${stamp}.xlsx`)
  }

  if (type === 'corrective-actions') {
    const auth = await requirePermission('ca:view')
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: 403 })

    const actions = await getCorrectiveActions({
      status: param(searchParams.get('status')) as
        | CorrectiveActionStatus
        | undefined,
      priority: param(searchParams.get('priority')) as
        | CorrectiveActionPriority
        | undefined,
      project_id: param(searchParams.get('project_id')),
      event_id: param(searchParams.get('event_id')),
      inspection_id: param(searchParams.get('inspection_id')),
      overdue: searchParams.get('overdue') === '1',
      date_from: param(searchParams.get('date_from')),
      date_to: param(searchParams.get('date_to')),
      search: param(searchParams.get('search')),
    })
    const wb = await correctiveActionsToWorkbook(actions)
    return xlsxResponse(
      await workbookToBuffer(wb),
      `corrective-actions-${stamp}.xlsx`
    )
  }

  if (type === 'inspection') {
    const auth = await requirePermission('inspection:view')
    if (!auth.ok)
      return NextResponse.json({ error: auth.error }, { status: 403 })

    const id = param(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const inspection = await getInspectionById(id)
    if (!inspection)
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      )

    const [responses, template] = await Promise.all([
      getInspectionResponses(id),
      inspection.template
        ? Promise.resolve(inspection.template)
        : getTemplateById(inspection.template_id),
    ])
    const withTemplate: typeof inspection = {
      ...inspection,
      template: template ?? undefined,
    }
    const wb: ExcelJS.Workbook = await inspectionToWorkbook(
      withTemplate,
      responses
    )
    return xlsxResponse(
      await workbookToBuffer(wb),
      `inspection-${inspection.reference_number}.xlsx`
    )
  }

  return NextResponse.json({ error: 'Unknown export type' }, { status: 400 })
}
