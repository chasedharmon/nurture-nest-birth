# Nurture Nest Birth

> DONA-certified doula website and CRM for Nurture Nest Birth in Kearney, Nebraska. Built with Next.js 16, React 19, TypeScript, and Supabase.

## Features

### Public Website

- Service pages (Birth Doula, Postpartum Care, Lactation, Sibling Prep)
- Blog with SEO-optimized articles
- Contact form with lead capture
- Newsletter signup
- FAQ and pricing pages
- Mobile-responsive design

### Admin Dashboard (`/admin`)

- Lead management with status pipeline (new -> contacted -> scheduled -> client)
- Activity timeline and notes
- Client services, meetings, documents, payments tracking
- Search and filter leads
- Tabbed client detail view (Overview, Services, Meetings, Documents, Payments, Activity, Notes)

### Client Portal (`/client`)

- Magic link authentication (passwordless)
- Dashboard with service overview
- View services, meetings, documents, payments
- Profile information display

## Tech Stack

- **Next.js 16** - App Router, React 19, Server Components, Turbopack
- **TypeScript** - Strict mode with full type safety
- **Supabase** - PostgreSQL database with RLS, Auth
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Resend** - Transactional emails
- **Playwright** - E2E testing

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm (`npm install -g pnpm`)
- Supabase account

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required - Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=onboarding@resend.dev
CONTACT_EMAIL=hello@nurturenestbirth.com

# Required for Production - Security
CRON_SECRET=generate_random_32_char_string
STRIPE_WEBHOOK_SECRET=whsec_xxx  # When Stripe enabled

# Optional - Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Optional - Error Tracking (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_token

# Optional - Scheduling
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/your-username
```

See `.env.example` for full documentation of each variable.

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format with Prettier
pnpm type-check   # Run TypeScript type check
pnpm test:e2e     # Run Playwright E2E tests
```

## Project Structure

```
nurture-nest-birth/
├── src/
│   ├── app/
│   │   ├── (public pages)     # Home, about, services, blog, contact, etc.
│   │   ├── admin/             # Admin dashboard and lead management
│   │   ├── client/            # Client portal with magic link auth
│   │   └── actions/           # Server actions for CRUD operations
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── admin/             # Admin-specific components
│   ├── config/
│   │   └── site.ts            # Centralized site configuration
│   └── lib/
│       ├── supabase/          # Supabase client and types
│       └── utils.ts           # Utility functions
├── supabase/
│   └── migrations/            # Database migrations
├── docs/                      # Documentation
│   ├── PERFORMANCE.md
│   ├── TESTING.md
│   ├── QUICK_START.md
│   └── archive/               # Historical phase documentation
├── scripts/
│   ├── verify-database.js     # Database verification
│   └── archive/               # One-off migration scripts
├── CHANGELOG.md               # Version history
└── README.md
```

## Database Schema

### Core Tables

- `leads` - Lead/client information with extended fields
- `lead_activities` - Activity timeline with categories
- `users` - Admin users (Supabase Auth)

### CRM Tables

- `client_services` - Service packages and contracts
- `meetings` - Scheduled appointments
- `client_documents` - Files and resources
- `payments` - Financial transactions
- `client_auth_tokens` - Magic link tokens

## Routes

| Route               | Description                  |
| ------------------- | ---------------------------- |
| `/`                 | Homepage                     |
| `/admin`            | Admin dashboard              |
| `/admin/leads`      | All leads with search/filter |
| `/admin/leads/[id]` | Lead detail with tabs        |
| `/client/login`     | Client login (magic link)    |
| `/client/dashboard` | Client dashboard             |
| `/client/services`  | Client services view         |
| `/client/meetings`  | Client meetings view         |
| `/client/documents` | Client documents view        |
| `/client/payments`  | Client payments view         |
| `/client/profile`   | Client profile               |
| `/contact`          | Contact form                 |

## Development

### Code Quality

Pre-commit hooks enforce:

- ESLint checks
- Prettier formatting
- TypeScript type checking
- Conventional commit messages

### Commit Convention

```bash
feat: add new feature
fix: bug fix
docs: documentation
test: tests
chore: maintenance
refactor: code refactoring
```

## Configuration

Business information is centralized in `src/config/site.ts`:

- Business name and contact info
- Service area cities
- Credentials
- Social media links
- Pricing

## Security

See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for the full security audit report.

### Key Security Features

- **Authentication**: Supabase Auth with row-level security (RLS)
- **Rate Limiting**: Upstash Redis with per-endpoint limits
- **API Keys**: SHA-256 hashed, permission-scoped, with rate limits
- **CSRF Protection**: Built-in via Next.js Server Actions
- **Input Validation**: Zod schemas and sanitized search queries
- **Audit Logging**: All CRUD operations tracked with actor and changes

### Pre-Launch Checklist

- [ ] Set `CRON_SECRET` environment variable
- [ ] Configure Upstash Redis for rate limiting
- [ ] Enable Stripe webhook verification (when ready)
- [ ] Test RLS policies for cross-tenant isolation
- [ ] Verify all admin routes require authentication

## API

### External API (`/api/v1/`)

The API uses API key authentication. Generate keys in Admin > Setup > API Keys.

```bash
# List leads
curl -H "Authorization: Bearer sk_live_xxx" \
  "https://your-domain.com/api/v1/leads?limit=50"

# Create lead
curl -X POST -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}' \
  "https://your-domain.com/api/v1/leads"
```

### Webhooks

Configure webhooks in Admin > Setup > Webhooks. Events are signed with HMAC-SHA256.

```bash
# Verify webhook signature
X-Webhook-Signature: sha256=<hmac_of_payload>
```

## Business Information

**Name**: Nurture Nest Birth
**Location**: Kearney, Nebraska 68847
**Contact**: hello@nurturenestbirth.com | 308-440-5153

**Services**:

- Birth Doula Support
- Postpartum Care
- Lactation Consulting
- Sibling Preparation

**Credentials**:

- DONA Certified (Pre & Postpartum Doula)
- Certified Lactation Consultant
- Family Studies Degree

---

See [CHANGELOG.md](CHANGELOG.md) for version history.

**Built with [Claude Code](https://claude.com/claude-code)**
