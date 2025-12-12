import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { ResourcesGrid, type Resource } from '@/components/resources'
import { spacing, maxWidth, typography } from '@/lib/design-system'
import {
  FileText,
  CheckSquare,
  HelpCircle,
  BookOpen,
  Heart,
  Users,
  Briefcase,
  Car,
  Baby,
  Moon,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Resources | Birth & Postpartum Guides | Nurture Nest Birth',
  description:
    'Download free birth planning templates, hospital bag checklists, postpartum guides, and car seat safety quick reference. Evidence-based resources for expectant families in Kearney, Nebraska.',
  keywords: [
    'birth plan template',
    'hospital bag checklist',
    'postpartum checklist',
    'car seat safety guide',
    'doula resources Kearney',
    'birth preparation guide Nebraska',
  ],
}

/**
 * Resources Page
 *
 * Provides downloadable resources for expectant families.
 * Upload actual PDFs to /public/resources/ folder and update fileUrl.
 */

const resources: Resource[] = [
  {
    title: 'Birth Preferences Worksheet',
    description:
      'More than a birth plan—a comprehensive worksheet to explore your preferences for labor, delivery, and immediate postpartum. Includes questions to discuss with your provider and doula.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '2.5 MB',
    fileUrl: '/resources/birth-preferences-worksheet.pdf',
    icon: <FileText className="h-6 w-6" />,
  },
  {
    title: 'Hospital Bag Checklist',
    description:
      'The ultimate packing guide for labor, hospital stay, and coming home. Separate sections for birthing person, partner, and baby—with notes on what the hospital provides.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '1.5 MB',
    fileUrl: '/resources/hospital-bag-checklist.pdf',
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    title: 'Postpartum Preparation Guide',
    description:
      'Prepare for the fourth trimester before baby arrives. Covers physical recovery, emotional wellness, meal prep tips, support system planning, and red flags to watch for.',
    category: 'Postpartum',
    fileType: 'PDF',
    fileSize: '3.2 MB',
    fileUrl: '/resources/postpartum-prep-guide.pdf',
    icon: <Moon className="h-6 w-6" />,
  },
  {
    title: 'Car Seat Safety Quick Reference',
    description:
      'One-page guide to car seat installation and safety. Covers proper harness fit, recline angle, installation checks, and common mistakes to avoid. From a certified CPST.',
    category: 'Safety',
    fileType: 'PDF',
    fileSize: '800 KB',
    fileUrl: '/resources/car-seat-quick-reference.pdf',
    icon: <Car className="h-6 w-6" />,
  },
  {
    title: 'Newborn Care Basics',
    description:
      'Essential information for the first weeks at home. Covers feeding cues, diaper changes, safe sleep (ABCs), umbilical cord care, and when to call your pediatrician.',
    category: 'Newborn Care',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    fileUrl: '/resources/newborn-care-basics.pdf',
    icon: <Baby className="h-6 w-6" />,
  },
  {
    title: 'Breastfeeding Quick Start Guide',
    description:
      'Get off to a good start with breastfeeding. Covers early latching, hunger cues, how to tell if baby is getting enough, and when to seek feeding support.',
    category: 'Breastfeeding',
    fileType: 'PDF',
    fileSize: '2.1 MB',
    fileUrl: '/resources/breastfeeding-quick-start.pdf',
    icon: <Heart className="h-6 w-6" />,
  },
  {
    title: 'Partner Support Guide',
    description:
      'How partners can actively support during pregnancy, labor, and postpartum. Practical tips for each stage, communication strategies, and self-care reminders.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '1.8 MB',
    fileUrl: '/resources/partner-support-guide.pdf',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Questions for Your Provider',
    description:
      'Evidence-based questions to discuss with your OB, midwife, or pediatrician. Organized by trimester and topic, with space for notes.',
    category: 'Birth Preparation',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    fileUrl: '/resources/provider-questions.pdf',
    icon: <HelpCircle className="h-6 w-6" />,
  },
  {
    title: 'Postpartum Recovery Checklist',
    description:
      'Track your physical and emotional recovery day by day. Includes warning signs, self-care reminders, and space to note questions for your provider visits.',
    category: 'Postpartum',
    fileType: 'PDF',
    fileSize: '1.4 MB',
    fileUrl: '/resources/postpartum-recovery-checklist.pdf',
    icon: <CheckSquare className="h-6 w-6" />,
  },
  {
    title: 'Local Resources Directory',
    description:
      'Central Nebraska-specific resources including hospitals, pediatricians, breastfeeding specialists, mental health support, and community programs.',
    category: 'Local Resources',
    fileType: 'PDF',
    fileSize: '600 KB',
    fileUrl: '/resources/central-nebraska-resources.pdf',
    icon: <BookOpen className="h-6 w-6" />,
  },
]

export default function ResourcesPage() {
  return (
    <div className="bg-background">
      {/* Page Header */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <FileText className="h-4 w-4" />
              Free Downloads
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Free Resources</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              Evidence-based guides, checklists, and worksheets to help you
              prepare for birth and parenthood with confidence. All resources
              are free to download—no email required.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Resources Grid */}
      <section className={`${spacing.container} pb-20`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <ResourcesGrid resources={resources} />
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
              <h2 className="font-serif text-2xl font-semibold">
                Get Updates When New Resources Are Added
              </h2>
              <p className="mt-2 text-muted-foreground">
                Join our newsletter for new guides, birth stories, and
                evidence-based insights delivered monthly.
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild>
                  <Link href="/contact">Subscribe to Newsletter</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Need Personalized Support?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              These resources are a great starting point, but every birth
              journey is unique. Customized doula support can help you prepare
              for exactly what you need.
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
