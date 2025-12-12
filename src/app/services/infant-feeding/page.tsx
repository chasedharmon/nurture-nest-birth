/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { spacing, maxWidth, typography, grid } from '@/lib/design-system'
import {
  Baby,
  Clock,
  Heart,
  Milk,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Home,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Infant Feeding Support | Nurture Nest Birth | Kearney, NE',
  description:
    'Certified breastfeeding specialist in Kearney, Nebraska. Support for breastfeeding, bottle feeding, and combination feeding. Referral to IBCLC for complex issues.',
  keywords:
    'infant feeding support Kearney NE, breastfeeding support, breastfeeding specialist Nebraska, nursing help',
}

export default function InfantFeedingPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Milk className="h-4 w-4" />
              Infant Feeding Support
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>
              Expert Feeding Support
              <span className="block text-primary">When You Need It Most</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              Whether you're breastfeeding, bottle feeding, or combination
              feeding—you deserve support that meets you where you are.
              Compassionate, evidence-based guidance can make all the
              difference.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Get Feeding Support</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Investment</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* The Truth About Infant Feeding Section */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              The Truth About Infant Feeding
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              Despite what you may have heard, many feeding challenges are
              normal and solvable with the right support.
            </p>
          </FadeIn>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FadeIn delay={0.1}>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">92%</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  of mothers who receive skilled feeding support meet their
                  breastfeeding goals
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">60%</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  of mothers stop breastfeeding earlier than planned due to
                  challenges that could have been addressed
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    24-48h
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Early intervention in the first days can prevent weeks of
                  struggle and protect your milk supply
                </p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-10 rounded-lg border-l-4 border-primary bg-primary/5 p-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Important:</strong> Pain
                during breastfeeding is common, but it's not normal. If feeding
                hurts, something can likely be improved. Early help prevents
                small issues from becoming big ones.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* When to Seek Help Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>When to Seek Feeding Support</h2>
            <p className="mt-4 text-muted-foreground">
              You don't need to wait until things are "bad enough." Getting help
              early often means faster, easier solutions.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <Card className="h-full border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-serif text-lg font-semibold">
                      Get Help Soon
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pain during or after feeding that doesn't improve
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Baby seems frustrated at the breast
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Concerns about milk supply (too much or too little)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Baby not gaining weight as expected
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      You're dreading feeding times
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="h-full border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-serif text-lg font-semibold">
                      Get Help Today
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      Baby hasn't fed well in 8+ hours
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      Fewer than 6 wet diapers in 24 hours (after day 4)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      Signs of jaundice (yellowing skin/eyes)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      Severe breast pain, redness, or fever
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                      Baby seems lethargic or difficult to wake
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-8 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> For complex
                lactation issues such as tongue ties, severe supply problems, or
                medical complications, I can provide a referral to a certified
                IBCLC (International Board Certified Lactation Consultant) for
                specialized care.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Common Challenges Section */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Common Challenges I Help With
            </h2>
            <p className="mt-4 text-center text-muted-foreground">
              Every feeding situation is unique, but these are some of the most
              common concerns I help families navigate.
            </p>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.three}`}>
            {[
              {
                icon: Baby,
                title: 'Latch & Positioning',
                desc: 'Pain, shallow latch, difficulty getting baby to latch, nursing in different positions, laid-back nursing techniques.',
              },
              {
                icon: Milk,
                title: 'Milk Supply',
                desc: 'Low supply concerns, oversupply management, engorgement, establishing supply, pumping to increase output.',
              },
              {
                icon: Clock,
                title: 'Pumping & Storage',
                desc: 'Exclusive pumping, building a freezer stash, returning to work, pump flange sizing, milk storage guidelines.',
              },
              {
                icon: Heart,
                title: 'Bottle Feeding',
                desc: 'Paced bottle feeding techniques, choosing bottles and nipples, transitioning between breast and bottle.',
              },
              {
                icon: Sparkles,
                title: 'Combination Feeding',
                desc: 'Balancing breast and bottle, maintaining supply while supplementing, creating a sustainable routine.',
              },
              {
                icon: Calendar,
                title: 'Feeding Transitions',
                desc: "Introducing bottles, combo feeding, supplementing, gentle weaning strategies when you're ready.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full border-2 transition-colors hover:border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>What to Expect in a Consultation</h2>
            <p className="mt-4 text-muted-foreground">
              A feeding consultation is unhurried, thorough, and focused
              entirely on your family's needs.
            </p>
          </FadeIn>

          <div className="mt-10 space-y-6">
            {[
              {
                step: '1',
                title: 'Intake & History',
                time: '15-20 min',
                desc: "We'll discuss your birth, feeding history, any concerns, and your goals. This helps me understand your unique situation.",
              },
              {
                step: '2',
                title: 'Feeding Observation',
                time: '20-30 min',
                desc: "I'll observe a full feeding session, watching baby's latch, suck pattern, and swallow. I'll assess positioning and your comfort.",
              },
              {
                step: '3',
                title: 'Assessment',
                time: '10-15 min',
                desc: "If needed, I'll do a gentle assessment of baby and evaluate your comfort. For complex issues, I can provide referrals to specialists.",
              },
              {
                step: '4',
                title: 'Personalized Plan',
                time: '15-20 min',
                desc: "Together we'll create a clear, actionable plan. I'll demonstrate techniques, provide resources, and answer all your questions.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg font-semibold">
                        {item.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        ~{item.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.5}>
            <div className="mt-10 rounded-lg border bg-card p-6">
              <h3 className="font-serif text-lg font-semibold">
                After Your Visit
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll receive a written summary of our visit with your
                personalized feeding plan, any referrals if needed, and my
                contact information for follow-up questions. Most families see
                significant improvement within 1-2 weeks of implementing their
                plan.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Where I Provide Support */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={`text-center ${typography.h2}`}>
              Where I Provide Support
            </h2>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold">
                      Home Visits
                    </h3>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    I come to you! Home visits are ideal because I can see your
                    actual feeding setup, assess your nursing pillows and
                    positioning, and provide support in your own comfortable
                    environment. No need to bundle up a newborn and leave the
                    house.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      'Most comfortable for you and baby',
                      'See your actual feeding setup',
                      'No travel stress postpartum',
                      'Partner can easily participate',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold">
                      Hospital Visits
                    </h3>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    For families at CHI Health Good Samaritan or other local
                    facilities, I can visit you in the hospital during your
                    postpartum stay. Early intervention in those first days can
                    prevent weeks of struggle at home.
                  </p>
                  <ul className="mt-4 space-y-2">
                    {[
                      'Address issues before discharge',
                      'Work alongside hospital staff',
                      'Set you up for success at home',
                      'Continuity into postpartum',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Virtual consultations</strong> are also available for
                follow-up visits, quick questions, or for families outside my
                service area.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>My Approach to Feeding Support</h2>
          </FadeIn>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    Evidence-Based
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    I stay current on infant feeding research and provide
                    recommendations backed by the latest evidence, not outdated
                    myths or personal opinions.
                  </p>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    Non-Judgmental
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Whether your goal is exclusive breastfeeding, combo feeding,
                    or formula feeding, I support YOUR informed choices without
                    pressure or guilt.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="space-y-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    Parent-Centered
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your mental health matters too. I believe fed is best when
                    it's sustainable for your whole family. We'll find solutions
                    that work for YOUR life.
                  </p>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-primary">
                    Collaborative
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    I work alongside your pediatrician, OB, and other providers.
                    If you need specialist referrals (like an IBCLC), I'll help
                    coordinate your care.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <blockquote className="mt-10 border-l-4 border-primary pl-6">
              <p className="text-lg italic text-muted-foreground">
                "Feeding your baby—however you choose to do it—should feel
                manageable, not miserable. I'm here to help you find what works
                for YOUR family."
              </p>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Included with Doula Services */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
              <h2 className="font-serif text-2xl font-semibold">
                Included with Doula Packages
              </h2>
              <p className="mt-4 text-muted-foreground">
                Infant feeding support is included as part of postpartum doula
                packages. This means you get feeding guidance integrated into
                your comprehensive postpartum care.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild>
                  <Link href="/services/postpartum-doula">
                    Learn About Postpartum Support
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">View Packages</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Related Services */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Related Support Services</h2>
            <p className="mt-4 text-muted-foreground">
              Feeding support is just one piece of the postpartum puzzle.
            </p>
          </FadeIn>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <Link
                href="/services/postpartum-doula"
                className="group flex items-center gap-4 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Postpartum Doula Support
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hands-on help with newborn care, feeding support included
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
                  <Baby className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold group-hover:text-primary">
                    Infant Massage
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Learn techniques that help with colic, gas, and bonding
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Urgent Help Banner */}
      <section className={`${spacing.container} py-8`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-6">
              <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-semibold">
                    Need Urgent Feeding Support?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If you're struggling right now, don't wait. I offer same-day
                    and next-day appointments when available. Call or text me
                    directly.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/contact">Contact Me Now</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>
              Feeding Your Baby Shouldn't Be a Struggle
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              Whether you're preparing for baby's arrival, navigating the first
              challenging weeks, or troubleshooting issues months later—skilled
              support can transform your feeding experience.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Consultation</Link>
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
