import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - Event Report',
}

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective Date: January 1, 2025 &middot; Version 1.0
          </p>

          <p>
            This Privacy Policy describes how OXAGON Port Development (&quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your
            personal data when you use the Event Report HSE Management System
            (&quot;the Service&quot;). This policy complies with the Kingdom of Saudi
            Arabia&apos;s Personal Data Protection Law (PDPL) issued by Royal Decree
            M/19, dated 9/2/1443H.
          </p>

          <h2 className="font-heading text-lg font-semibold">1. Data We Collect</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Account information: full name, email address, organization affiliation, role</li>
            <li>Event reports: incident descriptions, dates, locations, GPS coordinates</li>
            <li>Photographs: images of incidents, hazards, inspections, and corrective actions</li>
            <li>Usage data: login timestamps, actions performed within the system</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold">2. Purposes of Processing</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>HSE incident tracking, investigation, and regulatory compliance</li>
            <li>Reporting obligations under Saudi Labor Law and GOSI regulations</li>
            <li>Corrective action management and inspection workflows</li>
            <li>Statistical analysis for workplace safety improvement</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold">3. Legal Basis</h2>
          <p className="text-sm">
            We process your data based on: (a) your explicit consent provided at
            registration; (b) compliance with legal obligations under Saudi Labor Law,
            GOSI regulations, and OSHA requirements; (c) legitimate interest in
            maintaining workplace health and safety.
          </p>

          <h2 className="font-heading text-lg font-semibold">4. Data Retention</h2>
          <p className="text-sm">
            Personal data is retained for the duration of your employment relationship
            with the contracting organization plus 5 years, or as required by applicable
            Saudi regulations. Incident records are retained for a minimum of 10 years
            as required by Saudi Labor Law.
          </p>

          <h2 className="font-heading text-lg font-semibold">5. Cross-Border Data Disclosure</h2>
          <p className="text-sm">
            The Service uses cloud infrastructure that may process data outside the
            Kingdom of Saudi Arabia. Any cross-border transfer complies with PDPL
            Article 29 requirements, including adequate data protection safeguards in
            the receiving jurisdiction.
          </p>

          <h2 className="font-heading text-lg font-semibold">6. Your Rights Under PDPL</h2>
          <p className="text-sm">
            Under Article 4 of the PDPL, as a data subject you have the right to:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Be informed about the legal basis and purposes of collecting your personal data</li>
            <li>Access your personal data held by us</li>
            <li>Obtain a copy of your personal data in a readable, commonly used format</li>
            <li>Request correction of inaccurate, incomplete, or outdated personal data</li>
            <li>Request destruction of your personal data (subject to legal retention requirements)</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold">7. Data Protection Officer</h2>
          <p className="text-sm">
            For questions, access requests, or complaints regarding your personal data,
            contact our Data Protection Officer:
          </p>
          <p className="text-sm font-medium">
            Email: dpo@oxagonport.sa<br />
            Phone: +966-XX-XXX-XXXX<br />
            Address: OXAGON Port Development, NEOM, Kingdom of Saudi Arabia
          </p>

          <h2 className="font-heading text-lg font-semibold">8. Changes to This Policy</h2>
          <p className="text-sm">
            We may update this policy to reflect changes in our practices or legal
            requirements. You will be notified of material changes and asked to
            re-consent where required by PDPL.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
