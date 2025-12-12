/**
 * Centralized Site Configuration
 *
 * This file contains all business information, contact details, and site metadata.
 * Update this file to change information across the entire website.
 */

export const siteConfig = {
  // Business Information
  business: {
    name: 'Nurture Nest Birth',
    tagline: 'Compassionate Doula Support Based in Central Nebraska',
    description:
      'Professionally trained birth and postpartum doula providing comprehensive support in Central Nebraska and beyond. Willing to travel for the right fit.',
    owner: 'Your Name', // TODO: Update with actual name
    established: 2022, // TODO: Update with actual year
  },

  // Contact Information
  contact: {
    email: 'hello@nurturenestbirth.com', // TODO: Update with actual email
    phone: '(308) 555-0123', // TODO: Update with actual phone
    phoneFormatted: '+13085550123', // For tel: links
    calendly: 'https://calendly.com/nurturenestbirth', // TODO: Update with actual Calendly link
  },

  // Location & Service Area
  location: {
    city: 'Kearney',
    state: 'Nebraska',
    stateAbbr: 'NE',
    zipCode: '68847',
    address: {
      // Physical address (if you want to display it)
      street: '', // Optional
      city: 'Kearney',
      state: 'NE',
      zip: '68847',
    },
    serviceArea: [
      'Kearney',
      'Grand Island',
      'Hastings',
      'Lexington',
      'Central Nebraska',
    ],
    willingToTravel: true,
    travelNote:
      'Based in Central Nebraska, willing to travel for the right fit',
    coordinates: {
      // For map integrations and local SEO
      latitude: 40.6993,
      longitude: -99.0817,
    },
  },

  // Social Media (add when available)
  social: {
    facebook: '', // https://facebook.com/nurturenestbirth
    instagram: '', // https://instagram.com/nurturenestbirth
    linkedin: '', // https://linkedin.com/in/yourprofile
  },

  // Credentials & Certifications
  credentials: [
    'Professionally Trained Birth Doula',
    'Professionally Trained Postpartum Doula',
    'Certified Breastfeeding Specialist',
    'Child Passenger Safety Technician (CPST)',
    'Certified Infant Massage Instructor (CIMI)',
    'Family Studies Degree',
    'Home Visitation Specialist',
  ],

  // Future credentials (for when certifications are obtained)
  futureCredentials: [
    'DONA Certified Birth Doula', // In progress
    'DONA Certified Postpartum Doula', // In progress
  ],

  // Services (for navigation and metadata)
  // Primary services are standalone; included services come with doula packages
  services: {
    primary: [
      {
        slug: 'birth-doula',
        name: 'Birth Doula Support',
        shortDescription: 'Continuous support during labor and delivery',
        standalone: true,
      },
      {
        slug: 'postpartum-doula',
        name: 'Postpartum Doula Support',
        shortDescription: 'Comprehensive support during the fourth trimester',
        standalone: true,
      },
    ],
    included: [
      {
        slug: 'infant-feeding',
        name: 'Infant Feeding Support',
        shortDescription:
          'Guidance for breastfeeding, bottle feeding, and combination feeding',
        includedWith: ['postpartum-doula'],
        note: 'For complex issues, referral to certified IBCLC provided',
      },
      {
        slug: 'sibling-prep',
        name: 'Sibling Preparation',
        shortDescription:
          'Helping parents navigate conversations and involve siblings',
        includedWith: ['birth-doula', 'postpartum-doula'],
      },
      {
        slug: 'car-seat-safety',
        name: 'Car Seat Safety',
        shortDescription: 'CPST-certified car seat checks and education',
        includedWith: ['birth-doula', 'postpartum-doula'],
        note: 'Community check days also available',
      },
      {
        slug: 'infant-massage',
        name: 'Infant Massage',
        shortDescription: 'Learn gentle massage techniques to bond with baby',
        includedWith: ['postpartum-doula'],
      },
    ],
    additional: [
      {
        slug: 'photography',
        name: 'Birth & Family Photography',
        shortDescription:
          'Professional photography to capture precious moments',
        standalone: true,
        note: 'Can be added to any doula package or booked separately',
      },
    ],
  },

  // Legacy flat services array for backward compatibility
  servicesFlat: [
    {
      slug: 'birth-doula',
      name: 'Birth Doula Support',
      shortDescription: 'Continuous support during labor and delivery',
    },
    {
      slug: 'postpartum-doula',
      name: 'Postpartum Doula Support',
      shortDescription: 'Comprehensive support during the fourth trimester',
    },
    {
      slug: 'infant-feeding',
      name: 'Infant Feeding Support',
      shortDescription:
        'Guidance for breastfeeding, bottle feeding, and combination feeding',
    },
    {
      slug: 'sibling-prep',
      name: 'Sibling Preparation',
      shortDescription:
        'Helping parents navigate conversations and involve siblings',
    },
    {
      slug: 'car-seat-safety',
      name: 'Car Seat Safety',
      shortDescription: 'CPST-certified car seat checks and education',
    },
    {
      slug: 'infant-massage',
      name: 'Infant Massage',
      shortDescription: 'Learn gentle massage techniques to bond with baby',
    },
    {
      slug: 'photography',
      name: 'Birth & Family Photography',
      shortDescription: 'Professional photography to capture precious moments',
    },
  ],

  // SEO & Metadata
  seo: {
    title: 'Nurture Nest Birth | Professional Doula in Central Nebraska',
    description:
      'Professionally trained birth and postpartum doula providing compassionate support in Central Nebraska. Infant feeding guidance, car seat safety, and more.',
    keywords: [
      'doula Kearney NE',
      'birth doula Nebraska',
      'postpartum doula Kearney',
      'breastfeeding support Nebraska',
      'professional doula',
      'pregnancy support Nebraska',
      'birth support Grand Island',
      'doula services central Nebraska',
    ],
    ogImage: '/images/og-image.jpg', // TODO: Create and add OG image
    twitterHandle: '@nurturenestbirth', // TODO: Update when Twitter/X account exists
  },

  // URLs
  url: {
    production: 'https://nurturenestbirth.com',
    staging: 'https://nurture-nest-birth.vercel.app', // Vercel preview URL
    canonical: 'https://nurturenestbirth.com',
  },

  // Business Hours (optional - for display or schema markup)
  hours: {
    consultation: 'By appointment',
    availability: 'On-call 24/7 for birth clients from 38 weeks',
  },

  // Pricing (centralized for easier updates)
  // Based on Nebraska market research (Dec 2025): NE range $750-$2,400 for birth doula
  pricing: {
    currency: 'USD',
    displayMode: 'starting_at', // 'full', 'starting_at', or 'contact'
    packages: {
      birthDoula: {
        startingAt: 1500,
        includes: [
          'Initial consultation',
          '2 prenatal visits',
          'On-call support from 38 weeks',
          'Continuous labor & delivery support',
          '1 postpartum visit',
          'Sibling preparation guidance',
          'Car seat safety check',
        ],
        payment: {
          retainer: 50, // percentage
          retainerNote: 'Non-refundable retainer due at contract signing',
          balanceDue: '36 weeks',
        },
      },
      postpartumDoula: {
        hourlyRate: 40,
        minimumHours: 4, // daytime minimum
        includes: [
          'Infant feeding support',
          'Newborn care assistance',
          'Light household help',
          'Emotional support',
          'Infant massage instruction',
          'Sibling adjustment support',
        ],
        payment: {
          // Per training: <2 weeks = 100% upfront, >2 weeks = 50% retainer
          retainerNote: 'Retainer structure based on booking timeline',
        },
      },
      completeCarBundle: {
        startingAt: 1800,
        postpartumRate: 35, // discounted hourly
        discount: 'Save with bundled pricing',
        includes: [
          'Everything in Birth Doula Support',
          'Discounted postpartum hourly rate',
          'Seamless continuity of care',
          'Priority scheduling',
        ],
      },
      photography: {
        startingAt: null, // Contact for pricing
        note: 'Can be added to any package or booked separately',
      },
    },
    paymentOptions: ['HSA/FSA accepted', 'Retainer required (non-refundable)'],
    // Note: Payment plans removed per wife's preference - want to get paid efficiently
  },

  // Feature Flags (for gradually rolling out features)
  features: {
    contactForm: true, // Contact form is fully implemented
    aiChat: false, // Enable when AI chatbot is ready
    testimonials: true, // Enable when testimonials are collected
    blog: true,
    calendar: false, // Enable when Calendly is configured
  },

  // Testimonials (easy to maintain - just add/edit here!)
  // Note: These are placeholder testimonials - update with real ones when available
  testimonials: [
    {
      id: '1',
      name: 'Sarah M.',
      location: 'Kearney, NE',
      service: 'Birth Doula Support',
      quote:
        'Having a doula made all the difference in my birth experience. The support and guidance were invaluable, and I felt empowered throughout my entire labor.',
      rating: 5,
      featured: true, // Show on homepage
    },
    {
      id: '2',
      name: 'Jessica L.',
      location: 'Grand Island, NE',
      service: 'Postpartum Doula Support',
      quote:
        'The postpartum support was exactly what I needed. From feeding help to just having someone to talk to, I felt cared for during such a vulnerable time.',
      rating: 5,
      featured: true,
    },
    {
      id: '3',
      name: 'Amanda K.',
      location: 'Hastings, NE',
      service: 'Infant Feeding Support',
      quote:
        'I was ready to give up on breastfeeding until I got the support I needed. The patience and expertise helped us succeed when I thought it was impossible.',
      rating: 5,
      featured: true,
    },
    {
      id: '4',
      name: 'Emily R.',
      location: 'Kearney, NE',
      service: 'Birth Doula Support',
      quote:
        'Professional, knowledgeable, and incredibly supportive. I recommend this doula service to every expecting parent I meet!',
      rating: 5,
      featured: false,
    },
  ],
} as const

// Type exports for TypeScript autocomplete
export type SiteConfig = typeof siteConfig
export type PrimaryService = (typeof siteConfig.services.primary)[number]
export type IncludedService = (typeof siteConfig.services.included)[number]
export type AdditionalService = (typeof siteConfig.services.additional)[number]
export type ServiceFlat = (typeof siteConfig.servicesFlat)[number]
export type Testimonial = (typeof siteConfig.testimonials)[number]

// Backward compatibility alias
export type Service = ServiceFlat
