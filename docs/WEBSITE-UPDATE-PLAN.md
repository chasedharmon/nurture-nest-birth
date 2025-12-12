# Nurture Nest Birth - Website Update Plan

**Created:** December 11, 2025
**Based on:** Wife's testing feedback + Doula training pricing guidelines

---

## Executive Summary

This plan addresses all feedback from the frontend testing, organized into 4 phases. Each phase builds on the previous and can be reviewed before moving to the next.

**Estimated scope:** ~15-20 files to modify across all phases

---

## Phase 1: Critical Terminology & Legal Fixes

**Priority:** HIGH - Do this first (has legal/professional implications)
**Scope:** Site-wide find and replace + config updates

### 1.1 Credential Terminology Updates

| Current (Wrong)                   | Correct                                    | Notes                                           |
| --------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| "DONA Certified Birth Doula"      | "Professionally Trained Birth Doula"       | Add "DONA certification in progress" if desired |
| "DONA Certified Postpartum Doula" | "Professionally Trained Postpartum Doula"  | Same as above                                   |
| "Certified Lactation Consultant"  | "Certified Breastfeeding Specialist"       | CRITICAL - legal distinction from IBCLC         |
| "Lactation Consulting"            | "Breastfeeding Support"                    | Service name change                             |
| "Car Seat Safety Expert"          | "Child Passenger Safety Technician (CPST)" | Or "Certified Car Seat Technician"              |

### 1.2 Service Name Changes

| Current              | New Name                 |
| -------------------- | ------------------------ |
| Postpartum Care      | Postpartum Doula Support |
| Lactation Consulting | Breastfeeding Support    |

### 1.3 Files to Update

- [ ] `src/config/site.ts` - Central config (credentials array, services array)
- [ ] `src/app/page.tsx` - Homepage
- [ ] `src/app/about/page.tsx` - About page credentials
- [ ] `src/app/services/page.tsx` - Services overview
- [ ] `src/app/services/postpartum-care/page.tsx` - Rename file + content
- [ ] `src/app/services/lactation/page.tsx` - Rename references
- [ ] `src/app/faq/page.tsx` - FAQ answers
- [ ] `src/app/testimonials/page.tsx` - Service references
- [ ] `src/app/pricing/page.tsx` - Service names
- [ ] `src/components/marketing/*` - Any hardcoded references
- [ ] Footer component (if credentials listed)

### 1.4 Deliverable

All credential and service terminology is legally accurate and consistent across the entire site.

---

## Phase 2: Navigation & Service Structure

**Priority:** HIGH - Users can't find pages
**Scope:** Navigation updates + service page restructuring

### 2.1 Fix Missing Service Navigation

**Problem:** Car Seat Safety and Infant Massage pages exist but aren't linked from the Services page.

**Solution:** Add all 6 services to the Services overview page with appropriate categorization.

### 2.2 New Service Structure

Based on feedback about what can/cannot be standalone:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY SERVICES                         │
│              (Can be purchased standalone)                  │
├─────────────────────────────────────────────────────────────┤
│  Birth Doula Support          Postpartum Doula Support      │
│  - Prenatal visits            - Daytime support             │
│  - On-call from 38 weeks      - Overnight support (optional)│
│  - Labor & delivery support   - Feeding assistance          │
│  - Initial postpartum visit   - Newborn care guidance       │
│                                                             │
│  Includes: Sibling prep guidance, breastfeeding support,    │
│  car seat check, infant massage instruction (as applicable) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BUNDLED PACKAGE                           │
│                (Discounted when combined)                   │
├─────────────────────────────────────────────────────────────┤
│  Complete Care Package = Birth Doula + Postpartum Doula     │
│  - Everything in both services                              │
│  - Continuity of care through entire journey                │
│  - Discounted bundle rate                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               INCLUDED SUPPORT SERVICES                     │
│        (Included with doula packages, not standalone)       │
├─────────────────────────────────────────────────────────────┤
│  • Breastfeeding Support - included with postpartum         │
│  • Sibling Preparation - included with either package       │
│  • Car Seat Safety Check - included with either package     │
│  • Infant Massage Instruction - included with postpartum    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              COMMUNITY & STANDALONE OPTIONS                 │
├─────────────────────────────────────────────────────────────┤
│  • Community Car Seat Check Days (free/donation-based)      │
│  • Infant Massage Class (standalone group class option)     │
│  • Photography Services (future addition)                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Services Page Redesign

Current: 6 equal service cards
New: Tiered presentation showing primary vs included services

