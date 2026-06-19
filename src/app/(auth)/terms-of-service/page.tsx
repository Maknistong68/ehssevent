import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - Event Report',
}

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign up
      </Link>

      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: January 1, 2025 &middot; Version 1.0
          </p>

          <h2 className="font-heading text-lg font-semibold">1. Acceptance of Terms</h2>
          <p className="text-sm">
            By creating an account and using the Event Report HSE Management System
            (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
            If you do not agree, do not use the Service. Your continued use constitutes
            acceptance of any updates to these terms.
          </p>

          <h2 className="font-heading text-lg font-semibold">2. Service Description</h2>
          <p className="text-sm">
            The Service is a health, safety, and environment (HSE) incident reporting
            platform provided by OXAGON Port Development for use by authorized
            employees and contractors working on construction projects within the
            OXAGON development. The Service enables event reporting, corrective action
            tracking, safety inspections, and regulatory compliance documentation.
          </p>

          <h2 className="font-heading text-lg font-semibold">3. User Responsibilities</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Provide accurate and truthful information in all reports and submissions</li>
            <li>Report incidents promptly within the required regulatory timeframes</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Use the Service only for its intended HSE management purposes</li>
            <li>Not share photographs or data from the Service with unauthorized parties</li>
            <li>Comply with all applicable Saudi regulations regarding workplace safety</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold">4. Data Ownership</h2>
          <p className="text-sm">
            All data entered into the Service, including event reports, photographs,
            and inspection records, is owned by OXAGON Port Development. Users retain
            no proprietary rights to data submitted through the Service. Data may be
            shared with regulatory authorities as required by law.
          </p>

          <h2 className="font-heading text-lg font-semibold">5. Confidentiality</h2>
          <p className="text-sm">
            Information accessed through the Service may contain confidential business
            information and sensitive personal data. Users must not disclose, copy, or
            distribute any information obtained through the Service except as required
            for their authorized HSE duties.
          </p>

          <h2 className="font-heading text-lg font-semibold">6. Account Termination</h2>
          <p className="text-sm">
            We reserve the right to suspend or terminate your account if you violate
            these terms, are no longer authorized by your employer, or misuse the
            Service. Upon termination, your access will be revoked but data you
            submitted will be retained per our data retention policy.
          </p>

          <h2 className="font-heading text-lg font-semibold">7. Limitation of Liability</h2>
          <p className="text-sm">
            The Service is provided &quot;as is&quot; for HSE management purposes. We
            are not liable for decisions made based on data in the system, nor for any
            indirect, incidental, or consequential damages arising from the use or
            inability to use the Service.
          </p>

          <h2 className="font-heading text-lg font-semibold">8. Governing Law</h2>
          <p className="text-sm">
            These Terms of Service are governed by and construed in accordance with
            the laws of the Kingdom of Saudi Arabia. Any disputes arising from these
            terms shall be subject to the exclusive jurisdiction of the competent
            courts in the Kingdom of Saudi Arabia.
          </p>

          <h2 className="font-heading text-lg font-semibold">9. Contact</h2>
          <p className="text-sm font-medium">
            For questions regarding these terms, contact:<br />
            Email: legal@oxagonport.sa<br />
            Address: OXAGON Port Development, NEOM, Kingdom of Saudi Arabia
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
