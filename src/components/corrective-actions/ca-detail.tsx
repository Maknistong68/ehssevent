'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CaStatusBadge } from './ca-status-badge'
import { CaPriorityBadge } from './ca-priority-badge'
import { updateCorrectiveActionStatus } from '@/lib/actions/corrective-actions'
import {
  ArrowLeft,
  MapPin,
  User,
  ShieldCheck,
  CalendarDays,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import type { CorrectiveAction } from '@/types/database'
import type { CorrectiveActionStatus } from '@/types/enums'
import { toSecurePhotoUrl } from '@/lib/utils/photo-url'

interface CaDetailProps {
  correctiveAction: CorrectiveAction
  currentUserId: string
  isAdmin: boolean
}

export function CaDetail({ correctiveAction, currentUserId, isAdmin }: CaDetailProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()

  const ca = correctiveAction
  const project = ca.project
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
    reason?: string
  ) => {
    setError('')
    setLoading(true)
    const result = await updateCorrectiveActionStatus({
      corrective_action_id: ca.id,
      status,
      rejection_reason: reason,
    })
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setShowReject(false)
    setRejectionReason('')
    router.refresh()
  }

  const showStart = isAssignee && ca.status === 'open'
  const showSubmit = isAssignee && ca.status === 'in_progress'
  const showRestart = isAssignee && ca.status === 'rejected'
  const showApproveReject = canApprove && ca.status === 'pending_approval'

  const hasActions = showStart || showSubmit || showRestart || showApproveReject

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
          <p className="font-mono text-xs text-muted-foreground">{ca.reference_number}</p>
          <h1 className="font-heading text-xl font-bold tracking-tight">{ca.title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CaStatusBadge status={ca.status} />
        <CaPriorityBadge priority={ca.priority} />
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
          <span className="text-muted-foreground">Source: inspection item — </span>
          <span className="font-medium">{ca.item_label}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
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
            {project && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Project</p>
                  <p className="text-muted-foreground">{project.name}</p>
                </div>
              </div>
            )}

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

            {ca.due_date && (
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Due Date</p>
                  <p className="text-muted-foreground">
                    {format(new Date(ca.due_date), 'dd MMM yyyy')}
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
                  <Image src={toSecurePhotoUrl(url)} alt={`Photo ${i + 1}`} fill className="object-cover" />
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
            {!showReject && (
              <div className="flex flex-wrap gap-2">
                {showStart && (
                  <Button
                    onClick={() => changeStatus('in_progress')}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start
                  </Button>
                )}
                {showSubmit && (
                  <Button
                    onClick={() => changeStatus('pending_approval')}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Approval
                  </Button>
                )}
                {showRestart && (
                  <Button
                    variant="outline"
                    onClick={() => changeStatus('in_progress')}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resume Work
                  </Button>
                )}
                {showApproveReject && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {showReject && (
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
                    onClick={() => changeStatus('rejected', rejectionReason)}
                    disabled={loading || rejectionReason.trim().length === 0}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
