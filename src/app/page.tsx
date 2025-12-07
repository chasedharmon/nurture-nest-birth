import { Hero } from '@/components/marketing/hero'
import { ServicesOverview } from '@/components/marketing/services-overview'
import {
  LocalBusinessStructuredData,
  OrganizationStructuredData,
} from '@/components/seo/structured-data'

export default function Home() {
  return (
    <>
      <LocalBusinessStructuredData />
      <OrganizationStructuredData />
      <Hero />
      <ServicesOverview />
    </>
  )
}
