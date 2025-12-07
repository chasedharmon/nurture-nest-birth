/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import {
  spacing,
  maxWidth,
  grid,
  typography,
  icon,
  card,
} from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'About | Nurture Nest Birth | DONA Doula Kearney, NE',
  description:
    'Meet your DONA-certified doula in Kearney, Nebraska. Learn about my philosophy, credentials, and approach to supporting families through pregnancy, birth, and postpartum.',
  keywords:
    'about doula Kearney NE, DONA certified, lactation consultant Nebraska, birth support philosophy',
}

export default function AboutPage() {
  const credentials = [
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      title: 'DONA Certified Doula',
      desc: 'Certified through DONA International for both birth and postpartum doula support.',
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      ),
      title: 'Certified Lactation Consultant',
      desc: 'Specialized training in breastfeeding support and lactation education.',
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
      title: 'Family Studies Degree',
      desc: "Bachelor's degree in Family Studies with focus on child development and family dynamics.",
    },
    {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
      title: 'Home Visitation Specialist',
      desc: '3+ years supporting families in their homes through early childhood programs.',
    },
  ]

  const philosophy = [
    {
      title: 'Evidence-Based & Personalized',
      desc: "I combine the latest research with an understanding that every family's needs and preferences are unique.",
    },
    {
      title: 'Non-Judgmental Support',
      desc: 'Whether you choose medicated or unmedicated birth, formula or breastfeeding, hospital or home—I support your informed choices.',
    },
    {
      title: 'Whole Family Centered',
      desc: 'I support partners, siblings, and the entire family system as you welcome your new baby.',
    },
    {
      title: 'Accessible & Local',
      desc: 'Proudly serving Kearney, Grand Island, Hastings, and surrounding communities in central Nebraska.',
    },
  ]

  return (
    <div className="bg-background">
      {/* Hero Section with Photo */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className={`grid ${grid.gap.loose} lg:grid-cols-2`}>
            {/* Left - Photo */}
            <FadeIn direction="left">
              <div className="relative">
                <div className="absolute -left-6 -top-6 h-full w-full rounded-3xl bg-primary/10" />
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
              </div>
            </FadeIn>

            {/* Right - Intro */}
            <div className="flex flex-col justify-center">
              <FadeIn delay={0.1}>
                <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  About Me
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className={typography.h1}>
                  Supporting Families Through Birth & Beyond
                </h1>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className={`mt-6 ${typography.lead}`}>
                  Hi, I'm here to provide compassionate, evidence-based support
                  during one of life's most transformative experiences.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>My Journey to Doula Work</h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <p>
                My passion for supporting families began long before I became a
                doula. With a degree in Family Studies and years of experience
                as a Home Visitation Specialist, I've had the privilege of
                walking alongside families during pivotal moments in their
                lives.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p>
                What drew me to birth work was witnessing firsthand how
                transformative compassionate, continuous support can be. I've
                seen how the right information, a steady presence, and genuine
                care can empower families to feel confident and capable.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p>
                After becoming a parent myself, I knew I wanted to dedicate my
                work to ensuring every family has access to the kind of support
                that makes a real difference. That's what led me to pursue
                certification as a DONA birth and postpartum doula, as well as
                becoming a Certified Lactation Consultant.
              </p>
            </FadeIn>
            <FadeIn delay={0.4}>
              <p>
                Today, I combine evidence-based knowledge with genuine empathy
                to help families navigate pregnancy, birth, and the postpartum
                period. Whether you're preparing for your first baby or your
                fifth, I believe every family deserves personalized,
                non-judgmental support.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>Credentials & Training</h2>
          </FadeIn>
          <div className={`mt-8 grid ${grid.gap.tight} ${grid.cols.two}`}>
            {credentials.map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className={`h-full ${card.base} ${card.interactive}`}>
                  <CardContent className="pt-6">
                    <div
                      className={`mb-4 flex items-center justify-center ${icon.container.md}`}
                    >
                      <svg
                        className={`${icon.size.md} text-primary`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {item.icon}
                      </svg>
                    </div>
                    <h3 className="font-semibold text-foreground">
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

      {/* My Philosophy */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>My Philosophy</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-8 ${typography.lead}`}>
              I believe birth is a natural, powerful experience, and every
              family deserves to feel informed, supported, and respected
              throughout their journey.
            </p>
          </FadeIn>
          <div className="mt-8 space-y-4">
            {philosophy.map((item, i) => (
              <FadeIn key={i} delay={(i + 2) * 0.1}>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>Let's Connect</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              I'd love to hear about your journey and discuss how I can support
              your family.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