### 2.4 Files to Update

- [ ] `src/app/services/page.tsx` - Complete redesign
- [ ] `src/config/site.ts` - Update services structure
- [ ] Navigation components (if service links are hardcoded)
- [ ] Individual service pages - Add "included with" messaging

### 2.5 Deliverable

Clear service hierarchy where users understand what's standalone vs included. All service pages accessible.

---

## Phase 3: Content Updates (Page by Page)

**Priority:** MEDIUM - Improve accuracy and messaging
**Scope:** Individual page content updates

### 3.1 Homepage Updates

- [ ] **Stats section**: Change from clickable buttons to static badges
- [ ] **Content density**: Tighten up - page feels heavy
- [ ] **Services section**: Update with new service names
- [ ] **Geographic language**: Change from "in-home Central Nebraska" to "comprehensive support" + mention willingness to travel
- [ ] **Comprehensive care section**: Fix "Car Seat Safety Expert" → "CPST"

### 3.2 Birth Doula Page Updates

- [ ] **Journey timeline**: Add "Contract Signing" step between Initial Consultation and Prenatal Visit #1
- [ ] **Home birth disclaimer**: Add note about home birth availability varying by state (not legal in Nebraska)
- [ ] **Pricing**: Remove or simplify (TBD based on Phase 4 decisions)

### 3.3 Postpartum Doula Page Updates (formerly Postpartum Care)

- [ ] **Rename**: All references to "Postpartum Doula Support"
- [ ] **Overnight support**: Reword from "guaranteed sleep" to "peace of mind knowing baby has support"
- [ ] **Daytime visits**: Change from rigid schedule to "examples of how I can help"
- [ ] **Mood disorders**: Add statistics about non-birthing parent (fathers) experiencing PPD
- [ ] **CTA section**: Rewrite to start with "I'm here to help your family..."

### 3.4 Breastfeeding Support Page Updates (formerly Lactation)

