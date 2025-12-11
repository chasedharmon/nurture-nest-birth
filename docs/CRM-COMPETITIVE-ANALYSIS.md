# CRM Feature Gap Analysis & Enhancement Roadmap

_Last Updated: December 10, 2025_

## Current State: Nurture Nest Birth CRM

### Your Platform Summary

A comprehensive doula/birth services CRM with **12 major feature systems**:

- Lead Management (pipeline, attribution, activities)
- Client Portal (magic link auth, documents, payments, messages)
- Workflow Automation (visual builder, 8 step types, execution engine)
- Unified Messaging (real-time, threading, read receipts)
- Invoicing & Payments (auto-generation, Stripe integration stubbed)
- Team Management (roles, assignments, revenue sharing)
- Reports & Dashboards (visual builders, custom analytics)
- Email & SMS Templates (Resend live, Twilio stubbed)
- Contracts & Documents (e-signature tracking, storage)
- Multi-Tenancy (org isolation, subscription tiers, usage metering)
- Attribution & Analytics (UTM tracking, referral partners)
- Surveys & NPS (feedback collection, workflow integration)

**Tech Stack**: Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS

---

## Competitive Analysis

### Tier 1: Enterprise CRM (Salesforce, HubSpot, Marketing Cloud)

| Feature                         | Salesforce        | HubSpot           | Marketing Cloud  | **Your CRM**                   |
| ------------------------------- | ----------------- | ----------------- | ---------------- | ------------------------------ |
| AI Lead Scoring                 | Einstein AI       | Breeze AI         | Einstein STO     | **MISSING**                    |
| Predictive Forecasting          | Yes               | Yes               | Yes              | **MISSING**                    |
| AI Content Generation           | Einstein GPT      | Content Agent     | Einstein GenAI   | **MISSING**                    |
| Omnichannel (Phone/Chat/Social) | Yes               | Yes               | Yes              | **Partial** (email/SMS/in-app) |
| Native Mobile App               | Yes               | Yes               | Yes              | **MISSING**                    |
| Calendar Sync (Google/Outlook)  | Yes               | Yes               | Yes              | **MISSING**                    |
| CPQ (Configure-Price-Quote)     | Yes               | Yes               | No               | **MISSING**                    |
| Video Calling                   | Zoom integration  | Yes               | Via integration  | **MISSING**                    |
| Social Media Integration        | Yes               | Yes               | Yes              | **MISSING**                    |
| 24/7 AI Chatbot                 | Agentforce        | Customer Agent    | Agentforce       | **MISSING**                    |
| Duplicate Detection             | Yes               | Auto-merge        | Yes              | **MISSING**                    |
| Multi-touch Attribution         | Yes               | Yes               | Yes              | **Partial** (single-touch)     |
| A/B Testing (Email)             | Yes               | Yes               | Yes              | **MISSING**                    |
| Advanced Segmentation           | Yes               | Lists/Smart Lists | Audience Builder | **MISSING**                    |
| API & Webhooks                  | Full REST/GraphQL | Full REST         | Full REST        | **Partial** (webhooks only)    |

### Tier 2: Service Business CRM (HoneyBook, Dubsado, Jobber)

