import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'
import { spacing, maxWidth, typography, grid, icon } from '@/lib/design-system'
import { Camera, Heart, Clock, Users, Image, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Birth & Family Photography | Nurture Nest Birth',
  description:
    'Professional birth and family photography in Central Nebraska. Capture precious moments from labor and delivery, fresh 48 sessions, and newborn portraits.',
  keywords:
    'birth photography Nebraska, birth photographer Kearney, fresh 48 photos, newborn photography Central Nebraska',
}

export default function PhotographyPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Camera className="h-4 w-4" />
              Photography Services
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className={typography.h1}>Birth & Family Photography</h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className={`mt-6 ${typography.lead}`}>
              Capture the raw, beautiful moments of your birth story and early
              days with baby. Professional photography that preserves these
              fleeting memories for a lifetime.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Inquire About Photography</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/gallery">View Gallery</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Photography Options */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Photography Offerings
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              From the intensity of labor to the quiet moments of early bonding,
              I capture it all with sensitivity and artistry.
            </p>
          </FadeIn>

          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.three}`}>
            <FadeIn delay={0.1}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className={icon.container.lg}>
                    <Heart className={`text-primary ${icon.size.md}`} />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold">
                    Birth Photography
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Documentary-style coverage of your labor, delivery, and
                    golden hour. On-call availability from 38 weeks to capture
                    whenever baby decides to arrive.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      On-call from 38 weeks
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Labor through golden hour
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Hospital or birth center
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Home birth available
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className={icon.container.lg}>
                    <Clock className={`text-primary ${icon.size.md}`} />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold">
                    Fresh 48 Session
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Lifestyle portraits within the first 48 hours after birth.
                    Captures your family in the hospital or at home during those
                    precious first moments together.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Within 48 hours of birth
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Hospital or home setting
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Natural, lifestyle approach
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Siblings welcome
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className={icon.container.lg}>
                    <Users className={`text-primary ${icon.size.md}`} />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-semibold">
                    Newborn & Family
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    In-home lifestyle sessions celebrating your growing family.
                    Relaxed, natural portraits in the comfort of your own space
                    within the first few weeks.
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      1-3 weeks after birth
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      In-home lifestyle
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Whole family included
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      Pets welcome
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Why Photography Matters */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn direction="down">
            <h2 className={`text-center ${typography.h2}`}>
              Why Capture These Moments?
            </h2>
          </FadeIn>

          <div className={`mt-12 grid ${grid.gap.large} ${grid.cols.two}`}>
            <FadeIn delay={0.1}>
              <div className="flex gap-4">
                <div className={icon.container.md}>
                  <Image className={`text-primary ${icon.size.sm}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Memory Preservation
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Birth and the newborn phase go by in a blur. Professional
                    photos preserve details you might otherwise forget - the way
                    they curled up, their tiny features, your expressions of awe
                    and love.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="flex gap-4">
                <div className={icon.container.md}>
                  <Star className={`text-primary ${icon.size.sm}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Present in the Moment
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    When you have a photographer, you can focus entirely on your
                    birth experience and bonding with baby. No fumbling with
                    phones or asking someone to take photos.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex gap-4">
                <div className={icon.container.md}>
                  <Heart className={`text-primary ${icon.size.sm}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Healing & Processing
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Many families find that viewing their birth photos helps
                    them process the experience, fill in memory gaps, and feel
                    empowered by seeing their strength.
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex gap-4">
                <div className={icon.container.md}>
                  <Users className={`text-primary ${icon.size.sm}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Family Legacy
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    These images become treasured family heirlooms. Someday your
                    child will see the moment they came into the world and feel
                    the love that surrounded them.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Add-On or Standalone */}
      <section
        className={`bg-muted/30 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Flexible Booking Options
              </h2>
              <p className="mt-4 text-muted-foreground">
                Photography services can be added to any doula package for a
                seamless experience, or booked as a standalone service. As your
                doula AND photographer, I already know your preferences, birth
                plan, and have built trust with you - making for more natural,
                intimate images.
              </p>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Add to Birth Doula Package:
                    </strong>{' '}
                    I&apos;m already there supporting you, so adding photography
                    is seamless
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Standalone Booking:
                    </strong>{' '}
                    Fresh 48 and newborn sessions available without doula
                    services
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Complete Care + Photography:
                    </strong>{' '}
                    The ultimate package for families who want it all
                  </span>
                </div>
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
            <h2 className={typography.h2}>Interested in Photography?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Let&apos;s chat about capturing your birth story and early family
              moments. Contact me to discuss packages and availability.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Contact Me</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
