'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitDsrRequest } from '@/lib/actions/dsr'
import { DSR_REQUEST_TYPES, type DsrRequestType } from '@/lib/constants/legal'

/**
 * Lets a signed-in user raise a PDPL Data Subject Request (access, copy,
 * correction, destruction — the actionable rights under Article 4). Submission
 * is server-stamped and audited; the user is told the statutory response window.
 */
export function DsrRequestDialog() {
  const t = useTranslations('profile.dsr')
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<DsrRequestType>('access')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const result = await submitDsrRequest({ type, note })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(t('submitted', { days: result.responseDays ?? 30 }))
    setNote('')
    setType('access')
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <User className="mr-2 h-4 w-4" />
        {t('trigger')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('typeLabel')}</Label>
              <Select
                value={type}
                onValueChange={(v) => v && setType(v as DsrRequestType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DSR_REQUEST_TYPES.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {t(`types.${rt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('noteLabel')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('notePlaceholder')}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submit')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
