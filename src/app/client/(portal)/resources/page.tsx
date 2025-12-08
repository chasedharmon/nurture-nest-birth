import { getClientSession } from '@/app/actions/client-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  BookOpen,
  Download,
  ExternalLink,
  Heart,
  Baby,
  Stethoscope,
  Phone,
  MapPin,
  CheckSquare,
  FileText,
  Users,
  Car,
  Sparkles,
} from 'lucide-react'

export default async function ClientResourcesPage() {
  const session = await getClientSession()

  if (!session) {
    return null // Layout will redirect
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground mt-2">
          Guides, checklists, and helpful information for your journey
        </p>
      </div>

      {/* Quick Downloads Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Downloadable Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DownloadCard
            title="Hospital Bag Checklist"
            description="Everything you need to pack for birth day"
            icon={<CheckSquare className="h-5 w-5" />}
            href="/resources/hospital-bag-checklist.pdf"
          />
          <DownloadCard
            title="Birth Preferences Worksheet"
            description="A guide to help you think through your birth wishes"
            icon={<FileText className="h-5 w-5" />}
            href="/resources/birth-preferences-worksheet.pdf"
          />
          <DownloadCard
            title="Postpartum Prep Guide"
            description="Preparing your home and support system"
            icon={<Heart className="h-5 w-5" />}
            href="/resources/postpartum-prep-guide.pdf"
          />
          <DownloadCard
            title="Partner Support Guide"
            description="Tips for partners during labor and postpartum"
            icon={<Users className="h-5 w-5" />}
            href="/resources/partner-support-guide.pdf"
          />
          <DownloadCard
            title="Newborn Care Basics"
            description="Essential information for the first weeks"
            icon={<Baby className="h-5 w-5" />}
            href="/resources/newborn-care-basics.pdf"
          />
          <DownloadCard
            title="Car Seat Safety Guide"
            description="Proper installation and safety tips"
            icon={<Car className="h-5 w-5" />}
            href="/resources/car-seat-safety-guide.pdf"
          />
        </div>
      </section>

      {/* What to Expect Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          What to Expect from Your Doula
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Before Birth
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Prenatal visits to discuss your birth preferences and
                      answer questions
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Help creating or refining your birth preferences
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Education about labor stages, comfort measures, and what
                      to expect
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      On-call availability starting at 38 weeks (or as agreed)
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  During Labor
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Continuous physical and emotional support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Comfort measures: massage, positioning, breathing
                      techniques
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Advocacy and communication support with medical team
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Partner support and guidance</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  After Birth
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Immediate postpartum support and breastfeeding initiation
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Postpartum follow-up visit(s)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Birth story processing and emotional support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Referrals to additional resources as needed</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  What a Doula Does NOT Do
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Perform clinical or medical tasks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Make decisions for you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Replace your partner&apos;s role</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>Provide medical advice or diagnoses</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Local Resources Section */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Local Resources - Central Nebraska
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Hospitals & Birth Centers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocalResource
                name="CHI Health Good Samaritan"
                address="10 East 31st Street, Kearney, NE"
                phone="(308) 865-7100"
                description="Level II NICU, Family Birthplace"
              />
              <LocalResource
                name="CHI Health St. Francis"
                address="2620 W Faidley Ave, Grand Island, NE"
                phone="(308) 384-4600"
                description="Labor & Delivery Unit"
              />
              <LocalResource
                name="Mary Lanning Healthcare"
                address="715 N St Joseph Ave, Hastings, NE"
                phone="(402) 463-4521"
                description="Family Birthing Center"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="h-5 w-5 text-primary" />
                Pediatric Care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocalResource
                name="Kearney Pediatrics"
                address="4525 2nd Ave, Kearney, NE"
                phone="(308) 865-2240"
                description="Newborn to adolescent care"
              />
              <LocalResource
                name="CHI Health Clinic Pediatrics"
                address="Multiple locations in Central NE"
                phone="(308) 865-7000"
                description="Part of CHI Health network"
              />
              <p className="text-sm text-muted-foreground italic">
                We recommend scheduling your newborn&apos;s first appointment
                before baby arrives!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Lactation Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocalResource
                name="CHI Health Lactation Services"
                address="Good Samaritan Hospital, Kearney"
                phone="(308) 865-7100"
                description="IBCLCs available for consults"
              />
              <LocalResource
                name="WIC Program"
                address="Central District Health Department"
                phone="(308) 385-5175"
                description="Free breastfeeding support and supplies"
              />
              <p className="text-sm text-muted-foreground italic">
                Your doula can also provide lactation support! Ask us about
                included services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Emergency & Mental Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <LocalResource
                name="Postpartum Support International"
                phone="1-800-944-4773"
                description="24/7 helpline for perinatal mental health"
                link="https://www.postpartum.net"
              />
              <LocalResource
                name="Nebraska Family Helpline"
                phone="1-888-866-8660"
                description="24/7 support for parents and families"
              />
              <LocalResource
                name="Crisis Text Line"
                phone="Text HOME to 741741"
                description="Free 24/7 crisis support via text"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recommended Reading */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Recommended Reading
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BookRecommendation
                title="Ina May's Guide to Childbirth"
                author="Ina May Gaskin"
                description="A classic on natural birth with empowering birth stories"
              />
              <BookRecommendation
                title="The Fourth Trimester"
                author="Kimberly Ann Johnson"
                description="Essential guide to postpartum recovery and self-care"
              />
              <BookRecommendation
                title="Nurture"
                author="Erica Chidi"
                description="Modern guide to pregnancy, birth, and early parenthood"
              />
              <BookRecommendation
                title="The Birth Partner"
                author="Penny Simkin"
                description="Comprehensive guide for partners and support people"
              />
              <BookRecommendation
                title="The Womanly Art of Breastfeeding"
                author="La Leche League"
                description="Time-tested breastfeeding guidance and support"
              />
              <BookRecommendation
                title="Cribsheet"
                author="Emily Oster"
                description="Data-driven guide to infant and toddler decisions"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Questions Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-purple-100 dark:from-primary/20 dark:to-purple-900/20 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Have questions?
              </h3>
              <p className="text-muted-foreground">
                Your doula is here to help. Reach out anytime!
              </p>
            </div>
            <Button asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component for downloadable resources
function DownloadCard({
  title,
  description,
  icon,
  href,
}: {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-primary"
              asChild
            >
              <Link href={href} target="_blank">
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Component for local resources
function LocalResource({
  name,
  address,
  phone,
  description,
  link,
}: {
  name: string
  address?: string
  phone?: string
  description?: string
  link?: string
}) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <h4 className="font-medium text-foreground">{name}</h4>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {address && (
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
          <MapPin className="h-3 w-3" />
          {address}
        </p>
      )}
      {phone && (
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
            className="hover:text-primary"
          >
            {phone}
          </a>
        </p>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
        >
          Visit Website
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
}

// Component for book recommendations
function BookRecommendation({
  title,
  author,
  description,
}: {
  title: string
  author: string
  description: string
}) {
  return (
    <div>
      <h4 className="font-medium text-foreground">{title}</h4>
      <p className="text-sm text-primary">by {author}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  )
}
