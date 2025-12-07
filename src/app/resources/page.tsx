import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { ResourcesGrid, type Resource } from '@/components/resources'
import { spacing, maxWidth, typography } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Free Resources | Birth & Postpartum Guides',
  description:
    'Download free birth planning templates, postpartum checklists, and evidence-based guides to help you prepare for your birth journey in Kearney, Nebraska.',
  keywords: [
    'birth plan template',
    'postpartum checklist',
    'doula resources Kearney',
    'birth preparation guide Nebraska',
  ],
}

/**
 * Resources Page
 *
 * Provides downloadable resources for expectant families.
 * Currently features sample resources - replace fileUrl with actual PDF links.
 */

// Sample resources - TODO: Replace fileUrl with actual hosted PDF links
// For now, these are placeholders. Upload actual PDFs to /public/resources/ folder
const sampleResources: Resource[] = [
  {
    title: 'Birth Plan Template',
    description:
      'A comprehensive template to help you communicate your preferences for labor, delivery, and immediate postpartum care with your healthcare team.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '2.5 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: 'Postpartum Essentials Checklist',
    description:
      'Everything you need to prepare for the fourth trimester. Covers physical recovery, emotional wellness, baby care basics, and support resources.',
    category: 'Postpartum',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: 'Questions to Ask Your Healthcare Provider',
    description:
      'Evidence-based questions to discuss with your OB, midwife, or hospital staff. Covers prenatal care, birth preferences, and postpartum planning.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Newborn Care Basics Guide',
    description:
      'Essential information for first-time parents covering feeding, diapering, sleep safety, and when to call your pediatrician.',
    category: 'Newborn Care',
    fileType: 'PDF',
    fileSize: '3.1 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    title: 'Breastfeeding Tips & Troubleshooting',
    description:
      'Practical advice for establishing breastfeeding, common challenges and solutions, and when to seek lactation support.',
    category: 'Breastfeeding',
    fileType: 'PDF',
    fileSize: '2.2 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Partner Support Guide',
    description:
      'How partners can actively support during pregnancy, labor, and postpartum. Includes practical tips and communication strategies.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '1.6 MB',
    fileUrl: '#', // TODO: Replace with actual file path
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
]

export default function ResourcesPage() {
  return (
    <div className="bg-background">
      {/* Page Header */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h1 className={typography.h1}>Free Resources</h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-6 ${typography.lead}`}>
              Evidence-based guides, checklists, and templates to help you
              prepare for birth and parenthood with confidence.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Resources Grid */}
      <section className={`${spacing.container} pb-20`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <ResourcesGrid resources={sampleResources} />
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-muted/30 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Need More Personalized Support?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              These resources are just the beginning. Let&apos;s discuss how
              customized doula support can make your birth experience exactly
              what you envision.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">Explore Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
