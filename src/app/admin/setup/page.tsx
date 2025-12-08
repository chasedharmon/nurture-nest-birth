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
import { Button } from '@/components/ui/button'
import {
  Users,
  Shield,
  UserCog,
  FileText,
  ClipboardList,
  Plug,
  Settings,
  ChevronRight,
  ChevronLeft,
  Building2,
  Briefcase,
  Heart,
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
        title: 'Team Members',
        description: 'Manage doula profiles and team',
        href: '/admin/team',
        icon: <UserCog className="h-5 w-5" />,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-foreground">
                    Setup
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Configure your Nurture Nest Birth CRM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
      </main>
    </div>
  )
}
