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
  Moon,
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
  title: 'Postpartum Doula Care | Fourth Trimester Support',
  description:
    'Postpartum doula services in Kearney, Nebraska. Expert support for newborn care, recovery, feeding, and adjusting to life with baby. Day and overnight support available.',
  keywords:
    'postpartum doula Kearney NE, newborn care, postpartum support Nebraska, fourth trimester, overnight doula, newborn care specialist',
}

export default function PostpartumCarePage() {
  const serviceSchema = getServiceSchema({
    name: 'Postpartum Doula Care',
    description:
      'DONA-certified postpartum doula providing newborn care education, feeding support, emotional care, and household help during the fourth trimester in Kearney, Nebraska.',
    priceRange: '$30-$45/hour',
    slug: 'postpartum-care',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{
          service: 'postpartum-care',
          title: 'Postpartum Doula Care',
        }}
      />

      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              DONA-Certified Postpartum Doula
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
              <Card className="h-full border-2 border-pink-200 dark:border-pink-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
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
                      <span className="text-pink-500 mt-1">•</span>
                      Frequent feeding (8-12+ times per day)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      Lots of holding, skin-to-skin, and closeness
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      Help regulating temperature and emotions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-500 mt-1">•</span>
                      Patient caregivers learning their cues
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-purple-200 dark:border-purple-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
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
                      <span className="text-purple-500 mt-1">•</span>
                      Rest and physical recovery time
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      Nourishing food and hydration
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      Emotional support and reassurance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
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
              'You need overnight support to get sleep',
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

      {/* Day vs Overnight */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Day Support vs. Overnight Support
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              Choose the support that fits your family's needs. Many families
              combine both.
            </p>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <Card className="h-full border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      <Sun className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      Daytime Support
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Help during waking hours when life feels most chaotic.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>
                        <strong>Feeding support</strong> - watch and assist with
                        breastfeeding or bottle prep
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>
                        <strong>Baby care education</strong> - bathing,
                        swaddling, soothing
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>
                        <strong>Light housework</strong> - laundry, dishes, meal
                        prep
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>
                        <strong>Sibling care</strong> - engaging older kids
                        while you rest or nurse
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>
                        <strong>Your nap</strong> - I watch baby while you sleep
                      </span>
                    </li>
                  </ul>
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Typical hours:</strong> 3-5 hour visits, morning
                      or afternoon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-primary">
                <CardContent className="pt-6">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Popular Choice
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      <Moon className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">
                      Overnight Support
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Sleep is essential for recovery. Let me handle the nights.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong>Nighttime baby care</strong> - soothing,
                        changing, settling
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong>Feeding support</strong> - bring baby to you for
                        nursing, or handle bottle feeds
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong>You actually sleep</strong> - 5-8 hours of
                        uninterrupted rest
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong>Morning update</strong> - detailed log of the
                        night
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-1">•</span>
                      <span>
                        <strong>Light prep</strong> - breakfast ready, kitchen
                        tidied
                      </span>
                    </li>
                  </ul>
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Typical hours:</strong> 8-10 hour shifts, usually
                      9pm-7am
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
                icon: <Moon className="h-5 w-5" />,
                title: 'Your Rest',
                desc: 'Baby is content and drowsy. You take a nap while I watch the baby, fold laundry, and prep lunch.',
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
                desc: 'Kitchen is tidy, laundry is done. I leave you with a peaceful house and a sleeping baby.',
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
              What's Included in Postpartum Care
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
                title: 'Meal Prep',
                desc: 'Light cooking, preparing nourishing snacks, and ensuring you eat while caring for baby.',
              },
              {
                icon: <Shirt className="h-6 w-6" />,
                title: 'Light Housework',
                desc: 'Laundry (baby and yours), dishes, tidying—so you can focus on recovery and bonding.',
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

      {/* Bonus: Infant Massage */}
      <section
        className={`bg-pink-50 dark:bg-pink-950/20 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="p-6 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                  <Hand className="h-12 w-12" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    Included Benefit
                  </span>
                </div>
                <h2 className={typography.h2}>Infant Massage Instruction</h2>
                <p className="mt-4 text-muted-foreground">
                  As a Certified Infant Massage Instructor, I include basic
                  infant massage education in all postpartum packages. Learn
                  gentle techniques to soothe your baby, ease gas and colic,
                  improve sleep, and deepen your bond through nurturing touch.
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
              <Card className="h-full border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
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
                  <p className="mt-4 text-sm font-medium text-amber-700 dark:text-amber-300">
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
              Whether you need one overnight shift or several weeks of support,
              I'm here to help your family thrive in those precious (and
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
