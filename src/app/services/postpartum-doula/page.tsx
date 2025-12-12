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
  Sun,
  Clock,
  Baby,
  Utensils,
  Shirt,
  Users,
  Brain,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Hand,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Postpartum Doula Support | Fourth Trimester Care',
  description:
    'Postpartum doula services in Kearney, Nebraska and Central Nebraska. Expert support for newborn care, recovery, feeding, and adjusting to life with baby.',
  keywords:
    'postpartum doula Kearney NE, newborn care, postpartum support Nebraska, fourth trimester, newborn care specialist',
}

export default function PostpartumDoulaPage() {
  const serviceSchema = getServiceSchema({
    name: 'Postpartum Doula Support',
    description:
      'Professionally trained postpartum doula providing newborn care education, feeding support, emotional care, and household help during the fourth trimester in Kearney, Nebraska and Central Nebraska.',
    priceRange: '$35-$45/hour',
    slug: 'postpartum-doula',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{
          service: 'postpartum-doula',
          title: 'Postpartum Doula Support',
        }}
      />

      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Professionally Trained Postpartum Doula
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Support for the Fourth Trimester</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              The first weeks with your new baby are precious—and challenging.
              As your postpartum doula, I provide nurturing support so you can
              rest, recover, and bond with your baby without feeling
              overwhelmed.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Packages</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Fourth Trimester Education */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Understanding the Fourth Trimester
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              The "fourth trimester" is the first 12 weeks after birth—a
              critical time of adjustment for babies and parents alike.
            </p>
          </FadeIn>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1}>
              <Card className="h-full border-2 border-secondary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                      <Baby className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      For Baby
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Your newborn is adjusting to life outside the womb. In the
                    fourth trimester, babies need:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      Frequent feeding (8-12+ times per day)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      Lots of holding, skin-to-skin, and closeness
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      Help regulating temperature and emotions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      Patient caregivers learning their cues
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Heart className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      For You
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Your body is healing while you're sleep-deprived and
                    learning an entirely new role. You need:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Rest and physical recovery time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Nourishing food and hydration
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Emotional support and reassurance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Someone to share the load
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Signs You Need Support */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>
              You Might Need Postpartum Support If...
            </h2>
            <p className="text-muted-foreground mt-4">
              Needing help isn't weakness—it's wisdom. Humans weren't meant to
              parent in isolation. Consider postpartum doula care if:
            </p>
          </FadeIn>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {[
              'Your partner has limited parental leave',
              "You don't have nearby family to help",
              'You have older children who need attention too',
              "You're recovering from a cesarean or difficult birth",
              'You want to establish breastfeeding successfully',
              "You're experiencing anxiety about newborn care",
              'You want to rest and recover properly',
              'You simply want nurturing, professional help',
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-card border">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.5}>
            <p className="text-muted-foreground mt-6 text-center italic">
              Every family deserves support. There's no threshold you need to
              meet.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Daytime Support */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Daytime Postpartum Support
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              I provide daytime support when life feels most chaotic. My visits
              are tailored to what your family needs.
            </p>
          </FadeIn>
          <div className="mt-12">
            <FadeIn delay={0.1}>
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-secondary/10 text-secondary">
                      <Sun className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      What Daytime Support Includes
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Feeding support</strong> - breastfeeding
                          assistance, bottle prep, or combination feeding help
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Baby care education</strong> - bathing,
                          swaddling, soothing techniques
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Light housework</strong> - baby laundry, baby
                          dishes, nursery organization
                        </span>
                      </li>
                    </ul>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Sibling care</strong> - engaging older kids
                          while you rest or nurse
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Your rest</strong> - I watch baby while you
                          nap
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-secondary mt-1">•</span>
                        <span>
                          <strong>Emotional support</strong> - a listening ear
                          and reassurance
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Typical visits:</strong> 4+ hour minimum, morning
                      or afternoon. I'm flexible to your needs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* A Day in the Life */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>What a Daytime Visit Looks Like</h2>
            <p className="text-muted-foreground mt-4">
              Every visit is tailored to what your family needs that day. Here's
              an example of a 4-hour morning visit:
            </p>
          </FadeIn>
          <div className="mt-8 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/20" />
            {[
              {
                time: '9:00 AM',
                icon: <Clock className="h-5 w-5" />,
                title: 'Arrival & Check-In',
                desc: 'I arrive, wash up, and check in with you. How was the night? What do you need most today? We make a plan.',
              },
              {
                time: '9:30 AM',
                icon: <Baby className="h-5 w-5" />,
                title: 'Baby Care',
                desc: "I change and dress baby while you finish breakfast. We chat about what you're noticing—any concerns, questions, or wins.",
              },
              {
                time: '10:00 AM',
                icon: <Heart className="h-5 w-5" />,
                title: 'Feeding Support',
                desc: 'I help you get comfortable for a feeding, bring water and snacks, troubleshoot latch if needed, or prep a bottle.',
              },
              {
                time: '10:45 AM',
                icon: <Sun className="h-5 w-5" />,
                title: 'Your Rest',
                desc: 'Baby is content and drowsy. You take a nap while I watch the baby, fold baby laundry, and do light meal prep.',
              },
              {
                time: '12:00 PM',
                icon: <Utensils className="h-5 w-5" />,
                title: 'Lunch & Chat',
                desc: 'You wake refreshed. We eat together while I share what I observed and answer your questions.',
              },
              {
                time: '12:45 PM',
                icon: <Shirt className="h-5 w-5" />,
                title: 'Wrap Up',
                desc: 'Baby dishes washed, baby laundry is done. I leave you with a peaceful nursery and a sleeping baby.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-6 ml-4 pb-8 last:pb-0">
                  <div className="relative flex-shrink-0 -ml-4 z-10">
                    <div className="p-2 rounded-full bg-primary text-primary-foreground">
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-primary">
                        {item.time}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                      <h3 className="font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              What's Included in Postpartum Doula Support
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.three}`}>
            {[
              {
                icon: <Baby className="h-6 w-6" />,
                title: 'Newborn Care Education',
                desc: "Bathing, diapering, swaddling, soothing techniques, and understanding your baby's unique cues.",
              },
              {
                icon: <Heart className="h-6 w-6" />,
                title: 'Feeding Support',
                desc: 'Breastfeeding assistance, pumping guidance, bottle feeding help, or combination feeding strategies.',
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: 'Emotional Support',
                desc: 'A non-judgmental listening ear as you process your birth experience and adjust to parenthood.',
              },
              {
                icon: <Utensils className="h-6 w-6" />,
                title: 'Light Meal Prep',
                desc: "Simple meal preparation, nourishing snacks, and ensuring you eat while caring for baby. Note: I'm not a housekeeper—this is light support focused on your recovery.",
              },
              {
                icon: <Shirt className="h-6 w-6" />,
                title: 'Light Housework',
                desc: 'Baby laundry, baby dishes, and nursery organization—so you can focus on recovery and bonding. Not general housekeeping.',
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Sibling Support',
                desc: 'Helping older children adjust, engaging them in activities, and facilitating sibling bonding.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="mx-auto w-fit p-3 rounded-full bg-primary/10 text-primary mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Included Services Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Included with Postpartum Support</h2>
            <p className="text-muted-foreground mt-4">
              These specialized services are included as part of your postpartum
              doula package—no extra charge.
            </p>
          </FadeIn>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <FadeIn delay={0.1}>
              <Link
                href="/services/infant-feeding"
                className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Infant Feeding Support
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Breastfeeding, bottle feeding, and combination feeding
                    guidance
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Link
                href="/services/infant-massage"
                className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Hand className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Infant Massage Instruction
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Learn gentle techniques to soothe baby and deepen your bond
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Link
                href="/services/sibling-prep"
                className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Sibling Preparation
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guidance for helping older children adjust
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            </FadeIn>

            <FadeIn delay={0.4}>
              <Link
                href="/services/car-seat-safety"
                className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Car Seat Safety Check
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CPST-certified installation check and education
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Bonus: Infant Massage */}
      <section
        className={`bg-secondary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="p-6 rounded-full bg-secondary/10 text-secondary">
                  <Hand className="h-12 w-12" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-secondary">
                    Included Benefit
                  </span>
                </div>
                <h2 className={typography.h2}>Infant Massage Instruction</h2>
                <p className="mt-4 text-muted-foreground">
                  As a Certified Infant Massage Instructor (CIMI), I include
                  basic infant massage education in all postpartum packages.
                  Learn gentle techniques to soothe your baby, ease gas and
                  colic, improve sleep, and deepen your bond through nurturing
                  touch.
                </p>
                <div className="mt-4">
                  <Button asChild variant="outline">
                    <Link href="/services/infant-massage">
                      Learn More About Infant Massage
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Postpartum Mood */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>A Note on Postpartum Mood Changes</h2>
          </FadeIn>
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1}>
              <p className="text-muted-foreground">
                Up to 80% of new parents experience the "baby blues"—mood
                swings, tearfulness, and overwhelm in the first two weeks. This
                usually resolves on its own with rest and support.
              </p>
              <p className="mt-4 text-muted-foreground">
                However, about 1 in 7 birthing people experience postpartum
                depression or anxiety—conditions that are treatable and nothing
                to be ashamed of.
              </p>
              <p className="mt-4 text-muted-foreground">
                As your postpartum doula, I'm trained to recognize signs that
                you might benefit from additional support. I provide a safe,
                non-judgmental space and can connect you with mental health
                resources if needed.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-secondary/20 bg-secondary/5">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-3">
                    When to Seek Additional Help
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Persistent sadness or hopelessness</li>
                    <li>• Difficulty bonding with baby</li>
                    <li>• Severe anxiety or panic attacks</li>
                    <li>• Thoughts of harming yourself or baby</li>
                    <li>• Inability to sleep even when baby sleeps</li>
                    <li>• Withdrawing from family and friends</li>
                  </ul>
                  <p className="mt-4 text-sm font-medium text-secondary">
                    If you experience these symptoms, reach out to your provider
                    or call Postpartum Support International: 1-800-944-4773
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>You Don't Have to Do This Alone</h2>
            <p className={`mt-4 ${typography.lead}`}>
              Whether you need a few visits or several weeks of support, I'm
              here to help your family thrive in those precious (and
              exhausting!) early weeks.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Packages & Pricing</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
