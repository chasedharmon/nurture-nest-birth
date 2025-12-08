import Link from 'next/link'
import { Plus, LayoutDashboard, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = {
  title: 'Dashboards | Nurture Nest Birth',
  description: 'Create and manage custom dashboards',
}

export default function DashboardsPage() {
  // TODO: Fetch dashboards from database once dashboard builder is implemented
  const dashboards: Array<{
    id: string
    name: string
    description: string
    widget_count: number
    created_at: string
    is_default: boolean
  }> = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage custom dashboards with widgets and charts
          </p>
        </div>
        <Button asChild disabled>
          <Link href="/admin/dashboards/new">
            <Plus className="mr-2 h-4 w-4" />
            New Dashboard
          </Link>
        </Button>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Dashboard Builder Coming Soon
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The Dashboard Builder will allow you to create custom dashboards by
            dragging and dropping widgets, connecting them to your saved
            reports, and visualizing your data in real-time. For now, use the{' '}
            <Link href="/admin/reports" className="text-primary underline">
              Report Builder
            </Link>{' '}
            to create and save reports that will power your future dashboards.
          </p>
        </CardContent>
      </Card>

      {/* Dashboard list or empty state */}
      {dashboards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No dashboards yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Custom dashboards will let you combine multiple reports and KPIs
              into a single view. Start by creating reports, then build
              dashboards from them.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/admin/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/reports/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
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
                    {dashboard.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {dashboard.description && (
                    <CardDescription className="line-clamp-2">
                      {dashboard.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{dashboard.widget_count} widgets</span>
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
            <div className="text-2xl font-bold">
              {dashboards.reduce((sum, d) => sum + d.widget_count, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
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
