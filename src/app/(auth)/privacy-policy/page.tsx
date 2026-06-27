import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import {
  LEGAL_ENTITY_NAME,
  DPO_EMAIL,
  DPO_PHONE,
  DPO_ADDRESS,
  CURRENT_PRIVACY_VERSION,
} from '@/lib/constants/legal'

export const metadata = {
  title: 'Privacy Policy - Event Report',
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
  intro: string[]
  sections: Section[]
}

// NOTE (B7): the Arabic copy below is a good-faith translation provided so the
// notice is understandable to KSA workers in their language. Like the English
// copy, it is subject to qualified legal / DPO review and sign-off before live
// processing (see docs and the pre-production audit). The legal *substance* —
// lawful basis = legal obligation, In-Kingdom residency, 10-yr incident
// retention with lawful refusal of premature erasure — is mirrored in both.
function content(locale: string): LegalDoc {
  if (locale === 'ar') {
    return {
      back: 'العودة إلى التسجيل',
      title: 'سياسة الخصوصية',
      effective: `تاريخ النفاذ: 1 يناير 2025 · الإصدار ${CURRENT_PRIVACY_VERSION}`,
      intro: [
        `توضّح سياسة الخصوصية هذه كيف تقوم ${LEGAL_ENTITY_NAME} ("نحن") بجمع بياناتك الشخصية واستخدامها وحمايتها عند استخدامك لنظام Event Report لإدارة الصحة والسلامة والبيئة ("الخدمة"). تتوافق هذه السياسة مع نظام حماية البيانات الشخصية في المملكة العربية السعودية (PDPL) الصادر بالمرسوم الملكي رقم م/19 بتاريخ 9/2/1443هـ.`,
      ],
      sections: [
        {
          heading: '1. البيانات التي نجمعها',
          list: [
            'معلومات الحساب: الاسم الكامل، البريد الإلكتروني، جهة العمل، الدور الوظيفي',
            'بلاغات الحوادث: وصف الحادث، التواريخ، المواقع، الإحداثيات الجغرافية',
            'الصور: صور الحوادث والمخاطر وعمليات التفتيش والإجراءات التصحيحية',
            'بيانات الاستخدام: أوقات تسجيل الدخول والإجراءات المنفّذة داخل النظام',
          ],
        },
        {
          heading: '2. أغراض المعالجة',
          list: [
            'تتبّع حوادث الصحة والسلامة والبيئة والتحقيق فيها والامتثال التنظيمي',
            'الوفاء بالالتزامات النظامية بموجب نظام العمل السعودي وأنظمة التأمينات الاجتماعية (GOSI)',
            'إدارة الإجراءات التصحيحية وسير عمل عمليات التفتيش',
            'التحليل الإحصائي لتحسين السلامة في مكان العمل',
          ],
        },
        {
          heading: '3. الأساس النظامي للمعالجة',
          body: [
            'لا نعتمد على موافقتك لمعالجة بيانات حوادث العمل أو الإصابات أو البيانات الصحية. فالإبلاغ عن حوادث الصحة والسلامة والبيئة والاحتفاظ بسجلاتها التزامٌ نظاميٌّ يقع على عاتق صاحب العمل بموجب نظام العمل السعودي ولوائحه التنفيذية للسلامة والصحة المهنية وأنظمة التأمينات الاجتماعية. ونظراً لطبيعة العلاقة بين صاحب العمل والموظف، فإن الموافقة لا تُعدّ حرّة، وبالتالي ليست الأساس النظامي لهذه المعالجة.',
            'وبناءً على ذلك: تُعالَج بيانات الحوادث والإصابات والبيانات الصحية والصور المرتبطة بها للوفاء بهذه الالتزامات النظامية؛ ويُسجِّل قبولك عند التسجيل أنك قد أُحطت علماً بهذه المعالجة (حق المعرفة بموجب النظام) وليس أساساً نظامياً لها؛ كما تُعالَج مجموعة محدودة من بيانات الحساب (اسم المستخدم والبريد الإلكتروني) لتشغيل حسابك والتحقق من هويتك.',
            'ولأن سجلات الحوادث يُحتفظ بها للوفاء بالتزام نظامي بالاحتفاظ، فقد يُرفَض نظاماً طلب محوها طوال مدة الاحتفاظ (انظر القسم 4).',
          ],
        },
        {
          heading: '4. الاحتفاظ بالبيانات وإتلافها',
          body: [
            'يُحتفظ بسجلات حوادث العمل — بما في ذلك الأوصاف والتواريخ والمواقع والصور — لمدة لا تقل عن 10 سنوات وفقاً لما يقتضيه نظام العمل السعودي، ثم تُتلَف بشكل آمن ويُدوَّن الإتلاف في سجل التدقيق لدينا. ويُحتفظ ببيانات الحساب طوال مدة صلاحية وصولك المصرّح به مضافاً إليها المدة المحدودة التي تقتضيها الأنظمة المعمول بها. وحين تطلب إتلاف بيانات يلزمنا الاحتفاظ بها نظاماً، فإننا نحترم حقك بتسجيل الطلب وإبلاغك بالأساس النظامي للاحتفاظ بها حتى انقضاء المدة النظامية.',
          ],
        },
        {
          heading: '5. موقع البيانات (داخل المملكة)',
          body: [
            'تُستضاف بياناتك الشخصية وتُعالَج — بما في ذلك سجلات الحوادث والصور والنسخ الاحتياطية والسجلات — داخل المملكة العربية السعودية. ولا ننقل هذه البيانات خارج المملكة. وإذا أصبح أي نقل خارج الحدود ضرورياً في أي وقت، فلن يتم إلا وفقاً للمادة 29 من النظام ولائحته التنفيذية.',
          ],
        },
        {
          heading: '6. حقوقك بموجب النظام',
          body: ['بموجب المادة 4 من النظام، يحق لك بصفتك صاحب البيانات:'],
          list: [
            'أن تُحاط علماً بالأساس النظامي لجمع بياناتك الشخصية وأغراضه',
            'الوصول إلى بياناتك الشخصية المحفوظة لدينا',
            'الحصول على نسخة من بياناتك الشخصية بصيغة مقروءة وشائعة الاستخدام',
            'طلب تصحيح البيانات الشخصية غير الدقيقة أو الناقصة أو القديمة',
            'طلب إتلاف بياناتك الشخصية (مع مراعاة متطلبات الاحتفاظ النظامية)',
          ],
        },
        {
          heading: '7. مسؤول حماية البيانات',
          body: [
            'للأسئلة أو طلبات الوصول أو الشكاوى المتعلقة ببياناتك الشخصية، يُرجى التواصل مع مسؤول حماية البيانات لدينا:',
            `البريد الإلكتروني: ${DPO_EMAIL}`,
            `الهاتف: ${DPO_PHONE}`,
            `العنوان: ${DPO_ADDRESS}`,
          ],
        },
        {
          heading: '8. التعديلات على هذه السياسة',
          body: [
            'قد نُحدّث هذه السياسة لتعكس تغييرات في ممارساتنا أو في المتطلبات النظامية. وسيتم إشعارك بالتغييرات الجوهرية ومطالبتك بالإقرار من جديد عند الاقتضاء بموجب النظام.',
          ],
        },
      ],
    }
  }

  return {
    back: 'Back to sign up',
    title: 'Privacy Policy',
    effective: `Effective Date: January 1, 2025 · Version ${CURRENT_PRIVACY_VERSION}`,
    intro: [
      `This Privacy Policy describes how ${LEGAL_ENTITY_NAME} ("we", "us", or "our") collects, uses, and protects your personal data when you use the Event Report HSE Management System ("the Service"). This policy complies with the Kingdom of Saudi Arabia's Personal Data Protection Law (PDPL) issued by Royal Decree M/19, dated 9/2/1443H.`,
    ],
    sections: [
      {
        heading: '1. Data We Collect',
        list: [
          'Account information: full name, email address, organization affiliation, role',
          'Event reports: incident descriptions, dates, locations, GPS coordinates',
          'Photographs: images of incidents, hazards, inspections, and corrective actions',
          'Usage data: login timestamps, actions performed within the system',
        ],
      },
      {
        heading: '2. Purposes of Processing',
        list: [
          'HSE incident tracking, investigation, and regulatory compliance',
          'Reporting obligations under Saudi Labor Law and GOSI regulations',
          'Corrective action management and inspection workflows',
          'Statistical analysis for workplace safety improvement',
        ],
      },
      {
        heading: '3. Legal Basis for Processing',
        body: [
          'We do not rely on your consent to process workplace incident, injury, or health data. Reporting and retaining occupational health, safety, and environment (HSE) incidents is a legal obligation of the employer under the Saudi Labor Law, its occupational safety and health executive regulations, and GOSI requirements. Because of the employer–employee relationship, consent would not be freely given and is therefore not the lawful basis for this processing.',
          'Accordingly: incident, injury, and health data — and related photographs — are processed to comply with these legal obligations; your acceptance at registration records that you have been informed of this processing (the PDPL right to be informed), and is not the legal basis for it; and a limited set of account data (your username and contact email) is processed to operate your account and authenticate you.',
          'Because incident records are kept to satisfy a statutory retention obligation, a request to erase them may be lawfully refused for the duration of the retention period (see Section 4).',
        ],
      },
      {
        heading: '4. Data Retention and Destruction',
        body: [
          'Workplace incident records — including descriptions, dates, locations, and photographs — are retained for at least 10 years as required by Saudi labor law, after which they are securely destroyed and the destruction is recorded in our audit log. Account data is kept for the duration of your authorized access plus a limited period required by applicable regulations. Where you request destruction of data we are legally required to retain, we honor your right by recording the request and informing you of the lawful basis for retaining it until the statutory period elapses.',
        ],
      },
      {
        heading: '5. Data Location (In-Kingdom)',
        body: [
          'Your personal data — including incident records, photographs, backups, and logs — is hosted and processed within the Kingdom of Saudi Arabia. We do not transfer this data outside the Kingdom. Should any cross-border transfer ever become necessary, it will be carried out only in accordance with PDPL Article 29 and its Implementing Regulations.',
        ],
      },
      {
        heading: '6. Your Rights Under PDPL',
        body: [
          'Under Article 4 of the PDPL, as a data subject you have the right to:',
        ],
        list: [
          'Be informed about the legal basis and purposes of collecting your personal data',
          'Access your personal data held by us',
          'Obtain a copy of your personal data in a readable, commonly used format',
          'Request correction of inaccurate, incomplete, or outdated personal data',
          'Request destruction of your personal data (subject to legal retention requirements)',
        ],
      },
      {
        heading: '7. Data Protection Officer',
        body: [
          'For questions, access requests, or complaints regarding your personal data, contact our Data Protection Officer:',
          `Email: ${DPO_EMAIL}`,
          `Phone: ${DPO_PHONE}`,
          `Address: ${DPO_ADDRESS}`,
        ],
      },
      {
        heading: '8. Changes to This Policy',
        body: [
          'We may update this policy to reflect changes in our practices or legal requirements. You will be notified of material changes and asked to re-acknowledge where required by PDPL.',
        ],
      },
    ],
  }
}

export default async function PrivacyPolicyPage() {
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

          {doc.intro.map((p, i) => (
            <p key={`intro-${i}`}>{p}</p>
          ))}

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
