/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { spacing, maxWidth, typography, grid } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Postpartum Doula Care | Nurture Nest Birth | Kearney, NE',
  description:
    'Postpartum doula services in Kearney, Nebraska. Expert support for newborn care, recovery, and adjusting to life with baby. Fourth trimester support.',
  keywords:
    'postpartum doula Kearney NE, newborn care, postpartum support Nebraska, fourth trimester',
}

export default function PostpartumCarePage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Postpartum Doula Care
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Support for the Fourth Trimester</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              Nurturing support during the fourth trimester as your family
              adjusts to life with your new baby.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What's Included */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              How I Support You
            </h2>
          </FadeIn>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            {[
              {
                title: 'Newborn Care Education',
                desc: "Learn bathing, diapering, swaddling, and understanding your baby's cues.",
              },
              {
                title: 'Feeding Support',
                desc: 'Breastfeeding assistance, bottle feeding guidance, and combination feeding strategies.',
              },
              {
                title: 'Emotional Support',
                desc: 'A listening ear as you process your birth and adjust to parenthood.',
              },
              {
                title: 'Light Household Help',
                desc: 'Meal prep, laundry, and tidying so you can focus on recovery and bonding.',
              },
              {
                title: 'Sibling Support',
                desc: 'Help older children adjust and bond with their new sibling.',
              },
              {
                title: 'Flexible Scheduling',
                desc: "Daytime, overnight, or weekend visits based on your family's needs.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Card className="h-full border-2">
                  <CardContent className="pt-6">
                    <h3 className="font-serif text-xl font-semibold text-foreground">
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

      {/* The Fourth Trimester */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <h2 className={typography.h2}>The Fourth Trimester</h2>
          </FadeIn>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <FadeIn delay={0.1}>
              <p>
                The weeks and months after birth are a time of profound
                adjustment for the entire family. Your body is healing, your
                baby is learning to be earthside, and you're navigating new
                rhythms together.
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p>
                As your postpartum doula, I provide non-judgmental support while
                you find your unique parenting style. Whether this is your first
                baby or your fifth, every postpartum experience is different,
                and you deserve knowledgeable, compassionate care.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <p>I can help you:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Establish feeding routines that work for your family</li>
                <li>Understand newborn sleep patterns</li>
                <li>Recognize signs of postpartum mood changes</li>
                <li>Process your birth experience</li>
                <li>Care for yourself while caring for baby</li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn direction="down">
            <h2 className={typography.h2}>You Don't Have to Do This Alone</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              Let's create a postpartum plan that supports your whole family.
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