| Feature                            | HoneyBook         | Dubsado       | Jobber          | **Your CRM**           |
| ---------------------------------- | ----------------- | ------------- | --------------- | ---------------------- |
| Combined Proposal/Contract/Invoice | Yes               | Yes           | Yes             | **Partial** (separate) |
| Client Self-Booking                | Yes               | Yes           | Yes             | **MISSING**            |
| Online Scheduling Page             | Yes               | Yes           | Yes             | **MISSING**            |
| White-Label Client Portal          | Partial           | Yes           | Yes             | **Partial**            |
| QuickBooks Integration             | Yes               | Yes           | Yes             | **MISSING**            |
| Zapier Integration                 | Yes               | Premier only  | Yes             | **MISSING**            |
| AI Follow-Up Suggestions           | Yes               | No            | No              | **MISSING**            |
| Mobile App                         | Yes (iOS/Android) | No (web only) | Yes             | **MISSING**            |
| Payment Plans/Installments         | Yes               | Yes           | Yes             | **MISSING**            |
| Auto-Payment Reminders             | Yes               | Yes           | Yes             | **YES**                |
| Branded Brochures/Proposals        | Yes               | Yes           | No              | **MISSING**            |
| Task Automation                    | Yes               | Yes           | Yes             | **YES**                |
| Client Login Portal                | Yes               | Yes           | Yes             | **YES**                |
| E-Signatures Built-in              | Yes               | Yes           | Via integration | **YES** (stubbed)      |

---

## Feature Gap Analysis

### CRITICAL GAPS (Industry Table Stakes)

| Gap                            | Description                           | Competitors With Feature               |
| ------------------------------ | ------------------------------------- | -------------------------------------- |
| **AI Lead Scoring**            | ML-based conversion prediction        | Salesforce, HubSpot, Zoho, Pipedrive   |
| **Calendar Integration**       | Google/Outlook bi-directional sync    | ALL competitors                        |
| **Client Self-Scheduling**     | Public booking page with availability | HoneyBook, Dubsado, Calendly           |
| **Native Mobile App**          | iOS/Android app for on-the-go         | HoneyBook, Salesforce, HubSpot, Jobber |
| **Payment Plans**              | Installment/recurring payment setup   | HoneyBook, Dubsado, Stripe native      |
| **QuickBooks/Accounting Sync** | Financial data integration            | HoneyBook, Dubsado, Jobber             |

### HIGH-VALUE GAPS (Competitive Differentiation)

| Gap                          | Description                            | Competitors With Feature            |
| ---------------------------- | -------------------------------------- | ----------------------------------- |
| **AI Content Assistant**     | Generate emails, follow-ups, proposals | HubSpot Breeze, Salesforce Einstein |
| **Combined Smart Files**     | Proposal + Contract + Invoice in one   | HoneyBook, Dubsado                  |
| **Duplicate Detection**      | Auto-merge duplicate leads/contacts    | HubSpot, Salesforce                 |
| **A/B Email Testing**        | Subject line/content testing           | HubSpot, Marketing Cloud            |
| **Video Calling**            | In-app consultations                   | HubSpot, Zoom integrations          |
| **Social Media Integration** | Lead capture from Facebook/Instagram   | HubSpot, Salesforce                 |

### NICE-TO-HAVE GAPS (Future Roadmap)

| Gap                         | Description                       | Competitors With Feature       |
| --------------------------- | --------------------------------- | ------------------------------ |
| **AI Chatbot**              | 24/7 automated lead qualification | HubSpot, Salesforce Agentforce |
| **Zapier/Make Integration** | Connect to 5000+ apps             | HoneyBook, Dubsado, most CRMs  |
| **Multi-touch Attribution** | Full journey attribution          | Salesforce, HubSpot Enterprise |
| **GPS/Field Service Tools** | Location tracking for home visits | Jobber, ServiceTitan           |
| **Advanced Segmentation**   | Dynamic audience building         | HubSpot, Marketing Cloud       |
| **White-Label Domain**      | Custom domain for client portal   | Dubsado                        |

---

## Feature Prioritization Matrix

### Scoring Criteria

- **Value**: Revenue impact + user retention (1-10)
- **Effort**: Development complexity + time (1-10, lower is easier)
- **Priority Score**: Value / Effort (higher = do first)

