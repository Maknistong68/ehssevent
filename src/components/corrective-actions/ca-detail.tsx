'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { CaStatusBadge } from './ca-status-badge'
import { OverdueBadge } from './overdue-badge'
import { isCorrectiveActionOverdue } from '@/lib/utils/corrective-actions'
import { Can } from '@/components/shared/role-gate'
import { PhotoUpload } from '@/components/shared/photo-upload'
import {
  updateCorrectiveActionStatus,
  updateCorrectiveAction,
} from '@/lib/actions/corrective-actions'
import {
  ArrowLeft,
  User,
  ShieldCheck,
  CalendarDays,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Pencil,
} from 'lucide-react'
import { format } from 'date-fns'
import type { CorrectiveAction } from '@/types/database'
import {
  CA_PRIORITY_LABELS,
  type CorrectiveActionStatus,
  type CorrectiveActionPriority,
} from '@/types/enums'
import type { AssignableUser } from '@/lib/queries/users'
import type { AuditLogEntry } from '@/lib/queries/audit'
import { AuditTimeline } from '@/components/audit/audit-timeline'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'

interface CaDetailProps {
  correctiveAction: CorrectiveAction
  currentUserId: string
  isAdmin: boolean
  users: AssignableUser[]
  auditLog: AuditLogEntry[]
}

