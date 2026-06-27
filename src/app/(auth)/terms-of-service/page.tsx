import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import {
  LEGAL_ENTITY_NAME,
  LEGAL_EMAIL,
  DPO_ADDRESS,
  CURRENT_TERMS_VERSION,
} from '@/lib/constants/legal'

export const metadata = {
  title: 'Terms of Service - Event Report',
}

interface Section {
  heading: string
  body?: string[]
  list?: string[]
}

interface LegalDoc {
  back: string
  title: string
  effective: string
  sections: Section[]
}

// NOTE (B7): the Arabic copy is a good-faith translation so the terms are
// understandable to KSA workers; like the English copy it is subject to
// qualified legal review and sign-off before live processing.
function content(locale: string): LegalDoc {
  if (locale === 'ar') {
    return {
      back: 'العودة إلى التسجيل',
      title: 'شروط الخدمة',
      effective: `تاريخ النفاذ: 1 يناير 2025 · الإصدار ${CURRENT_TERMS_VERSION}`,
      sections: [
        {
          heading: '1. قبول الشروط',
          body: [
            'بإنشائك حساباً واستخدامك لنظام Event Report لإدارة الصحة والسلامة والبيئة ("الخدمة"), فإنك توافق على الالتزام بشروط الخدمة هذه. وإذا لم توافق, فلا تستخدم الخدمة. ويُعدّ استمرارك في الاستخدام قبولاً لأي تحديثات على هذه الشروط.',
          ],
        },
        {
          heading: '2. وصف الخدمة',
          body: [
            `الخدمة منصّةٌ للإبلاغ عن حوادث الصحة والسلامة والبيئة (HSE) مقدّمة من ${LEGAL_ENTITY_NAME} لاستخدام الموظفين والمقاولين المصرّح لهم العاملين في مشاريع الإنشاء ضمن نطاق التطوير المعني. وتتيح الخدمة الإبلاغ عن الحوادث وتتبّع الإجراءات التصحيحية وعمليات التفتيش على السلامة وتوثيق الامتثال التنظيمي.`,
          ],
        },
        {
          heading: '3. مسؤوليات المستخدم',
          list: [
            'تقديم معلومات دقيقة وصحيحة في جميع البلاغات والمدخلات',
            'الإبلاغ عن الحوادث فوراً ضمن المهل التنظيمية المطلوبة',
            'المحافظة على سرية بيانات اعتماد حسابك',
            'استخدام الخدمة فقط لأغراض إدارة الصحة والسلامة والبيئة المقصودة',
            'عدم مشاركة الصور أو البيانات من الخدمة مع أطراف غير مصرّح لها',
            'الالتزام بجميع الأنظمة السعودية المعمول بها بشأن السلامة في مكان العمل',
          ],
        },
        {
          heading: '4. ملكية البيانات',
          body: [
            `جميع البيانات المُدخَلة في الخدمة, بما في ذلك بلاغات الحوادث والصور وسجلات التفتيش, مملوكة لـ ${LEGAL_ENTITY_NAME}. ولا يحتفظ المستخدمون بأي حقوق ملكية على البيانات المُقدَّمة عبر الخدمة. وقد تُشارَك البيانات مع الجهات التنظيمية وفق ما يقتضيه النظام.`,
          ],
        },
        {
          heading: '5. السرية',
          body: [
            'قد تتضمّن المعلومات التي يتم الوصول إليها عبر الخدمة معلومات تجارية سرّية وبيانات شخصية حسّاسة. ويجب على المستخدمين عدم إفشاء أو نسخ أو توزيع أي معلومات يتم الحصول عليها عبر الخدمة إلا بالقدر اللازم لأداء واجباتهم المصرّح بها في مجال الصحة والسلامة والبيئة.',
          ],
        },
        {
          heading: '6. إنهاء الحساب',
          body: [
            'نحتفظ بالحق في تعليق حسابك أو إنهائه إذا خالفت هذه الشروط, أو لم تعد مصرّحاً لك من جهة عملك, أو أسأت استخدام الخدمة. وعند الإنهاء يُلغى وصولك, ولكن يُحتفظ بالبيانات التي قدّمتها وفق سياسة الاحتفاظ بالبيانات لدينا.',
          ],
        },
        {
          heading: '7. تحديد المسؤولية',
          body: [
            'تُقدَّم الخدمة "كما هي" لأغراض إدارة الصحة والسلامة والبيئة. ولا نتحمّل المسؤولية عن القرارات المتّخذة بناءً على البيانات الموجودة في النظام, ولا عن أي أضرار غير مباشرة أو عرضية أو تبعية تنشأ عن استخدام الخدمة أو تعذّر استخدامها.',
          ],
        },
        {
          heading: '8. النظام الواجب التطبيق',
          body: [
            'تخضع شروط الخدمة هذه وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية. وتكون المحاكم المختصة في المملكة العربية السعودية صاحبة الاختصاص الحصري في أي نزاعات تنشأ عن هذه الشروط.',
          ],
        },
        {
          heading: '9. التواصل',
          body: [
            'للأسئلة المتعلقة بهذه الشروط, يُرجى التواصل عبر:',
            `البريد الإلكتروني: ${LEGAL_EMAIL}`,
            `العنوان: ${DPO_ADDRESS}`,
          ],
        },
      ],
    }
  }

  return {
    back: 'Back to sign up',
    title: 'Terms of Service',
    effective: `Effective Date: January 1, 2025 · Version ${CURRENT_TERMS_VERSION}`,
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: [
          'By creating an account and using the Event Report HSE Management System ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. Your continued use constitutes acceptance of any updates to these terms.',
        ],
      },
      {
        heading: '2. Service Description',
        body: [
          `The Service is a health, safety, and environment (HSE) incident reporting platform provided by ${LEGAL_ENTITY_NAME} for use by authorized employees and contractors working on construction projects within the relevant development. The Service enables event reporting, corrective action tracking, safety inspections, and regulatory compliance documentation.`,
        ],
      },
      {
        heading: '3. User Responsibilities',
        list: [
          'Provide accurate and truthful information in all reports and submissions',
          'Report incidents promptly within the required regulatory timeframes',
          'Maintain the confidentiality of your account credentials',
          'Use the Service only for its intended HSE management purposes',
          'Not share photographs or data from the Service with unauthorized parties',
          'Comply with all applicable Saudi regulations regarding workplace safety',
        ],
      },
      {
        heading: '4. Data Ownership',
        body: [
          `All data entered into the Service, including event reports, photographs, and inspection records, is owned by ${LEGAL_ENTITY_NAME}. Users retain no proprietary rights to data submitted through the Service. Data may be shared with regulatory authorities as required by law.`,
        ],
      },
      {
        heading: '5. Confidentiality',
        body: [
          'Information accessed through the Service may contain confidential business information and sensitive personal data. Users must not disclose, copy, or distribute any information obtained through the Service except as required for their authorized HSE duties.',
        ],
      },
      {
        heading: '6. Account Termination',
        body: [
          'We reserve the right to suspend or terminate your account if you violate these terms, are no longer authorized by your employer, or misuse the Service. Upon termination, your access will be revoked but data you submitted will be retained per our data retention policy.',
        ],
      },
      {
        heading: '7. Limitation of Liability',
        body: [
          'The Service is provided "as is" for HSE management purposes. We are not liable for decisions made based on data in the system, nor for any indirect, incidental, or consequential damages arising from the use or inability to use the Service.',
        ],
      },
      {
        heading: '8. Governing Law',
        body: [
          'These Terms of Service are governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts in the Kingdom of Saudi Arabia.',
        ],
      },
      {
        heading: '9. Contact',
        body: [
          'For questions regarding these terms, contact:',
          `Email: ${LEGAL_EMAIL}`,
          `Address: ${DPO_ADDRESS}`,
        ],
      },
    ],
  }
}

export default async function TermsOfServicePage() {
  const locale = await getLocale()
  const doc = content(locale)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <div className="mx-auto max-w-2xl space-y-4" dir={dir}>
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {doc.back}
      </Link>

      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 space-y-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {doc.title}
          </h1>
          <p className="text-sm text-muted-foreground">{doc.effective}</p>

          {doc.sections.map((section, i) => (
            <section key={`section-${i}`} className="space-y-2">
              <h2 className="font-heading text-lg font-semibold">
                {section.heading}
              </h2>
              {section.body?.map((p, j) => (
                <p key={`body-${i}-${j}`} className="text-sm">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {section.list.map((item, j) => (
                    <li key={`list-${i}-${j}`}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