| Feature                      | Value | Effort | Priority | Rationale                                            |
| ---------------------------- | ----- | ------ | -------- | ---------------------------------------------------- |
| **Activate Stripe Live**     | 10    | 3      | **3.33** | Already built; just needs API keys + testing         |
| **Activate SMS/Twilio**      | 8     | 3      | **2.67** | Already stubbed; API key + testing                   |
| **Calendar Integration**     | 9     | 4      | **2.25** | Table stakes; Google Calendar API is well-documented |
| **Payment Plans**            | 9     | 4      | **2.25** | Stripe already stubbed; direct revenue enabler       |
| **Client Self-Scheduling**   | 9     | 5      | **1.80** | Major UX win; Calendly-style page                    |
| **Duplicate Detection**      | 6     | 4      | **1.50** | String matching + merge UI                           |
| **Combined Proposals**       | 7     | 5      | **1.40** | Combines existing features; good UX                  |
| **QuickBooks Integration**   | 7     | 5      | **1.40** | QuickBooks API; common request                       |
| **Native Mobile App (PWA)**  | 8     | 6      | **1.33** | Start with PWA; native later                         |
| **A/B Email Testing**        | 6     | 5      | **1.20** | Workflow engine extension                            |
| **AI Content Assistant**     | 7     | 6      | **1.17** | Claude API integration                               |
| **AI Lead Scoring**          | 8     | 7      | **1.14** | ML model needed; high value but complex              |
| **Video Calling**            | 6     | 6      | **1.00** | Twilio Video or Daily.co                             |
| **Zapier Integration**       | 6     | 7      | **0.86** | Webhook standardization                              |
| **Social Media Integration** | 5     | 7      | **0.71** | Facebook/Instagram APIs change often                 |
| **White-Label Domain**       | 4     | 6      | **0.67** | DNS config + routing                                 |
| **AI Chatbot**               | 5     | 8      | **0.63** | Complex; low priority for doulas                     |
| **GPS/Field Service**        | 3     | 7      | **0.43** | Not core to doula workflow                           |

---

## Recommended Enhancement Roadmap

### Phase 1: Activate Stubbed Features (Weeks 1-2)

**Priority Score: 3.0+ | Effort: Low | Impact: Immediate revenue**

1. **Activate Stripe Live Payments** - Priority: 3.33
   - Enable Stripe checkout sessions
   - Test webhook handlers
   - Add production API keys
   - Files: `src/lib/stripe/`, `src/app/api/webhooks/stripe-payments/`

2. **Activate SMS/Twilio** - Priority: 2.67
   - Configure Twilio credentials
   - Test send path
   - Verify opt-in/out flows
   - Files: `src/lib/sms/client.ts`

### Phase 2: Calendar & Scheduling (Weeks 3-5)

**Priority Score: 2.0+ | Effort: Medium | Impact: Major UX improvement**

3. **Google/Outlook Calendar Sync** - Priority: 2.25
   - OAuth flow for Google Calendar API
   - Bi-directional sync (meetings <-> calendar events)
   - Conflict detection
   - New files: `src/lib/calendar/google.ts`, `src/lib/calendar/outlook.ts`

4. **Client Self-Scheduling** - Priority: 1.80
   - Public booking page with availability slots
   - Service selection during booking
   - Automatic meeting creation
   - New pages: `/book/[slug]`, `/admin/setup/scheduling`

### Phase 3: Payment Enhancements (Weeks 6-7)

**Priority Score: 2.0+ | Effort: Low-Medium | Impact: Revenue enabler**

5. **Payment Plans/Installments** - Priority: 2.25
   - Stripe subscription schedules
   - Auto-charge on schedule
   - Payment plan builder UI
   - Modify: `src/app/actions/invoices.ts`

6. **QuickBooks Integration** - Priority: 1.40
   - OAuth connection to QuickBooks Online
   - Invoice sync (one-way or bi-directional)
   - Customer/client mapping
   - New files: `src/lib/quickbooks/`

### Phase 4: Intelligence & AI (Weeks 8-12)

**Priority Score: 1.0-1.5 | Effort: High | Impact: Competitive advantage**

