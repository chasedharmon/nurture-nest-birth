import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'FAQ | Nurture Nest Birth | Common Doula Questions',
  description:
    'Frequently asked questions about doula services, birth support, postpartum care, and lactation consulting in Kearney, Nebraska.',
  keywords:
    'doula FAQ, birth doula questions, postpartum doula cost, what does a doula do',
}

const faqs = [
  {
    question: 'What exactly does a doula do?',
    answer:
      "A doula provides continuous physical, emotional, and informational support before, during, and after birth. I don't provide medical care, but I complement your medical team by offering comfort measures, helping you understand your options, and advocating for your preferences. During labor, this might include massage, positioning suggestions, breathing techniques, and emotional reassurance. Postpartum, I help with newborn care, feeding support, and recovery.",
  },
  {
    question: 'How is a doula different from a midwife or doctor?',
    answer:
      "Doulas provide non-medical support, while midwives and doctors provide clinical care. I don't perform medical tasks like checking dilation, delivering babies, or prescribing medication. Instead, I focus on your comfort, confidence, and understanding of the process. I work alongside your medical providers to ensure you have both excellent clinical care and continuous emotional support.",
  },
  {
    question: 'When should I hire a doula?',
    answer:
      "Many families hire a doula in the second trimester (around 20-28 weeks), which gives us time to build a relationship and prepare thoroughly. However, it's never too early or too late! I've worked with families who hired me in the first trimester and others who reached out just weeks before their due date. The earlier we connect, the more time we have for prenatal visits and planning.",
  },
  {
    question: 'Do you only support unmedicated births?',
    answer:
      "Not at all! I support all types of births—whether you're planning an unmedicated birth, epidural, scheduled cesarean, or are open to seeing how things unfold. My role is to support YOUR choices and help you feel informed and empowered, whatever path your birth takes. Many families who plan for epidurals still benefit greatly from doula support during early labor and throughout the postpartum period.",
  },
  {
    question: "Won't my partner feel replaced if I have a doula?",
    answer:
      "Absolutely not—I support your partner too! I help partners understand what's happening, suggest ways they can help, and give them breaks when needed. Most partners feel relieved to have an experienced professional there to guide them. After the birth, partners often tell me they couldn't have imagined going through it without a doula. I enhance your partner's role, not replace it.",
  },
  {
    question: 'How much does a doula cost?',
    answer:
      "Doula fees vary based on the services and package you choose. Birth doula packages typically include prenatal visits, continuous labor support, and postpartum follow-up. Postpartum doula services are usually charged hourly or in packages. Contact me for current pricing and to discuss what package would work best for your family. Some insurance companies and HSA/FSA accounts cover doula services—I'm happy to provide documentation for reimbursement.",
  },
  {
    question: 'What areas do you serve?',
    answer:
      "I serve Kearney, Grand Island, Hastings, and surrounding communities in central Nebraska. If you're outside this area but interested in my services, reach out—I may be able to accommodate travel or recommend another doula closer to you.",
  },
  {
    question: 'What happens if I go into labor before/after my due date?',
    answer:
      "I'm on call for you from 38 weeks until your baby arrives, regardless of when that is. I keep my client load limited to ensure I'm available when you need me. If you have a planned induction or cesarean, we'll coordinate timing in advance. My on-call availability is included in your birth doula package.",
  },
  {
    question: 'Can you help with breastfeeding?',
    answer:
      'Yes! As a Certified Lactation Consultant, I can provide specialized breastfeeding support. This includes help with latch, addressing pain or supply concerns, pumping strategies, and combination feeding. Lactation support can be part of postpartum doula care or scheduled as standalone consultations.',
  },
  {
    question: 'What if I need to have a cesarean birth?',
    answer:
      'I support cesarean births! Whether planned or unplanned, I can be with you before, during (in many hospitals), and after your cesarean. I help you understand what to expect, advocate for your preferences (like immediate skin-to-skin when possible), support your partner, and provide crucial postpartum care as you recover from major surgery.',
  },
  {
    question: 'Do you work with first-time parents only?',
    answer:
      'Not at all! I work with families welcoming their first baby, second baby, fifth baby, and beyond. Every birth is unique, and experienced parents benefit from doula support too—especially when navigating a new family dynamic, processing a previous birth experience, or simply wanting extra hands and expertise during the postpartum period.',
  },
  {
    question: 'What if I have a high-risk pregnancy?',
    answer:
      "I've supported many families with high-risk pregnancies. While I don't provide medical care, I can offer emotional support, help you navigate complex information, and advocate for your preferences within the context of medical necessity. I work closely with your medical team to ensure you feel supported without compromising safety.",
  },
]

export default function FAQPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Frequently Asked Questions
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your Questions Answered
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-xl text-muted-foreground">
              Everything you need to know about doula support, birth services,
              and working together.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-6">
            {faqs.map((faq, index) => (
              <FadeIn key={index} delay={index * 0.05}>
                <AccordionItem
                  value={`item-${index}`}
                  className="group overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm transition-all hover:shadow-md data-[state=open]:border-primary/40 data-[state=open]:shadow-lg data-[state=open]:shadow-primary/10"
                >
                  <AccordionTrigger className="px-6 py-5 text-left font-serif text-lg font-semibold text-foreground transition-colors hover:bg-primary/5 hover:no-underline [&[data-state=open]]:bg-primary/5 [&[data-state=open]]:text-primary">
                    <span className="flex items-start gap-4">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="flex-1">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pl-[4.5rem] text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </FadeIn>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn direction="down">
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Still Have Questions?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
              I&apos;m here to help! Let&apos;s schedule a free consultation to
              discuss your specific situation.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/about">Learn More About Me</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
