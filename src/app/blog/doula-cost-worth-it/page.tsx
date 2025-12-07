/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'How Much Does a Doula Cost in Nebraska? (2025 Pricing Guide)',
  description:
    'Doula cost in Kearney and Nebraska explained. Learn average fees, what affects pricing, insurance coverage, and why families say doula support is worth every penny.',
  keywords:
    'doula cost Nebraska, how much is a doula, doula fees Kearney, doula insurance coverage, birth doula price',
}

export default function DoulaCostPost() {
  return (
    <article className="bg-background">
      <header className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
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
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              Planning
            </span>
            <time>December 5, 2025</time>
            <span>7 min read</span>
          </div>
          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            How Much Does a Doula Cost? (And Is It Worth It?)
          </h1>
        </div>
      </header>

      <div className="px-6 py-8 lg:px-8">
        <div className="prose prose-lg mx-auto max-w-3xl text-muted-foreground">
          <p className="text-xl">
            Let's talk about the elephant in the room: doula fees. If you're
            considering hiring a doula but wondering if you can afford it—or if
            it's worth the investment—this guide breaks down everything you need
            to know.
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Average Doula Costs in Nebraska
          </h2>
          <p>
            <strong>Birth Doula Support:</strong> $800–$2,000
          </p>
          <p>
            Most birth doula packages in Nebraska range from $800 to $2,000,
            with the average around $1,200–$1,500. In Kearney and central
            Nebraska, you'll typically find rates on the lower end compared to
            Omaha or Lincoln.
          </p>

          <p>
            <strong>What's Included:</strong>
          </p>
          <ul>
            <li>2–3 prenatal visits (1–2 hours each)</li>
            <li>Continuous labor support from active labor through birth</li>
            <li>24/7 on-call availability from 38 weeks until birth</li>
            <li>1 postpartum visit</li>
            <li>Phone/text support throughout pregnancy</li>
          </ul>

          <p>
            <strong>Postpartum Doula Support:</strong> $25–$50/hour
          </p>
          <p>
            Postpartum doulas typically charge hourly, with packages available.
            Daytime shifts are usually $30–$40/hour, while overnight support may
            cost $35–$50/hour.
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            What Affects Doula Pricing?
          </h2>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Experience & Certification
          </h3>
          <p>
            Newer doulas building their practice may charge $600–$1,000, while
            experienced, certified doulas (like DONA-certified professionals)
            typically charge $1,200–$2,000+.
          </p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Location
          </h3>
          <p>
            Urban areas like Omaha and Lincoln tend to have higher rates
            ($1,500–$2,500) compared to smaller communities like Kearney, Grand
            Island, or Hastings.
          </p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            Services Included
          </h3>
          <p>
            Some doulas offer basic packages, while others include extras like:
          </p>
          <ul>
            <li>Additional prenatal visits</li>
            <li>Birth photography</li>
            <li>Placenta encapsulation</li>
            <li>Lactation consulting</li>
            <li>Postpartum visits beyond the first</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Can Insurance Cover Doula Services?
          </h2>
          <p>
            <strong>The good news:</strong> More insurance companies are
            starting to cover doula care!
          </p>

          <p>
            <strong>Nebraska Medicaid:</strong> As of 2023, Nebraska Medicaid
            covers doula services for eligible pregnant individuals. Check with
            your provider for details.
          </p>

          <p>
            <strong>Private Insurance:</strong> Some plans cover doula services
            under maternity benefits. Contact your insurance to ask about:
          </p>
          <ul>
            <li>"Non-medical labor support" coverage</li>
            <li>Whether they reimburse for doula services</li>
            <li>
              What documentation they need (most doulas can provide a superbill)
            </li>
          </ul>

          <p>
            <strong>HSA/FSA:</strong> Doula services often qualify as eligible
            medical expenses that can be paid with HSA or FSA funds.
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            Is a Doula Worth the Cost?
          </h2>
          <p>Here's what families often tell me when I ask this question:</p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            "We Would Have Spent More on Medical Interventions"
          </h3>
          <p>
            Research shows doula support can reduce the need for interventions
            like epidurals, Pitocin, and cesarean births. The potential savings
            on medical bills can offset—or exceed—doula fees.
          </p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            "It Helped My Partner Feel Confident"
          </h3>
          <p>
            Partners often say hiring a doula was the best decision because it
            relieved pressure and gave them guidance on how to help effectively.
          </p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            "The Postpartum Support Was Priceless"
          </h3>
          <p>
            Many families say the emotional support, lactation help, and
            reassurance during those first weeks was invaluable—especially for
            preventing postpartum mood disorders.
          </p>

          <h3 className="font-serif text-2xl font-semibold text-foreground">
            "We Felt Heard and Supported"
          </h3>
          <p>
            The continuous presence of someone who knows you, your preferences,
            and your birth plan creates a level of personalized care that's hard
            to put a price on.
          </p>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            What If I Can't Afford a Doula?
          </h2>
          <p>If cost is a barrier, here are some options:</p>

          <ul>
            <li>
              <strong>Payment plans:</strong> Many doulas (including me!) offer
              flexible payment plans.
            </li>
            <li>
              <strong>Sliding scale fees:</strong> Some doulas adjust rates
              based on income.
            </li>
            <li>
              <strong>Doulas-in-training:</strong> Newer doulas building their
              certification may offer reduced rates or volunteer births.
            </li>
            <li>
              <strong>Community doula programs:</strong> Some nonprofits provide
              free or low-cost doula services.
            </li>
            <li>
              <strong>Ask for doula support as a gift:</strong> Consider asking
              family to contribute toward doula fees instead of buying baby
              gear.
            </li>
          </ul>

          <h2 className="font-serif text-3xl font-bold text-foreground">
            The Bottom Line
          </h2>
          <p>
            Hiring a doula is an investment in your birth experience, your
            postpartum recovery, and your family's wellbeing. While it's not
            pocket change, most families say it was one of the best decisions
            they made.
          </p>
          <p>
            If you're on the fence, I encourage you to schedule a free
            consultation with a doula to discuss your specific situation and see
            if it feels like the right fit.
          </p>
        </div>
      </div>

      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground">
            Ready to Chat About Pricing?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            I offer flexible packages and payment plans for families in Kearney
            and central Nebraska.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  )
}
