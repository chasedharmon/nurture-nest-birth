import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, FileText, BarChart3, Table2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { listReports } from '@/app/actions/reports'
import { PageHeader } from '@/components/admin/navigation'

async function ReportsList() {
  const result = await listReports()
  const reports = result.success ? result.data || [] : []

  if (reports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No reports yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Create custom reports to analyze your leads, clients, invoices, and
            more.
          </p>
          <Button asChild>
            <Link href="/admin/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Report
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-4 w-4" />
      case 'summary':
        return <Table2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getObjectLabel = (objectType: string) => {
    const labels: Record<string, string> = {
      leads: 'Leads',
      clients: 'Clients',
      invoices: 'Invoices',
      meetings: 'Meetings',
      payments: 'Payments',
      services: 'Services',
      team_members: 'Team Members',
    }
    return labels[objectType] || objectType
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map(report => (
        <Link key={report.id} href={`/admin/reports/${report.id}`}>
          <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getReportTypeIcon(report.report_type)}
                  <CardTitle className="text-base">{report.name}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getObjectLabel(report.object_type)}
                </Badge>
              </div>
              {report.description && (
                <CardDescription className="line-clamp-2">
                  {report.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="capitalize">{report.report_type}</span>
                <span>•</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Create and manage custom reports for your data"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        actions={
          <Button asChild>
            <Link href="/admin/reports/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        }
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReportsList />
      </Suspense>
    </div>
  )
}
