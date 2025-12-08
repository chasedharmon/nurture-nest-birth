import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Loader2, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getReportById, executeReport } from '@/app/actions/reports'
import type { ColumnConfig, ChartConfig } from '@/lib/supabase/types'
import { ReportChartDisplay } from '@/components/admin/reports/report-chart-display'

interface ReportViewPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function formatCellValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '—'

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value))
    case 'date':
      return new Date(String(value)).toLocaleDateString()
    case 'datetime':
      return new Date(String(value)).toLocaleString()
    case 'boolean':
      return value ? 'Yes' : 'No'
    default:
      return String(value)
  }
}

async function ReportContent({ id }: { id: string }) {
  const reportResult = await getReportById(id)

  if (!reportResult.success || !reportResult.data) {
    notFound()
  }

  const report = reportResult.data

  // Execute the report
  const execResult = await executeReport(id)
  const data = execResult.success ? execResult.data : null

  const visibleColumns = (report.columns as ColumnConfig[]).filter(
    c => c.visible
  )
  const groupings = (report.groupings as string[]) || []
  const chartConfig = (report.chart_config || {}) as ChartConfig

  return (
    <div className="space-y-6">
      {/* Report header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{report.name}</CardTitle>
              {report.description && (
                <CardDescription>{report.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {report.object_type}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {report.report_type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Created: {new Date(report.created_at).toLocaleDateString()}
            </span>
            {data && (
              <>
                <span>•</span>
                <span>
                  {data.totalCount} record{data.totalCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aggregations summary */}
      {data?.aggregations && Object.keys(data.aggregations).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.aggregations).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardDescription>{key}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {typeof value === 'number'
                    ? value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : String(value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart (if chart report) */}
      {report.report_type === 'chart' && data && data.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{chartConfig.title || 'Chart'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportChartDisplay
              data={data.rows}
              chartConfig={chartConfig}
              groupings={groupings}
              visibleColumns={visibleColumns}
            />
          </CardContent>
        </Card>
      )}

      {/* Data table */}
      {data && data.rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map(col => (
                      <TableHead key={col.field}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {visibleColumns.map(col => (
                        <TableCell key={col.field}>
                          {col.format === 'badge' ? (
                            <Badge variant="outline">
                              {formatCellValue(row[col.field], col.format)}
                            </Badge>
                          ) : (
                            formatCellValue(row[col.field], col.format)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data message */}
      {(!data || data.rows.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No data matches the report filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default async function ReportViewPage({ params }: ReportViewPageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">View Report</h1>
            <p className="text-muted-foreground">Report results and analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Edit Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href={`/admin/reports/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Report
            </Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <ReportContent id={id} />
      </Suspense>
    </div>
  )
}
