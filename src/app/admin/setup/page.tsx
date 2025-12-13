import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageHeader } from '@/components/admin/navigation'
import {
  Users,
  Shield,
  UserCog,
  FileText,
  ClipboardList,
  Plug,
  Settings,
  ChevronRight,
  Building2,
  Briefcase,
  Heart,
  Mail,
  Package,
  CreditCard,
  Building,
  MessageSquare,
  Database,
  Handshake,
  ArrowRightLeft,
  KeyRound,
  ScrollText,
  Key,
  Webhook,
} from 'lucide-react'

interface SetupCategory {
  title: string
  description: string
  icon: React.ReactNode
  items: SetupItem[]
}

interface SetupItem {
  title: string
  description: string
  href: string
  icon: React.ReactNode
}

const setupCategories: SetupCategory[] = [
  {
    title: 'Data Management',
    description: 'Configure CRM objects, fields, and data structure',
    icon: <Database className="h-6 w-6" />,
    items: [
      {
        title: 'Object Manager',
        description: 'Manage CRM objects and custom fields',
        href: '/admin/setup/objects',
        icon: <Database className="h-5 w-5" />,
      },
      {
        title: 'Data Migration',
        description: 'Migrate legacy leads to new CRM system',
        href: '/admin/setup/migration',
        icon: <ArrowRightLeft className="h-5 w-5" />,
      },
      {
        title: 'Referral Partners',
        description: 'Track referral sources and partnerships',
        href: '/admin/setup/referral-partners',
        icon: <Handshake className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Administration',
    description: 'Manage users, roles, and system access',
    icon: <Shield className="h-6 w-6" />,
    items: [
      {
        title: 'Users',
        description: 'Manage user accounts and invitations',
        href: '/admin/setup/users',
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Roles & Permissions',
        description: 'Configure access control and permissions',
        href: '/admin/setup/roles',
        icon: <Shield className="h-5 w-5" />,
      },
      {
        title: 'Field-Level Security',
        description: 'Control field visibility by role',
        href: '/admin/setup/field-permissions',
        icon: <KeyRound className="h-5 w-5" />,
      },
      {
        title: 'Team Members',
        description: 'Manage doula profiles and team',
        href: '/admin/team',
        icon: <UserCog className="h-5 w-5" />,
      },
      {
        title: 'Audit Logs',
        description: 'Track who changed what and when',
        href: '/admin/setup/audit-logs',
        icon: <ScrollText className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Business',
    description: 'Configure services, packages, and business settings',
    icon: <Briefcase className="h-6 w-6" />,
    items: [
      {
        title: 'Services & Packages',
        description: 'Configure service offerings and pricing',
        href: '/admin/setup/services',
        icon: <Briefcase className="h-5 w-5" />,
      },
      {
        title: 'Company Profile',
        description: 'Business information and branding',
        href: '/admin/setup/company',
        icon: <Building2 className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Client Experience',
    description: 'Configure contracts, forms, and client-facing features',
    icon: <Heart className="h-6 w-6" />,
    items: [
      {
        title: 'Contract Templates',
        description: 'Manage service agreements and contracts',
        href: '/admin/setup/contracts',
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: 'Intake Forms',
        description: 'Configure client intake questionnaires',
        href: '/admin/setup/intake-forms',
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        title: 'Email Templates',
        description: 'Reusable email templates with variables',
        href: '/admin/setup/email-templates',
        icon: <Mail className="h-5 w-5" />,
      },
      {
        title: 'Welcome Packets',
        description: 'Automated onboarding bundles for new clients',
        href: '/admin/setup/welcome-packets',
        icon: <Package className="h-5 w-5" />,
      },
      {
        title: 'SMS Templates',
        description: 'Text message templates for reminders and notifications',
        href: '/admin/setup/sms-templates',
        icon: <MessageSquare className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Integrations',
    description: 'Connect external services and APIs',
    icon: <Plug className="h-6 w-6" />,
    items: [
      {
        title: 'Integrations',
        description: 'Stripe, Resend, and other services',
        href: '/admin/setup/integrations',
        icon: <Plug className="h-5 w-5" />,
      },
      {
        title: 'API Keys',
        description: 'Manage API access for external integrations',
        href: '/admin/setup/api-keys',
        icon: <Key className="h-5 w-5" />,
      },
      {
        title: 'Webhooks',
        description: 'Configure outbound event notifications',
        href: '/admin/setup/webhooks',
        icon: <Webhook className="h-5 w-5" />,
      },
    ],
  },
  {
    title: 'Account & Billing',
    description: 'Manage your subscription and organization',
    icon: <CreditCard className="h-6 w-6" />,
    items: [
      {
        title: 'Organization',
        description: 'Manage your organization profile and settings',
        href: '/admin/setup/organization',
        icon: <Building className="h-5 w-5" />,
      },
      {
        title: 'Billing & Subscription',
        description: 'Manage your plan, usage, and invoices',
        href: '/admin/setup/billing',
        icon: <CreditCard className="h-5 w-5" />,
      },
    ],
  },
]

export default async function SetupPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setup"
        subtitle="Configure your CRM settings and preferences"
        icon={<Settings className="h-5 w-5 text-primary" />}
      />

      <div>
        {/* Categories */}
        <div className="space-y-8">
          {setupCategories.map(category => (
            <div key={category.title}>
              <div className="mb-4 flex items-center gap-3">
                <div className="text-primary">{category.icon}</div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {category.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map(item => (
                  <Link key={item.href} href={item.href}>
                    <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="rounded-md bg-primary/10 p-2 text-primary">
                            {item.icon}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-base">
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{item.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 border-t border-border pt-8">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Quick Links
          </h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/leads"
              className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              Leads
            </Link>
            <Link
              href="/admin/reports"
              className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              Reports
            </Link>
            <Link
              href="/admin/dashboards"
              className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              Dashboards
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