7. **AI Lead Scoring** - Priority: 1.14
   - Basic rule-based scoring first
   - Graduate to ML model with historical data
   - Score display on lead cards
   - New files: `src/lib/scoring/`

8. **Duplicate Detection & Merge** - Priority: 1.50
   - Fuzzy string matching on name/email/phone
   - Merge UI with field selection
   - Automatic merge suggestions
   - Modify: `src/app/actions/leads.ts`, new component

9. **AI Content Assistant** - Priority: 1.17
   - Claude API for email drafts
   - Template suggestions
   - Follow-up message generation
   - New files: `src/lib/ai/assistant.ts`

### Phase 5: Mobile & UX (Weeks 13-16)

**Priority Score: 1.0-1.4 | Effort: Medium-High | Impact: Market expansion**

10. **Progressive Web App (PWA)** - Priority: 1.33
    - Service worker for offline
    - Push notifications
    - App manifest
    - Installable on iOS/Android

11. **Combined Smart Proposals** - Priority: 1.40
    - Merge proposal + contract + invoice flow
    - Single client signing experience
    - Template builder
    - New pages: `/admin/proposals/`

12. **A/B Email Testing** - Priority: 1.20
    - Variant creation in workflow
    - Split traffic logic
    - Winner selection
    - Modify: `src/lib/workflows/engine.ts`

### Phase 6: Future Enhancements (Weeks 17+)

13. Video Calling (Twilio Video / Daily.co)
14. Zapier/Make Webhook Integration
15. Social Media Lead Capture
16. Advanced Segmentation Builder
17. AI Chatbot for Lead Qualification
18. White-Label Custom Domains

---

## Summary: Your Competitive Position

### Strengths (You're Ahead)

- Visual workflow builder rivals HubSpot's complexity
- Real-time messaging with Supabase Realtime
- Multi-tenancy architecture ready for SaaS scale
- Modern tech stack (Next.js 16, React 19)
- Comprehensive survey/NPS system
- Strong attribution tracking

### Critical Gaps to Close

1. Calendar integration (ALL competitors have this)
2. Client self-scheduling (HoneyBook/Dubsado standard)
3. Mobile app/PWA (expected in 2025)
4. Live payment processing (revenue blocker)
5. Payment plans (service business essential)

### Differentiation Opportunities

- **Birth-specific features**: Due date tracking, birth plan editor, postpartum workflows
- **AI for doulas**: Suggested follow-up timing based on trimester
- **Community features**: Connect clients with each other (cohort births)

---

## Quick Reference: Next Steps

| Timeline         | Action                                              | Priority Score   |
| ---------------- | --------------------------------------------------- | ---------------- |
| **Immediate**    | Activate Stripe + Twilio (stubbed, just needs keys) | 3.33, 2.67       |
| **This Month**   | Calendar integration (highest priority gap)         | 2.25             |
| **Next Quarter** | Self-scheduling, payment plans, PWA                 | 1.80, 2.25, 1.33 |
| **H2 2025**      | AI features, integrations, advanced analytics       | 1.0-1.5          |

---

## Research Sources

- [Salesforce Products Guide](https://www.salesforceben.com/salesforce-products/)
- [HubSpot Spring 2025 Features](https://www.hubspot.com/company-news/spring-2025-spotlight)
- [HoneyBook Features](https://www.honeybook.com/features)
- [Dubsado Complete Guide](https://bestaicrmsoftware.com/crm-for-small-business/dubsado-overview-and-features)
- [Marketing Cloud Features 2025](https://www.grazitti.com/blog/top-9-salesforce-marketing-cloud-features-to-supercharge-your-marketing-strategy-in-2025/)
- [AI CRM Trends 2025](https://crmexpertsonline.com/ai-powered-crm-for-sales-pipeline-management-2025-trends/)
- [Best CRM for Service Business](https://capsulecrm.com/blog/best-crm-for-service-based-business/)
