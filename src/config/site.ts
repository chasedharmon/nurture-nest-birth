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
    tagline: 'Compassionate Doula Support in Kearney, Nebraska',
    description:
      'DONA-certified doula providing birth support, postpartum care, and lactation consulting in Kearney and central Nebraska.',
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
    'DONA Certified Birth Doula',
    'DONA Certified Postpartum Doula',
    'Certified Lactation Consultant',
    'Child Passenger Safety Technician (CPST)',
    'Certified Infant Massage Instructor (CIMI)',
    'Family Studies Degree',
    'Home Visitation Specialist',
  ],

  // Services (for navigation and metadata)
  services: [
    {
      slug: 'birth-doula',
      name: 'Birth Doula',
      shortDescription: 'Continuous support during labor and delivery',
    },
    {
      slug: 'postpartum-care',
      name: 'Postpartum Care',
      shortDescription: 'In-home support during the fourth trimester',
    },
    {
      slug: 'lactation',
      name: 'Lactation Consulting',
      shortDescription: 'Expert breastfeeding guidance and support',
    },
    {
      slug: 'sibling-prep',
      name: 'Sibling Preparation',
      shortDescription: 'Preparing older siblings for a new baby',
    },
    {
      slug: 'car-seat-safety',
      name: 'Car Seat Safety',
      shortDescription: 'Certified car seat installation checks and education',
    },
    {
      slug: 'infant-massage',
      name: 'Infant Massage',
      shortDescription: 'Learn gentle massage techniques to bond with baby',
    },
  ],

  // SEO & Metadata
  seo: {
    title: 'Nurture Nest Birth | DONA Certified Doula in Kearney, NE',
    description:
      'DONA-certified birth doula, postpartum care, and lactation consulting in Kearney, Nebraska. Compassionate support for your birth journey.',
    keywords: [
      'doula Kearney NE',
      'birth doula Nebraska',
      'postpartum doula Kearney',
      'lactation consultant Kearney',
      'DONA certified doula',
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
  pricing: {
    currency: 'USD',
    packages: {
      birthDoula: {
        price: 1200,
        range: '1,000-1,500', // Display range if pricing varies
      },
      postpartumCare: {
        hourly: 40,
        packageHours: [10, 20, 40],
      },
      lactation: {
        initialConsult: 150,
        followUp: 75,
      },
      siblingPrep: {
        single: 200,
        group: 150,
      },
    },
    paymentOptions: [
      'Payment plans available',
      'HSA/FSA accepted',
      'Sliding scale for financial hardship',
    ],
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
  testimonials: [
    {
      id: '1',
      name: 'Sarah M.',
      location: 'Kearney, NE',
      service: 'Birth Doula',
      quote:
        'Having a doula made all the difference in my birth experience. The support and guidance were invaluable, and I felt empowered throughout my entire labor.',
      rating: 5,
      featured: true, // Show on homepage
    },
    {
      id: '2',
      name: 'Jessica L.',
      location: 'Grand Island, NE',
      service: 'Postpartum Care',
      quote:
        'The postpartum support was exactly what I needed. From breastfeeding help to just having someone to talk to, I felt cared for during such a vulnerable time.',
      rating: 5,
      featured: true,
    },
    {
      id: '3',
      name: 'Amanda K.',
      location: 'Hastings, NE',
      service: 'Lactation Consulting',
      quote:
        'I was ready to give up on breastfeeding until I worked with my lactation consultant. Her patience and expertise helped us succeed when I thought it was impossible.',
      rating: 5,
      featured: true,
    },
    {
      id: '4',
      name: 'Emily R.',
      location: 'Kearney, NE',
      service: 'Birth Doula',
      quote:
        'Professional, knowledgeable, and incredibly supportive. I recommend this doula service to every expecting parent I meet!',
      rating: 5,
      featured: false,
    },
  ],
} as const

// Type exports for TypeScript autocomplete
export type SiteConfig = typeof siteConfig
export type Service = (typeof siteConfig.services)[number]
export type Testimonial = (typeof siteConfig.testimonials)[number]