- [ ] **Remove all "consulting/consultant" language**
- [ ] **Stats**: Change 24-48h stat to percentage format for consistency
- [ ] **Add IBCLC referral note**: "For complex issues, I'll refer you to a certified IBCLC"
- [ ] **Remove sections**: Tongue/lip ties, special situations
- [ ] **Session expectations**: Make flexible, show "common examples" not rigid process
- [ ] **Add fed-is-best messaging**: Paced bottle feeding support, "I'll meet you where you're at"
- [ ] **Add human milk benefits stats**
- [ ] **Remove**: Written summary promise
- [ ] **FAQ section**: Remove insurance coverage info (can't bill insurance as CBS)
- [ ] **Urgent section**: Reword to "contact your medical provider" not "call me"

### 3.5 Sibling Preparation Page Updates

- [ ] **Reframe service**: Not standalone - included with doula services
- [ ] **Clarify offering**: Helping parents navigate conversations + involving siblings post-birth
- [ ] **Session details**: Make flexible, show common examples

### 3.6 Car Seat Safety Page Updates

- [ ] **Reconcile stats**: 73% on homepage vs 46% on page - clarify or unify
- [ ] **Remove standalone pricing**
- [ ] **Add note about community check days** (for blog/social promotion)
- [ ] **Clarify**: Included with doula services

### 3.7 Infant Massage Page Updates

- [ ] **Remove**: Session options and pricing sections entirely
- [ ] **Remove**: Class format section
- [ ] **Keep**: Benefits section (this is good)
- [ ] **Add**: Note that this is included with postpartum doula support

### 3.8 FAQ Page Updates

- [ ] **Fix styling**: Large space between description and first accordion
- [ ] **Areas served**: Update to broader approach ("based in Central Nebraska, willing to travel")
- [ ] **Lactation verbiage**: Update all references
- [ ] **Cesarean birth**: Add note about OR presence being at discretion of Dr/Anesthesiologist

### 3.9 Resources Page Updates

**Keep as free resources (good for SEO):**

- Car seat safety reference
- Postpartum prep guide
- Hospital bag checklist

**Move to client portal (paid customers only):**

- Everything else

### 3.10 About Page (Minor)

- [ ] Update credentials to match new terminology
- [ ] Broaden geographic language
- [ ] Note: "Real" content and potential "About v2" (multi-doula business) is future work

### 3.11 Testimonials Page

- [ ] Update service name references (Lactation Consulting → Breastfeeding Support, etc.)

### 3.12 Deliverable

All page content reflects accurate information, flexible service delivery, and proper terminology.

---

## Phase 4: Pricing Strategy Implementation

**Priority:** MEDIUM-HIGH - Business critical but needs decisions
**Scope:** Pricing page overhaul + potential removal of prices from service pages

### 4.1 Key Business Decisions Needed

Before implementing, confirm these decisions:

| Question                 | Recommendation                                          | Your Decision      |
| ------------------------ | ------------------------------------------------------- | ------------------ |
| Show pricing on website? | Show packages without exact prices, or "Starting at $X" | **\*\***\_**\*\*** |
| Retainer vs Deposit?     | **Retainer** (non-refundable) per training              | **\*\***\_**\*\*** |
| Payment plans?           | Optional, but require retainer regardless               | **\*\***\_**\*\*** |
| Birth doula balance due? | By 36 weeks per training                                | **\*\***\_**\*\*** |
| Postpartum payment?      | Pay-as-you-go with retainer for first booking           | **\*\***\_**\*\*** |

### 4.2 Recommended Pricing Structure (Based on Training)

```
┌─────────────────────────────────────────────────────────────┐
│                    BIRTH DOULA SUPPORT                      │
├─────────────────────────────────────────────────────────────┤
│  Investment: $X,XXX - $X,XXX                                │
│  (Or: "Starting at $X,XXX" or "Contact for pricing")        │
│                                                             │
│  Includes:                                                  │
│  • Initial consultation                                     │
│  • 2 prenatal visits                                        │
│  • On-call support from 38 weeks                            │
│  • Continuous labor & delivery support                      │
│  • 1 postpartum visit                                       │
│  • Sibling preparation guidance                             │
│  • Car seat safety check                                    │
│                                                             │
│  Payment: 50% retainer at contract signing                  │
│           50% due by 36 weeks                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 POSTPARTUM DOULA SUPPORT                    │
├─────────────────────────────────────────────────────────────┤
│  Daytime Support: $XX/hour (4-hour minimum)                 │
│  Overnight Support: $XXX/shift (8-hour minimum)             │
│                                                             │
│  Includes:                                                  │
│  • Breastfeeding/feeding support                            │
│  • Newborn care assistance                                  │
│  • Light household help                                     │
│  • Emotional support                                        │
│  • Infant massage instruction                               │
│  • Sibling adjustment support                               │
│                                                             │
│  Payment: Retainer structure per training guidelines        │
│  - <2 weeks out: 100% at signing                            │
│  - >2 weeks out: 50% retainer, invoice remaining weekly     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  COMPLETE CARE PACKAGE                      │
│              (Birth + Postpartum Combined)                  │
├─────────────────────────────────────────────────────────────┤
│  Investment: $X,XXX + Postpartum hours at $XX/hr            │
│  Save $XXX when you bundle!                                 │
│                                                             │
│  Everything in Birth Doula PLUS:                            │
│  • Seamless continuity of care                              │
│  • Priority scheduling for postpartum                       │
│  • Discounted hourly rate                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Pricing Research (Completed December 2025)

**Nebraska Market (from DoulaMatch.net):**
| Doula | Birth Fee | Postpartum Rate |
|-------|-----------|-----------------|
| Joyce Dykema (DONA certified) | $2,400 | $35/hr |
| Birth Plus | $1,200–$2,400 | $35–$50/hr |
| Mother Love Birth Doula | $1,000–$1,250 | - |
| Beautiful Beginnings | $750–$1,800 | - |
| The Childbirth Circle | $1,950 | - |
| Peaceful Miracles | $750–$850 | - |
| Four Loves Doula+ | $825–$925 | - |
| Faithful Fruitions | $950 | - |

**Nebraska Average:** $750–$2,400 for birth doula (median ~$1,200)

**National Context:**

- Smaller areas/lower COL: $800–$1,500
- Large metro areas: up to $3,500+
- Postpartum daytime: $30–$80/hr nationally
- Postpartum overnight: $40–$80/hr (or $320–$800/shift)

**From training guidelines:**

- Hourly range: $35-$75+ per hour
- 24-hour shift: $600-$1,500
- Increase $5/hour every 3rd client
- Additional charges for: multiples, nights/weekends, extended hours

**Recommended Starting Prices for Nurture Nest Birth:**

- Birth Doula: **Starting at $1,500** (positions above average, room to grow)
- Postpartum Doula: **Starting at $40/hr** (4-hour minimum)
- Complete Care Bundle: **Starting at $1,800** + postpartum at $35/hr (discounted)

_Sources: [DoulaMatch.net](https://doulamatch.net/list/birth/ne), [Wildwood Birth](https://www.wildwoodbirthpdx.com/how-much-does-a-doula-cost), [Bornbir](https://www.bornbir.com/blog/postpartum-doula-pay-rate)_

### 4.4 What to Remove from Service Pages

- [ ] Car Seat Safety page: Remove all pricing
- [ ] Infant Massage page: Remove all pricing
- [ ] Breastfeeding Support page: Remove standalone pricing (if any)
- [ ] Sibling Prep page: Remove standalone pricing (if any)

### 4.5 Pricing Page Options

**Option A: Show Full Pricing**

- Transparent, builds trust
- May scare off price-sensitive leads
- Attracts qualified leads who can afford services

**Option B: Show "Starting At" Pricing**

- Gives ballpark without commitment
- Allows flexibility in actual quotes
- "Starting at $1,200 for Birth Doula Support"

**Option C: No Pricing, "Contact for Custom Quote"**

- Maximum flexibility
- May frustrate users who want quick answers
- Better for premium positioning

**Recommendation:** Option B - "Starting at" pricing with clear package inclusions

### 4.6 Files to Update

- [ ] `src/app/pricing/page.tsx` - Complete overhaul
- [ ] `src/config/site.ts` - Update pricing config
- [ ] Individual service pages - Remove standalone pricing
- [ ] Add retainer/payment terms section or link to FAQ

### 4.7 Deliverable

Clear, professional pricing presentation that reflects business model and protects your time investment.

---

## Implementation Order

```
Week 1: Phase 1 (Terminology)
├── Update site config
├── Find/replace across all pages
├── Test all pages for consistency
└── Deploy & review

Week 2: Phase 2 (Navigation & Structure)
├── Redesign services page
├── Update service hierarchy
├── Ensure all pages accessible
└── Deploy & review

Week 3: Phase 3 (Content Updates)
├── Homepage updates
├── Birth Doula page
├── Postpartum Doula page
├── Breastfeeding Support page
├── Other service pages
├── FAQ, Resources, Testimonials
└── Deploy & review

Week 4: Phase 4 (Pricing)
├── Finalize business decisions
├── Implement pricing page
├── Remove prices from included services
├── Add payment terms info
└── Final deploy & full review
```

---

## Decisions Confirmed (December 11, 2025)

| Question                         | Decision                                                                |
| -------------------------------- | ----------------------------------------------------------------------- |
| Service name for feeding support | **Infant Feeding Support** (inclusive of breastfeeding, formula, combo) |
| Geographic approach              | **Central Nebraska + willing to travel**                                |
| Pricing display                  | **Option B: "Starting at $X"**                                          |
| Overnight postpartum             | **Remove for now** (save code for future)                               |
| Photography                      | **Add now** as a service                                                |

---

## Files Reference (All Phases)

| File                                        | Phase   | Changes                        |
| ------------------------------------------- | ------- | ------------------------------ |
| `src/config/site.ts`                        | 1, 2, 4 | Credentials, services, pricing |
| `src/app/page.tsx`                          | 1, 3    | Homepage content               |
| `src/app/about/page.tsx`                    | 1, 3    | Credentials, bio               |
| `src/app/services/page.tsx`                 | 1, 2    | Complete redesign              |
| `src/app/services/birth-doula/page.tsx`     | 1, 3    | Content updates                |
| `src/app/services/postpartum-care/page.tsx` | 1, 3    | Rename + content               |
| `src/app/services/lactation/page.tsx`       | 1, 3    | Rename + major content         |
| `src/app/services/sibling-prep/page.tsx`    | 1, 3    | Content updates                |
| `src/app/services/car-seat-safety/page.tsx` | 1, 3, 4 | Content + pricing removal      |
| `src/app/services/infant-massage/page.tsx`  | 1, 3, 4 | Content + pricing removal      |
| `src/app/pricing/page.tsx`                  | 1, 4    | Complete overhaul              |
| `src/app/faq/page.tsx`                      | 1, 3    | Styling + content              |
| `src/app/resources/page.tsx`                | 3       | Trim free resources            |
| `src/app/testimonials/page.tsx`             | 1       | Service name updates           |
| `src/app/contact/page.tsx`                  | 1       | Service references             |
| `src/components/marketing/*`                | 1, 3    | Various updates                |

---

## Ready to Start?

Once you confirm the questions above, I can begin with **Phase 1: Critical Terminology Fixes** which will touch every page but is mostly find-and-replace work.

Let me know:

1. Answers to the 5 questions above
2. If you want to proceed with Phase 1 now
3. Any adjustments to this plan
