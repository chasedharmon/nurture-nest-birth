import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Edit2, Trash2, Star, MoreHorizontal, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getDashboardById,
  setDefaultDashboard,
  deleteDashboard,
} from '@/app/actions/dashboards'
import { DashboardViewer } from './dashboard-viewer'

interface DashboardPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { id } = await params
  const result = await getDashboardById(id)

  if (!result.success || !result.data) {
    return { title: 'Dashboard Not Found' }
  }

  return {
    title: `${result.data.name} | Dashboards | Nurture Nest Birth`,
    description: result.data.description || 'View dashboard',
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { id } = await params
  const result = await getDashboardById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const dashboard = result.data
  const widgetCount = dashboard.widgets?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {dashboard.name}
            </h1>
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
          {dashboard.description && (
            <p className="text-muted-foreground mt-1">
              {dashboard.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>
              {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
            </span>
            <span>
              Last updated:{' '}
              {new Date(dashboard.updated_at).toLocaleDateString()}
            </span>
            {dashboard.auto_refresh_seconds > 0 && (
              <span>Auto-refresh: {dashboard.auto_refresh_seconds}s</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/dashboards/${id}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/dashboards/${id}/edit`}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Dashboard
                </Link>
              </DropdownMenuItem>
              {!dashboard.is_default && (
                <DropdownMenuItem
                  onClick={async () => {
                    'use server'
                    await setDefaultDashboard(id)
                  }}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={async () => {
                  'use server'
                  await deleteDashboard(id)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardViewer widgets={dashboard.widgets || []} />
    </div>
  )
}
