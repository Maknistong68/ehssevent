'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth/auth-provider'
import { recordConsent } from '@/lib/actions/auth'
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/constants/legal'

/**
 * PDPL consent-lifecycle gate. If the signed-in user's stored consent version
 * is older than the currently published Terms / Privacy Policy version, this
 * blocks the app with a modal asking them to re-accept. When the versions
 * match (the normal case) it renders nothing.
 */
export function ReconsentGate() {
  const { profile, isImpersonating } = useAuth()
  const t = useTranslations('reconsent')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Don't interrupt an admin who is viewing-as another user — that consent
  // belongs to the impersonated subject, not the admin.
  if (!profile || isImpersonating || done) return null

  const needsReconsent =
    profile.terms_version !== CURRENT_TERMS_VERSION ||
    profile.privacy_version !== CURRENT_PRIVACY_VERSION

  if (!needsReconsent) return null

  const handleAccept = async () => {
    setSubmitting(true)
    const result = await recordConsent()
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(t('accepted'))
    // Optimistically dismiss; the next full load will carry the updated
    // version from the (production) profile.
    setDone(true)
  }

  return (
    // Controlled with no onOpenChange + no close button: re-consent is mandatory
    // before the user can continue (the dialog cannot be dismissed away).
    <Dialog open>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <Link
            href="/terms-of-service"
            target="_blank"
            className="block text-primary underline underline-offset-4"
          >
            {t('reviewTerms')}
          </Link>
          <Link
            href="/privacy-policy"
            target="_blank"
            className="block text-primary underline underline-offset-4"
          >
            {t('reviewPrivacy')}
          </Link>
        </div>

        <Button onClick={handleAccept} disabled={submitting} className="w-full">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('accept')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
