/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'
import { spacing, maxWidth, typography, grid } from '@/lib/design-system'
import { JSONLDScript, getServiceSchema } from '@/lib/schema'
import { EVENTS } from '@/lib/analytics'
import {
  Heart,
  Moon,
  Sparkles,
  Brain,
  Hand,
  Baby,
  Clock,
  Users,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Infant Massage | Certified Infant Massage Instructor',
  description:
    'Certified Infant Massage Instructor in Kearney, NE. Learn gentle massage techniques to soothe your baby, improve sleep, ease colic, and strengthen your bond.',
  keywords:
    'infant massage Kearney, baby massage Nebraska, infant massage classes, newborn massage, colic relief, baby bonding, CIMI certified',
}

export default function InfantMassagePage() {
  const serviceSchema = getServiceSchema({
    name: 'Infant Massage Instruction',
    description:
      'Certified Infant Massage Instructor teaching parents gentle massage techniques to soothe baby, improve sleep, ease colic, and strengthen bonding in Kearney, Nebraska.',
    priceRange: '$75-$150',
    slug: 'infant-massage',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{ service: 'infant-massage', title: 'Infant Massage' }}
      />

      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              <Hand className="h-4 w-4" />
              Certified Instructor
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Infant Massage Instruction</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              The gentle art of infant massage is a beautiful way to bond with
              your baby while supporting their development. As a Certified
              Infant Massage Instructor, I teach parents these time-honored
              techniques.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Benefits of Infant Massage
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              Research shows that regular infant massage provides numerous
              benefits for both baby and parents.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* For Baby */}
            <FadeIn delay={0.1}>
              <Card className="h-full border-2 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                      <Baby className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      For Baby
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      {
                        icon: <Moon className="h-5 w-5" />,
                        title: 'Improved Sleep',
                        desc: 'Massage helps regulate sleep patterns and promotes deeper, longer sleep.',
                      },
                      {
                        icon: <Heart className="h-5 w-5" />,
                        title: 'Colic & Gas Relief',
                        desc: 'Specific techniques can ease digestive discomfort and reduce crying.',
                      },
                      {
                        icon: <Brain className="h-5 w-5" />,
                        title: 'Brain Development',
                        desc: 'Touch stimulates neural pathways and supports healthy brain development.',
                      },
                      {
                        icon: <Sparkles className="h-5 w-5" />,
                        title: 'Muscle Relaxation',
                        desc: 'Releases tension, improves circulation, and supports motor development.',
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="text-pink-600 dark:text-pink-400 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            {/* For Parents */}
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      For Parents
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {[
                      {
                        icon: <Heart className="h-5 w-5" />,
                        title: 'Deeper Bonding',
                        desc: 'Skin-to-skin contact releases oxytocin and strengthens attachment.',
                      },
                      {
                        icon: <Sparkles className="h-5 w-5" />,
                        title: 'Increased Confidence',
                        desc: "Learn to read your baby's cues and feel more confident in caregiving.",
                      },
                      {
                        icon: <Moon className="h-5 w-5" />,
                        title: 'Reduced Stress',
                        desc: 'The ritual of massage is calming for parents too, reducing anxiety.',
                      },
                      {
                        icon: <Brain className="h-5 w-5" />,
                        title: 'Quality One-on-One Time',
                        desc: 'A dedicated practice that creates special moments together.',
                      },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="text-purple-600 dark:text-purple-400 mt-0.5">
                          {item.icon}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>What You'll Learn</h2>
          </FadeIn>
          <div className={`mt-8 grid ${grid.gap.medium} ${grid.cols.two}`}>
            {[
              {
                title: 'Full Body Massage Strokes',
                desc: 'Gentle techniques for legs, feet, tummy, chest, arms, hands, face, and back.',
              },
              {
                title: 'Colic Relief Techniques',
                desc: 'Specific strokes that help move gas through the digestive system and ease discomfort.',
              },
              {
                title: 'Reading Baby Cues',
                desc: "Learn to recognize when baby is ready for massage and when they've had enough.",
              },
              {
                title: 'Creating a Routine',
                desc: 'How to incorporate massage into your daily rhythm—bedtime, after bath, etc.',
              },
              {
                title: 'Safe Oil Selection',
                desc: 'Which oils are safe for babies and how to do a patch test.',
              },
              {
                title: 'Adapting as Baby Grows',
                desc: 'How to modify techniques as your baby develops and becomes more mobile.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Session Options */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>Session Options</h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <Card className="h-full border-2">
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto w-fit p-4 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Private Session
                  </h3>
                  <p className="text-3xl font-bold text-foreground mt-4">$75</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Single 60-minute session
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground text-left">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-500" />
                      One-on-one instruction in your home
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-500" />
                      Full body massage techniques
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-500" />
                      Handout with stroke guide
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-pink-500" />
                      Sample massage oil included
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-primary">
                <CardContent className="pt-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="mx-auto w-fit p-4 rounded-full bg-primary/10 text-primary mb-4">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    2-Session Package
                  </h3>
                  <p className="text-3xl font-bold text-foreground mt-4">
                    $125
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Two 60-minute sessions
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-muted-foreground text-left">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Session 1: Learn basic full body strokes
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Session 2: Review, refine, add colic relief
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Practice time between sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      All materials and oil included
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
          <FadeIn delay={0.3}>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Infant massage instruction is also included in select postpartum
              doula packages.{' '}
              <Link
                href="/services/postpartum-care"
                className="text-primary hover:underline"
              >
                Learn more →
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Research Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>The Research Behind the Practice</h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p>
              Infant massage has been practiced across cultures for centuries,
              and modern research supports its benefits:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Studies show regular infant massage can improve weight gain in
                preterm infants and reduce hospital stays.
              </li>
              <li>
                Research indicates massage can reduce cortisol (stress hormone)
                levels in both baby and parent.
              </li>
              <li>
                Multiple studies demonstrate improved sleep patterns and reduced
                crying in regularly massaged infants.
              </li>
              <li>
                Touch therapy has been linked to improved immune function and
                better developmental outcomes.
              </li>
            </ul>
            <p>
              As a certified instructor, I teach evidence-based techniques
              developed by the Infant Massage USA program, building on the
              pioneering work of Vimala McClure.
            </p>
          </div>
        </div>
      </section>

      {/* When to Start */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>When Can You Start?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              You can begin gentle massage strokes as soon as your baby is
              ready—typically within the first few weeks of life. The ideal time
              to schedule instruction is when baby is 2-12 weeks old, though
              techniques can be adapted for older infants too.
            </p>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Partners and other caregivers are welcome to join sessions!
              Massage is a wonderful way for everyone to bond with baby.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Ready to Connect Through Touch?</h2>
            <p className={`mt-4 ${typography.lead}`}>
              Give your baby the gift of nurturing touch. Schedule an infant
              massage session today.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Session</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View All Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
