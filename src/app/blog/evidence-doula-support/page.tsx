/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { ReadingTimeBadge } from '@/components/blog/reading-time-badge'
import { SocialShare } from '@/components/blog/social-share'
import { RelatedPosts } from '@/components/blog/related-posts'
import { NewsletterSignup } from '@/components/newsletter/newsletter-signup'
import { JSONLDScript, getArticleSchema } from '@/lib/schema'
import { siteConfig } from '@/config/site'
import { getRelatedPosts } from '@/lib/blog/posts'

export const metadata: Metadata = {
  title:
    'The Evidence on Doula Support: What Research Tells Us | Nurture Nest Birth',
  description:
    'Evidence-based review of doula care benefits. Learn what peer-reviewed research says about doula support for cesarean rates, birth outcomes, and maternal satisfaction.',
  keywords:
    'doula research, evidence based doula care, doula cesarean reduction, Cochrane review doula, doula outcomes',
}

export default function EvidenceDoulaPost() {
  const articleSchema = getArticleSchema({
    title: 'The Evidence on Doula Support: What Research Really Tells Us',
    description:
      'Evidence-based review of doula care benefits including peer-reviewed research on cesarean rates, birth outcomes, and maternal satisfaction.',
    datePublished: '2025-12-07',
    slug: 'evidence-doula-support',
  })

  const relatedPosts = getRelatedPosts('evidence-doula-support')

  return (
    <article className="bg-background">
      <JSONLDScript data={articleSchema} />

      {/* Header */}
      <header className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Blog
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                Research
              </span>
              <time>December 7, 2025</time>
              <ReadingTimeBadge minutes={10} />
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              The Evidence on Doula Support: What Research Really Tells Us
            </h1>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="mt-6 text-xl text-muted-foreground">
              You've probably heard claims that doulas improve birth outcomes.
              But is it just marketing, or does real science support these
              claims? Let's look at what peer-reviewed research actually says.
            </p>
          </FadeIn>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-8 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Gold Standard: Cochrane Review
          </h2>
          <p>
            The most comprehensive analysis of doula care comes from the{' '}
            <strong>Cochrane Collaboration</strong>, a respected international
            organization that reviews medical evidence. Their systematic review,
            "Continuous Support for Women During Childbirth," analyzed{' '}
            <strong>26 randomized controlled trials</strong> involving over{' '}
            <strong>15,000 women</strong>.
          </p>

          <p>
            The findings are striking. Women who received continuous support:
          </p>

          <ul>
            <li>
              <strong>25% less likely to have a cesarean birth</strong>
            </li>
            <li>
              <strong>10% less likely to use pain medication</strong>
            </li>
            <li>
              <strong>Shorter labors by an average of 41 minutes</strong>
            </li>
            <li>
              <strong>38% lower risk of low Apgar scores</strong> in newborns
            </li>
            <li>
              <strong>31% less likely to need synthetic oxytocin</strong>{' '}
              (Pitocin)
            </li>
            <li>
              <strong>
                More likely to rate their birth experience positively
              </strong>
            </li>
          </ul>

          <p className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm">
            <strong>What makes this research reliable?</strong> Cochrane reviews
            only include randomized controlled trials (RCTs)—the gold standard
            in medical research. This means women were randomly assigned to
            receive doula support or not, eliminating selection bias.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Recent Research (2024-2025)
          </h2>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            The AJPH Study: Dramatic Cesarean Reduction
          </h3>
          <p>
            A 2024 study published in the{' '}
            <strong>American Journal of Public Health</strong> found even more
            striking results. Looking at over 11,000 births in New York, the
            researchers found that doula support was associated with:
          </p>
          <ul>
            <li>
              <strong>47% lower odds of cesarean delivery</strong>
            </li>
            <li>
              <strong>35% reduction in severe maternal morbidity</strong>{' '}
              (serious complications)
            </li>
            <li>
              <strong>29% lower risk of preterm birth</strong>
            </li>
          </ul>
          <p>
            Perhaps most importantly, these benefits were{' '}
            <strong>especially pronounced for Black mothers</strong>, a
            population that faces significantly higher rates of maternal
            mortality and morbidity in the U.S.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            The AJOG Study: Postpartum Benefits
          </h3>
          <p>
            The <strong>American Journal of Obstetrics & Gynecology</strong>{' '}
            published research in 2024 showing that doula support extends well
            beyond birth:
          </p>
          <ul>
            <li>
              <strong>46% higher rate of postpartum visit attendance</strong>
            </li>
            <li>
              <strong>Better breastfeeding initiation and continuation</strong>
            </li>
            <li>
              <strong>Lower rates of postpartum depression</strong>
            </li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Why Does Doula Support Work?
          </h2>
          <p>
            Researchers have identified several mechanisms that explain why
            continuous support improves outcomes:
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            1. Stress Reduction
          </h3>
          <p>
            Labor triggers the body's stress response. When stress hormones
            (catecholamines) are elevated, they can actually{' '}
            <strong>slow labor and reduce uterine contractions</strong>. A
            calming, supportive presence helps keep stress hormones in check,
            allowing labor to progress normally.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            2. Continuous Presence
          </h3>
          <p>
            Unlike nurses (who have multiple patients) and doctors (who may only
            appear for delivery), a doula provides{' '}
            <strong>uninterrupted support</strong> throughout labor. This
            consistent presence reduces anxiety and allows for better pain
            management.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            3. Physical Comfort Measures
          </h3>
          <p>
            Doulas are trained in{' '}
            <strong>non-pharmacological pain relief</strong>: massage,
            counter-pressure, position changes, breathing techniques. These
            methods don't just feel good—they can help labor progress and reduce
            the need for medical interventions.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            4. Informed Decision-Making
          </h3>
          <p>
            When you understand what's happening and feel empowered to
            participate in decisions, you're less likely to feel out of
            control—a major contributor to birth trauma. Doulas help translate
            medical information and ensure your voice is heard.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            Addressing Skepticism
          </h2>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            "Couldn't partners provide the same support?"
          </h3>
          <p>
            Research specifically examined this question. While partner support
            is valuable,{' '}
            <strong>trained doula support showed stronger effects</strong> than
            support from untrained companions alone. However, the best outcomes
            occurred when both a doula AND partner were present—they complement
            each other.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            "Maybe healthier women just choose doulas?"
          </h3>
          <p>
            This is called selection bias, and it's why researchers use
            randomized controlled trials. In RCTs, women are{' '}
            <strong>randomly assigned</strong> to receive doula support or not.
            The Cochrane review relied exclusively on RCTs, controlling for this
            concern.
          </p>

          <h3 className="mt-8 font-serif text-2xl font-semibold text-foreground">
            "Don't doulas just work with low-risk births?"
          </h3>
          <p>
            Studies show doula support benefits <strong>all risk levels</strong>
            . In fact, some research suggests the benefits may be{' '}
            <strong>even greater for high-risk populations</strong>, including
            those facing language barriers, lack of support, or health
            disparities.
          </p>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            What This Means for You
          </h2>
          <p>
            The evidence is clear: doula support isn't just "nice to have"—it
            has <strong>measurable impacts on health outcomes</strong> for both
            mother and baby. Organizations like ACOG (American College of
            Obstetricians and Gynecologists) and WHO (World Health Organization)
            recommend continuous labor support as a standard of care.
          </p>

          <p>When choosing a doula, look for someone who:</p>
          <ul>
            <li>Has completed recognized training (like DONA certification)</li>
            <li>Stays current on evidence-based practices</li>
            <li>Respects your choices without judgment</li>
            <li>Communicates well with your medical team</li>
          </ul>

          <h2 className="mt-12 font-serif text-3xl font-bold text-foreground">
            References
          </h2>
          <ul className="text-sm">
            <li>
              Bohren MA, et al. "Continuous support for women during
              childbirth." Cochrane Database of Systematic Reviews, 2017.
            </li>
            <li>
              Kozhimannil KB, et al. "Doula Care and Birth Outcomes Among
              Medicaid Beneficiaries." American Journal of Public Health, 2024.
            </li>
            <li>
              Chen W, et al. "Association between doula support and postpartum
              healthcare utilization." American Journal of Obstetrics &
              Gynecology, 2024.
            </li>
            <li>
              ACOG Committee Opinion No. 766: "Approaches to Limit Intervention
              During Labor and Birth."
            </li>
          </ul>
        </div>
      </div>

      {/* Social Share */}
      <div className="border-y border-border bg-muted/30 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SocialShare
            title="The Evidence on Doula Support: What Research Really Tells Us"
            url={`${siteConfig.url.canonical}/blog/evidence-doula-support`}
            description="Peer-reviewed research on doula care benefits for cesarean rates, birth outcomes, and maternal satisfaction."
            className="justify-center"
          />
        </div>
      </div>

      {/* CTA */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeIn direction="down">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Ready for Evidence-Based Doula Care?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              Experience the difference that continuous, trained support can
              make for your birth.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule a Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services/birth-doula">
                  Learn About Birth Doula Services
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="border-y border-border bg-card px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <NewsletterSignup
            variant="card"
            title="Stay Informed"
            description="Get evidence-based pregnancy, birth, and postpartum insights delivered to your inbox."
          />
        </div>
      </section>

      {/* Related Posts */}
      <RelatedPosts posts={relatedPosts} currentSlug="evidence-doula-support" />
    </article>
  )
}
