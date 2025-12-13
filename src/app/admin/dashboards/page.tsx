import Link from 'next/link'
import { Plus, LayoutDashboard, BarChart3, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { listDashboards, getAvailableReports } from '@/app/actions/dashboards'
import { PageHeader } from '@/components/admin/navigation'

export const metadata = {
  title: 'Dashboards | Nurture Nest Birth',
  description: 'Create and manage custom dashboards',
}

export default async function DashboardsPage() {
  const [dashboardsResult, reportsResult] = await Promise.all([
    listDashboards(),
    getAvailableReports(),
  ])

  const dashboards = dashboardsResult.success ? dashboardsResult.data : []
  const reportCount = reportsResult.success ? reportsResult.data.length : 0
  const totalWidgets = dashboards.reduce((sum, d) => sum + d.widget_count, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboards"
        subtitle="Create and manage custom dashboards with widgets and charts"
        icon={<LayoutDashboard className="h-5 w-5 text-primary" />}
        actions={
          <Button asChild>
            <Link href="/admin/dashboards/new">
              <Plus className="mr-2 h-4 w-4" />
              New Dashboard
            </Link>
          </Button>
        }
      />

      {/* Dashboard list or empty state */}
      {dashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Create custom dashboards to combine multiple reports and KPIs into
              a single view. Drag and drop widgets to build your perfect
              dashboard.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/dashboards/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map(dashboard => (
            <Link key={dashboard.id} href={`/admin/dashboards/${dashboard.id}`}>
              <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      <CardTitle className="text-base">
                        {dashboard.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {dashboard.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {dashboard.visibility}
                      </Badge>
                    </div>
                  </div>
                  {dashboard.description && (
                    <CardDescription className="line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {dashboard.widget_count} widget
                      {dashboard.widget_count !== 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(dashboard.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Dashboards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Widgets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWidgets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportCount}</div>
            <Link
              href="/admin/reports"
              className="text-xs text-primary hover:underline"
            >
              View all reports →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
