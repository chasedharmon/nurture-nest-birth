/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { CertificationBadges } from '@/components/marketing/certification-badges'
import { spacing, maxWidth, typography } from '@/lib/design-system'
import { siteConfig } from '@/config/site'
import {
  Heart,
  MapPin,
  Users,
  Sparkles,
  Quote,
  Car,
  Baby,
  Shield,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | Nurture Nest Birth | Professional Doula Kearney, NE',
  description:
    'Meet your professionally trained doula in Kearney, Nebraska. Learn about my philosophy, credentials, and approach to supporting families through pregnancy, birth, and postpartum.',
  keywords:
    'about doula Kearney NE, professional doula, breastfeeding specialist Nebraska, birth support philosophy',
}

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Section with Photo */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left - Photo */}
            <FadeIn direction="left">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl bg-primary/10 md:-left-6 md:-top-6" />
                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-primary/10">
                  <Image
                    src="/images/headshot-placeholder.jpg"
                    alt="Professional doula headshot"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                </div>
                {/* Photo overlay badge */}
                <div className="absolute -bottom-4 -right-4 rounded-xl bg-card p-4 shadow-lg md:-bottom-6 md:-right-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Central Nebraska</p>
                      <p className="text-xs text-muted-foreground">
                        Serving families since 2022
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Right - Intro */}
            <div className="flex flex-col justify-center">
              <FadeIn delay={0.1}>
                <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Meet Your Doula
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className={typography.h1}>
                  Hi, I'm [Your Name]
                  <span className="block text-primary">
                    Your Partner in Birth & Parenthood
                  </span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className={`mt-6 ${typography.lead}`}>
                  I'm a professionally trained doula, certified breastfeeding
                  specialist, and mom who believes every family deserves
                  compassionate, evidence-based support during the
                  transformative journey into parenthood.
                </p>
              </FadeIn>
              <FadeIn delay={0.4}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Kearney, Nebraska</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>100+ families supported</span>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.5}>
                <div className="mt-8">
                  <Button asChild size="lg">
                    <Link href="/contact">Let's Talk About Your Journey</Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>Why I Became a Doula</h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <p className="text-lg">
                My path to doula work wasn't a straight line—it was a journey
                shaped by education, personal experience, and a deep calling to
                support families.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p>
                I earned my degree in Family Studies, which gave me a strong
                foundation in child development, family dynamics, and the
                research behind healthy family relationships. After graduation,
                I worked as a Home Visitation Specialist, spending years in
                families' homes during some of their most vulnerable and joyful
                moments.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p>
                <strong className="text-foreground">
                  Then I became a mother myself.
                </strong>{' '}
                Like so many parents, I experienced the overwhelming mix of
                emotions that comes with welcoming a new life. I also
                experienced how much of a difference the right support can
                make—and how isolating it can feel when that support isn't
                there.
              </p>
            </FadeIn>
            <FadeIn delay={0.4}>
              <p>
                That experience lit a fire in me. I knew I wanted to be the
                person who shows up for families during birth and postpartum—not
                as an expert who has all the answers, but as a knowledgeable,
                steady presence who helps parents find their own confidence and
                strength.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <p>
                I pursued professional training for both birth and postpartum
                support, became a certified breastfeeding specialist, and
                continued adding specialized training that helps me serve
                families more completely—including car seat safety certification
                (CPST) and infant massage instruction (CIMI).
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.6}>
            <blockquote className="mt-10 border-l-4 border-primary pl-6">
              <Quote className="mb-2 h-8 w-8 text-primary/30" />
              <p className="text-lg italic text-foreground">
                "I don't do this work because I have all the answers. I do it
                because I know how powerful it is to have someone in your corner
                who believes in you—especially when you're learning to believe
                in yourself as a parent."
              </p>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Credentials Section - Using New Component */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn>
            <div className="text-center">
              <h2 className={typography.h2}>Training & Certifications</h2>
              <p className="mt-4 text-muted-foreground">
                I've invested in comprehensive training so I can offer you the
                highest quality, evidence-based support.
              </p>
            </div>
          </FadeIn>

          <div className="mt-12">
            <CertificationBadges variant="full" columns={3} />
          </div>
        </div>
      </section>

      {/* What Sets Me Apart - Differentiators */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>More Than Birth Support</h2>
            <p className="mt-4 text-muted-foreground">
              What makes my practice unique is the breadth of support I can
              offer your family—before, during, and after baby arrives.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FadeIn delay={0.1}>
              <Card className="h-full border-2 border-border bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold">
                        Child Passenger Safety Technician
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        CPST Certified
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      73% of car seats are installed incorrectly.
                    </strong>{' '}
                    As a certified Child Passenger Safety Technician, I can
                    ensure your baby's car seat is installed properly before you
                    even leave the hospital. Most doulas can't offer this—it's a
                    certification I pursued specifically because car seat safety
                    is too important to leave to chance.
                  </p>
                  <Link
                    href="/services/car-seat-safety"
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Learn about car seat checks →
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="h-full border-2 border-secondary/20 bg-secondary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                      <Baby className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold">
                        Infant Massage Instructor
                      </h3>
                      <p className="text-xs text-secondary">CIMI Certified</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Research shows infant massage can{' '}
                    <strong className="text-foreground">
                      improve sleep, reduce colic symptoms, and deepen
                      parent-baby bonding
                    </strong>
                    . I'm trained to teach you gentle massage techniques that
                    help soothe your baby while building your confidence in
                    reading their cues. It's included in my postpartum packages
                    or available standalone.
                  </p>
                  <Link
                    href="/services/infant-massage"
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Learn about infant massage →
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* My Philosophy */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>My Philosophy</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              These are the beliefs that guide every interaction with the
              families I serve.
            </p>
          </FadeIn>

          <div className="mt-10 space-y-8">
            {[
              {
                icon: Heart,
                title: 'Your Choices, My Support',
                desc: "Hospital birth, home birth, epidural, unmedicated, breastfeeding, formula—I'm not here to judge or push an agenda. I'm here to support YOUR informed decisions, whatever they are. There's no \"right\" way to birth or parent.",
              },
              {
                icon: Sparkles,
                title: 'Evidence-Based, Heart-Centered',
                desc: "I stay current on research so I can give you accurate information. But data doesn't give birth—you do. I combine the best evidence with an understanding of your unique needs, preferences, and circumstances.",
              },
              {
                icon: Users,
                title: 'The Whole Family Matters',
                desc: "Birth doesn't just happen to the birthing person—it transforms partners, siblings, and entire families. I support everyone involved, helping partners feel confident and siblings feel included.",
              },
              {
                icon: Shield,
                title: 'Your Body, Your Baby, Your Voice',
                desc: "My job isn't to speak for you or make decisions for you. It's to help you feel informed and empowered so YOU can advocate for yourself. I'm your support system, not your substitute.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Touches */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Beyond the Credentials</h2>
            <p className="mt-4 text-muted-foreground">
              A few things that might not fit on a resume but help you know who
              you're inviting into your birth space.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                emoji: '🌽',
                text: 'Nebraska born and raised—I understand the unique needs of families in our community',
              },
              {
                emoji: '👶',
                text: 'Mom to [X] kids, so I know parenthood from the inside out',
              },
              {
                emoji: '☕',
                text: 'Powered by strong coffee and a genuine love for what I do',
              },
              {
                emoji: '📚',
                text: 'Perpetual learner—always taking new courses and staying current',
              },
              {
                emoji: '🤝',
                text: 'Connected with local providers and resources across central Nebraska',
              },
              {
                emoji: '💜',
                text: "Available 24/7 for my birth clients—because babies don't follow schedules",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
              <MapPin className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 font-serif text-2xl font-semibold">
                Proudly Serving Central Nebraska
              </h2>
              <p className="mt-2 text-muted-foreground">
                I provide in-home support throughout the area
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {siteConfig.location.serviceArea.map((area, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-background px-4 py-1.5 text-sm font-medium border"
                  >
                    {area}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Not in my service area? Virtual consultations available, and I'm
                happy to refer you to trusted colleagues.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>Ready to Connect?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              I'd love to hear about your journey and answer any questions. A
              free consultation is the perfect way to see if we're a good fit.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">Explore My Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
