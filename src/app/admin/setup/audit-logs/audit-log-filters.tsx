'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Filter } from 'lucide-react'

interface AuditLogFiltersProps {
  currentFilters: {
    search?: string
    action?: string
    entityType?: string
    userId?: string
    dateFrom?: string
    dateTo?: string
  }
  filterOptions: {
    actions: string[]
    entityTypes: string[]
    users: { id: string; email: string; full_name: string | null }[]
  }
}

export function AuditLogFilters({
  currentFilters,
  filterOptions,
}: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentFilters.search ?? '')

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      // Reset to page 1 when filters change
      params.delete('page')

      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearFilters = () => {
    router.push('/admin/setup/audit-logs')
    setSearch('')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('search', search || null)
  }

  const hasActiveFilters =
    currentFilters.search ||
    currentFilters.action ||
    currentFilters.entityType ||
    currentFilters.userId ||
    currentFilters.dateFrom ||
    currentFilters.dateTo

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {/* Search */}
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-20"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              className="absolute right-1 top-1 h-7"
            >
              Search
            </Button>
          </form>
        </div>

        {/* Action Filter */}
        <div>
          <Label htmlFor="action" className="sr-only">
            Action
          </Label>
          <Select
            value={currentFilters.action ?? '_all'}
            onValueChange={value =>
              updateFilters('action', value === '_all' ? null : value)
            }
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All actions</SelectItem>
              {filterOptions.actions.map(action => (
                <SelectItem key={action} value={action} className="capitalize">
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Type Filter */}
        <div>
          <Label htmlFor="entityType" className="sr-only">
            Entity Type
          </Label>
          <Select
            value={currentFilters.entityType ?? '_all'}
            onValueChange={value =>
              updateFilters('entityType', value === '_all' ? null : value)
            }
          >
            <SelectTrigger id="entityType">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All types</SelectItem>
              {filterOptions.entityTypes.map(type => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Filter */}
        <div>
          <Label htmlFor="user" className="sr-only">
            User
          </Label>
          <Select
            value={currentFilters.userId ?? '_all'}
            onValueChange={value =>
              updateFilters('userId', value === '_all' ? null : value)
            }
          >
            <SelectTrigger id="user">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All users</SelectItem>
              {filterOptions.users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - Quick Filters */}
        <div>
          <Label htmlFor="dateRange" className="sr-only">
            Date Range
          </Label>
          <Select
            value={getDateRangeValue(
              currentFilters.dateFrom,
              currentFilters.dateTo
            )}
            onValueChange={value => {
              const { dateFrom, dateTo } = getDateRangeFromValue(value)
              const params = new URLSearchParams(searchParams.toString())

              if (dateFrom) {
                params.set('dateFrom', dateFrom)
              } else {
                params.delete('dateFrom')
              }

              if (dateTo) {
                params.set('dateTo', dateTo)
              } else {
                params.delete('dateTo')
              }

              params.delete('page')
              router.push(`?${params.toString()}`)
            }}
          >
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function getDateRangeValue(
  dateFrom: string | undefined,
  dateTo: string | undefined
): string {
  if (!dateFrom && !dateTo) return 'all'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const from = dateFrom ? new Date(dateFrom) : null

  if (!from) return 'all'

  const daysDiff = Math.floor(
    (today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysDiff === 0) return 'today'
  if (daysDiff === 1) return 'yesterday'
  if (daysDiff === 6 || daysDiff === 7) return '7days'
  if (daysDiff >= 29 && daysDiff <= 31) return '30days'
  if (daysDiff >= 89 && daysDiff <= 91) return '90days'

  return 'all'
}

function getDateRangeFromValue(value: string): {
  dateFrom: string | null
  dateTo: string | null
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (value) {
    case 'today':
      return {
        dateFrom: today.toISOString().split('T')[0]!,
        dateTo: today.toISOString().split('T')[0]!,
      }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        dateFrom: yesterday.toISOString().split('T')[0]!,
        dateTo: yesterday.toISOString().split('T')[0]!,
      }
    }
    case '7days': {
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return {
        dateFrom: sevenDaysAgo.toISOString().split('T')[0]!,
        dateTo: today.toISOString().split('T')[0]!,
      }
    }
    case '30days': {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return {
        dateFrom: thirtyDaysAgo.toISOString().split('T')[0]!,
        dateTo: today.toISOString().split('T')[0]!,
      }
    }
    case '90days': {
      const ninetyDaysAgo = new Date(today)
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      return {
        dateFrom: ninetyDaysAgo.toISOString().split('T')[0]!,
        dateTo: today.toISOString().split('T')[0]!,
      }
    }
    default:
      return { dateFrom: null, dateTo: null }
  }
}