export function CaDetail({
  correctiveAction,
  currentUserId,
  isAdmin,
  users,
  auditLog,
}: CaDetailProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  // Capture "now" once at mount so the render stays pure across re-renders.
  const [now] = useState(() => Date.now())
  const router = useRouter()

  const ca0 = correctiveAction
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(ca0.title)
  const [editDescription, setEditDescription] = useState(ca0.description ?? '')
  const [editAssignedTo, setEditAssignedTo] = useState(ca0.assigned_to)
  const [editPriority, setEditPriority] = useState<CorrectiveActionPriority>(
    ca0.priority
  )
  const [editDueDate, setEditDueDate] = useState(
    ca0.due_date ? ca0.due_date.slice(0, 10) : ''
  )

  const startEdit = () => {
    setError('')
    setEditTitle(ca0.title)
    setEditDescription(ca0.description ?? '')
    setEditAssignedTo(ca0.assigned_to)
    setEditPriority(ca0.priority)
    setEditDueDate(ca0.due_date ? ca0.due_date.slice(0, 10) : '')
    setEditing(true)
  }

  const saveEdit = async () => {
    setError('')
    setLoading(true)
    const result = await updateCorrectiveAction({
      corrective_action_id: ca0.id,
      title: editTitle,
      description: editDescription || undefined,
      assigned_to: editAssignedTo,
      priority: editPriority,
      due_date: editDueDate || undefined,
    })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setEditing(false)
    router.refresh()
  }

  const ca = correctiveAction
  const creator = ca.creator
  const assignee = ca.assignee
  const approver = ca.approver
  const event = ca.event
  const inspection = ca.inspection

  const isAssignee = ca.assigned_to === currentUserId
  const isApprover = ca.approver_id === currentUserId
  const canApprove = isApprover || isAdmin

  const changeStatus = async (
    status: CorrectiveActionStatus,
    options?: { reason?: string; photoUrls?: string[] }
  ) => {
    setError('')
    setLoading(true)
    const result = await updateCorrectiveActionStatus({
      corrective_action_id: ca.id,
      status,
      rejection_reason: options?.reason,
      photo_urls: options?.photoUrls,
    })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setShowReject(false)
    setRejectionReason('')
    setPhotos([])
    router.refresh()
  }

  // The responsible person can start work on an open action.
  const showStart = isAssignee && ca.status === 'open'
  // The responsible person uploads evidence to submit for approval.
  const showSubmit =
    isAssignee &&
    (ca.status === 'open' ||
      ca.status === 'in_progress' ||
      ca.status === 'rejected')
  const showApproveReject = canApprove && ca.status === 'pending_approval'

  const overdue = isCorrectiveActionOverdue(ca, now)

  const hasActions = showStart || showSubmit || showApproveReject

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/corrective-actions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-soft transition-colors hover:text-foreground"
          aria-label="Back to corrective actions"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground">
            {ca.reference_number}
          </p>
          <h1 className="font-heading text-xl font-bold tracking-tight">
            {ca.title}
          </h1>
        </div>
        {ca.status !== 'approved' && !editing && (
          <Can permission="ca:create">
            <Button
              variant="outline"
              size="sm"
              onClick={startEdit}
              data-icon="inline-start"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Can>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CaStatusBadge status={ca.status} />
        {overdue && <OverdueBadge />}
        {event?.reference_number && (
          <Link href={`/events/${ca.event_id}`}>
            <Button variant="outline" size="sm">
              <FileText className="mr-1 h-3.5 w-3.5" />
              {event.reference_number}
            </Button>
          </Link>
        )}
        {inspection?.reference_number && (
          <Link href={`/inspections/${ca.inspection_id}`}>
            <Button variant="outline" size="sm">
              <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
              {inspection.reference_number}
            </Button>
          </Link>
        )}
      </div>

      {ca.inspection_id && ca.item_label && (
        <div className="rounded-2xl border border-input bg-secondary/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Source: inspection item —{' '}
          </span>
          <span className="font-medium">{ca.item_label}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {ca.status === 'rejected' && ca.rejection_reason && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm font-semibold text-destructive">Rejected</p>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {ca.rejection_reason}
          </p>
        </div>
      )}

      {editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit Corrective Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Corrective Action *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Brief description of the corrective action"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="What needs to be done to correct the issue..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Responsible Person *</Label>
              <Select
                value={editAssignedTo}
                onValueChange={(v) => setEditAssignedTo(v ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select responsible person" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editPriority}
                  onValueChange={(v) =>
                    setEditPriority((v ?? 'medium') as CorrectiveActionPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        CA_PRIORITY_LABELS
                      ) as CorrectiveActionPriority[]
                    ).map((p) => (
                      <SelectItem key={p} value={p}>
                        {CA_PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <DatePicker
                  id="edit-due-date"
                  value={editDueDate}
                  onChange={setEditDueDate}
                  placeholder="Select due date"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={
                  loading || editTitle.trim().length < 3 || !editAssignedTo
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!editing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ca.description && (
              <p className="text-sm whitespace-pre-wrap">{ca.description}</p>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3 text-sm">
              {creator && (
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Created By</p>
                    <p className="text-muted-foreground">
                      {creator.full_name || creator.email}
                    </p>
                  </div>
                </div>
              )}

              {assignee && (
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Responsible Person</p>
                    <p className="text-muted-foreground">
                      {assignee.full_name || assignee.email}
                    </p>
                  </div>
                </div>
              )}

              {approver && (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Approver</p>
                    <p className="text-muted-foreground">
                      {approver.full_name || approver.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">
                    {format(new Date(ca.created_at), 'dd MMM yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Priority</p>
                  <p className="text-muted-foreground">
                    {CA_PRIORITY_LABELS[ca.priority]}
                  </p>
                </div>
              </div>

              {ca.due_date && (
                <div className="flex items-start gap-2">
                  <CalendarDays
                    className={
                      overdue
                        ? 'mt-0.5 h-4 w-4 text-red-600'
                        : 'mt-0.5 h-4 w-4 text-muted-foreground'
                    }
                  />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p
                      className={
                        overdue ? 'text-red-600' : 'text-muted-foreground'
                      }
                    >
                      {format(new Date(ca.due_date), 'dd MMM yyyy')}
                      {overdue && ' · Overdue'}
                    </p>
                  </div>
                </div>
              )}

              {ca.completed_at && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Submitted</p>
                    <p className="text-muted-foreground">
                      {format(new Date(ca.completed_at), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {ca.approved_at && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Approved</p>
                    <p className="text-muted-foreground">
                      {format(new Date(ca.approved_at), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {ca.photo_urls && ca.photo_urls.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {ca.photo_urls.map((url, i) => (
                <div
                  key={i}
                  className="relative h-24 w-24 overflow-hidden rounded-2xl border"
                >
                  <Image
                    src={toSecurePhotoUrl(url)}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasActions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {showStart && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Mark this corrective action as in progress to signal that work
                  has started.
                </p>
                <Button
                  variant="outline"
                  onClick={() => changeStatus('in_progress')}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Work
                </Button>
              </div>
            )}

            {showSubmit && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload evidence of the completed corrective action, then
                  submit it for approval.
                </p>
                <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
                <Button
                  onClick={() =>
                    changeStatus('pending_approval', { photoUrls: photos })
                  }
                  disabled={loading || photos.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit for Approval
                </Button>
              </div>
            )}

            {showApproveReject && !showReject && (
              <Can permission="ca:approve">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => changeStatus('approved')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReject(true)}
                    disabled={loading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </Can>
            )}

            {showApproveReject && showReject && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for rejection..."
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReject(false)
                      setRejectionReason('')
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      changeStatus('rejected', { reason: rejectionReason })
                    }
                    disabled={loading || rejectionReason.trim().length === 0}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            entries={auditLog}
            emptyMessage="No activity recorded for this corrective action yet."
          />
        </CardContent>
      </Card>
    </div>
  )
}
