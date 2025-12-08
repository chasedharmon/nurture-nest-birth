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
  Phone,
  Clock,
  Calendar,
  CheckCircle,
  Users,
  ArrowRight,
  Stethoscope,
  Home,
  Building,
  Baby,
  Shield,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Birth Doula Support | Comprehensive Labor & Delivery Care',
  description:
    'DONA-certified birth doula in Kearney, NE. Continuous labor support, prenatal planning, and postpartum follow-up. Supporting all birth settings and preferences.',
  keywords:
    'birth doula Kearney, labor support, doula services Nebraska, hospital birth support, home birth doula',
}

export default function BirthDoulaPage() {
  const serviceSchema = getServiceSchema({
    name: 'Birth Doula Support',
    description:
      'DONA-certified birth doula providing continuous labor support, prenatal planning, and postpartum follow-up. Supporting all birth settings and preferences in Kearney, Nebraska.',
    priceRange: '$800-$1500',
    slug: 'birth-doula',
  })

  return (
    <div className="bg-background">
      <JSONLDScript data={serviceSchema} />
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{ service: 'birth-doula', title: 'Birth Doula Support' }}
      />

      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              DONA-Certified Birth Doula
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>
              Continuous Support for Your Birth Journey
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              From active labor through the first hours with your baby, I'll be
              by your side with physical comfort, emotional encouragement, and
              evidence-based guidance. Every birth deserves dedicated,
              compassionate support.
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

      {/* Evidence Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              The Research is Clear
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              Decades of studies show that continuous labor support leads to
              better outcomes for both birthing people and babies.
            </p>
          </FadeIn>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                stat: '25%',
                label: 'Shorter Labor',
                desc: 'Reduced labor duration',
              },
              {
                stat: '31%',
                label: 'Fewer Cesareans',
                desc: 'Lower c-section rate',
              },
              {
                stat: '9%',
                label: 'Less Pain Meds',
                desc: 'Reduced need for medication',
              },
              {
                stat: '34%',
                label: 'More Satisfaction',
                desc: 'Higher birth experience rating',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {item.stat}
                  </div>
                  <div className="font-semibold text-foreground mt-2">
                    {item.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.desc}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.5}>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Source: Cochrane Review, "Continuous support for women during
              childbirth" (2017)
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Is This Right For You */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Is a Birth Doula Right For You?</h2>
            <p className="text-muted-foreground mt-4">
              Birth doula support is valuable for all types of births and
              birthing people. You might especially benefit if:
            </p>
          </FadeIn>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                {[
                  "It's your first baby and you want an experienced guide",
                  'You want to try for an unmedicated birth',
                  "You're planning a VBAC (vaginal birth after cesarean)",
                  'You want support navigating the medical system',
                  'Your partner needs support in their role too',
                  "You've had a difficult or traumatic birth before",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    Even if you're planning an epidural...
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    Doula support is not just for "natural" births. I support
                    ALL birth choices. Whether you want an unmedicated water
                    birth or a scheduled cesarean, my job is to help you feel
                    informed, supported, and empowered in YOUR birth.
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* The Journey Timeline */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Your Birth Doula Journey
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              From our first meeting to your postpartum follow-up, here's what
              to expect when you work with me.
            </p>
          </FadeIn>
          <div className="mt-12 space-y-8">
            {[
              {
                icon: <Calendar className="h-6 w-6" />,
                title: 'Initial Consultation',
                timing: 'Free, 30-60 minutes',
                desc: "We'll meet (in person or virtually) to discuss your birth vision, answer your questions, and see if we're a good fit. No pressure, no commitment.",
              },
              {
                icon: <Heart className="h-6 w-6" />,
                title: 'Prenatal Visit #1',
                timing: 'Around 32-34 weeks',
                desc: "We dive deep into your birth preferences, discuss your support team, and I teach comfort techniques you can practice. We'll also complete your birth plan together.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: 'Prenatal Visit #2',
                timing: 'Around 36-37 weeks',
                desc: 'Review of comfort measures with hands-on practice. Partner involvement training. Discussion of what early labor looks like and when to call me.',
              },
              {
                icon: <Phone className="h-6 w-6" />,
                title: 'On-Call Period',
                timing: '38 weeks until birth',
                desc: "I'm available 24/7 by text or call. Early labor questions? 2am contractions? I'm here. We stay in communication as labor develops.",
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: 'Active Labor Support',
                timing: 'Until baby arrives',
                desc: "I join you when labor becomes active and provide continuous support until baby is born and you're settled. Typically 8-20+ hours of in-person support.",
              },
              {
                icon: <Baby className="h-6 w-6" />,
                title: 'Postpartum Visit',
                timing: '1-2 weeks after birth',
                desc: "We process your birth story, discuss breastfeeding, answer questions about recovery, and check in on how you're adjusting to parenthood.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 p-3 rounded-full bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <span className="text-sm text-primary font-medium">
                        {item.timing}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                  {i < 5 && (
                    <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground/30 mt-3" />
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What I Do During Labor */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>What I Do During Labor</h2>
            <p className="text-muted-foreground mt-4">
              Continuous support means exactly that—I'm by your side from active
              labor until you're settled after birth. Here's what that looks
              like:
            </p>
          </FadeIn>
          <div className={`mt-8 grid ${grid.gap.medium} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                    Physical Comfort
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Counter-pressure for back labor
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Massage and touch techniques
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Position suggestions for optimal labor progress
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Hot/cold therapy, birthing ball, rebozo
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Breathing and relaxation guidance
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Hydration, nourishment reminders
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                    Emotional Support
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Constant reassurance and encouragement
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Creating a calm, positive environment
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Helping you stay focused and present
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Validating your feelings and experiences
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Recognizing emotional transitions
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Supporting your partner's emotional needs too
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                    Information & Advocacy
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Explaining what's happening and what to expect
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Helping you understand your options
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Facilitating communication with staff
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Ensuring your questions are answered
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Supporting informed decision-making
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Honoring your birth preferences
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.4}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                    Partner Support
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Guiding your partner in supporting you
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Giving your partner breaks when needed
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Suggesting ways they can help
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Making sure they eat and rest
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Never replacing your partner's role
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      Creating space for partner bonding
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Birth Settings */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Support for Every Birth Setting
            </h2>
            <p className="text-center text-muted-foreground mt-4 max-w-2xl mx-auto">
              Whether you're birthing at the hospital, birth center, or at home,
              I adapt my support to your unique environment and needs.
            </p>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.three}`}>
            <FadeIn delay={0.1}>
              <Card className="text-center h-full">
                <CardContent className="pt-6">
                  <div className="mx-auto w-fit p-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 mb-4">
                    <Building className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Hospital Birth
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    I'm familiar with local hospitals and work collaboratively
                    with medical staff. I help you navigate hospital policies
                    while honoring your preferences.
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="text-center h-full">
                <CardContent className="pt-6">
                  <div className="mx-auto w-fit p-4 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mb-4">
                    <Stethoscope className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Birth Center
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Birth centers offer a home-like environment with midwifery
                    care. I complement their approach with additional continuous
                    support.
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
            <FadeIn delay={0.3}>
              <Card className="text-center h-full">
                <CardContent className="pt-6">
                  <div className="mx-auto w-fit p-4 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 mb-4">
                    <Home className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Home Birth
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    For planned home births with a midwife, I provide additional
                    support, helping create your ideal birth environment.
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <h2 className={typography.h2}>Your Partner's Role</h2>
              <p className="mt-4 text-muted-foreground">
                One of the most common questions I hear is "Won't the doula
                replace my partner?" The answer is a resounding NO.
              </p>
              <p className="mt-4 text-muted-foreground">
                Your partner knows you, loves you, and has an irreplaceable
                bond. My role is to support BOTH of you. I show your partner
                where to press, when to offer ice chips, and when to just hold
                your hand. I give them permission to take breaks without guilt.
              </p>
              <p className="mt-4 text-muted-foreground">
                Many partners tell me they felt so much more confident and
                present because I was there to guide them. You both deserve
                support.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    What Partners Say
                  </h3>
                  <div className="space-y-4">
                    <blockquote className="text-muted-foreground italic border-l-2 border-primary pl-4">
                      "I was terrified I wouldn't know what to do. Having the
                      doula there gave me confidence and let me be fully present
                      instead of panicking."
                    </blockquote>
                    <blockquote className="text-muted-foreground italic border-l-2 border-primary pl-4">
                      "She showed me exactly how to help and took over when I
                      needed a break. I never felt pushed aside—I felt
                      supported."
                    </blockquote>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What I Don't Do */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>What a Doula Does NOT Do</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Understanding my scope helps you know exactly what support you're
              getting.
            </p>
          </FadeIn>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Medical tasks or procedures',
              'Diagnose or give medical advice',
              'Make decisions for you',
              'Replace your partner',
              'Catch babies',
              'Speak for you without consent',
              'Argue with medical staff',
              'Work against your wishes',
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-300">
                  {item}
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.5}>
            <p className="text-muted-foreground mt-8 max-w-2xl mx-auto">
              I work alongside your medical team, not in place of them. My role
              is to provide continuous emotional and physical support while your
              doctors, midwives, and nurses handle medical care.
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
            <h2 className={typography.h2}>
              Ready to Plan Your Birth Together?
            </h2>
            <p className={`mt-4 ${typography.lead}`}>
              Let's discuss how I can support your unique birth vision. Your
              free consultation is just a click away.
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
