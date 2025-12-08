import type { Report, FilterCondition } from '@/lib/supabase/types'

// ============================================================================
// REPORT FORMULA DESCRIPTION
// ============================================================================

export function generateReportFormulaDescription(
  report: Partial<Report>
): string {
  const lines: string[] = []

  // Object type
  if (report.object_type) {
    lines.push(`Data Source: ${formatSourceLabel(report.object_type)}`)
  }

  // Filters
  if (report.filters && report.filters.length > 0) {
    lines.push('')
    lines.push('Filters:')
    for (const filter of report.filters) {
      const operatorText = formatOperator(filter.operator)
      lines.push(
        `  - ${filter.field} ${operatorText} ${formatValue(filter.value)}`
      )
    }
  }

  // Groupings
  if (report.groupings && report.groupings.length > 0) {
    lines.push('')
    lines.push(`Grouped By: ${report.groupings.join(', ')}`)
  }

  // Aggregations
  if (report.aggregations && report.aggregations.length > 0) {
    lines.push('')
    lines.push('Calculations:')
    for (const agg of report.aggregations) {
      const aggType = agg.function || agg.type || 'count'
      lines.push(`  - ${agg.label}: ${aggType.toUpperCase()}(${agg.field})`)
    }
  }

  // Columns
  if (report.columns && report.columns.length > 0) {
    lines.push('')
    lines.push(
      `Columns: ${report.columns
        .filter(c => c.visible !== false)
        .map(c => c.label)
        .join(', ')}`
    )
  }

  return lines.join('\n')
}

function formatOperator(op: FilterCondition['operator']): string {
  const opMap: Record<string, string> = {
    equals: '=',
    not_equals: '!=',
    contains: 'contains',
    not_contains: 'does not contain',
    starts_with: 'starts with',
    ends_with: 'ends with',
    greater_than: '>',
    less_than: '<',
    greater_or_equal: '>=',
    less_or_equal: '<=',
    is_null: 'is empty',
    is_not_null: 'is not empty',
    in: 'is one of',
    not_in: 'is not one of',
    between: 'is between',
    this_week: 'is this week',
    this_month: 'is this month',
    this_quarter: 'is this quarter',
    last_n_days: 'in the last',
  }
  return opMap[op] || op
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)'
  if (Array.isArray(value)) return `[${value.join(', ')}]`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatSourceLabel(objectType: string): string {
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
