/**
 * Export formatters for GDPR data export
 * Converts database records to JSON and CSV formats
 */

/**
 * Convert an array of objects to CSV format
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  options: {
    headers?: string[]
    delimiter?: string
  } = {}
): string {
  if (data.length === 0) return ''

  const { delimiter = ',' } = options

  // Get headers from first object or use provided headers
  const headers = options.headers || Object.keys(data[0] ?? {})

  // Escape CSV value
  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return ''

    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value)

    // Escape quotes and wrap in quotes if contains special characters
    if (
      stringValue.includes(delimiter) ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  // Build CSV
  const csvRows = [
    headers.join(delimiter),
    ...data.map(row =>
      headers.map(header => escapeValue(row[header])).join(delimiter)
    ),
  ]

  return csvRows.join('\n')
}

/**
 * Format data for JSON export (pretty-printed)
 */
export function toJSON<T>(data: T): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Create a manifest file for the export
 */
export function createManifest(
  organizationName: string,
  tables: { name: string; recordCount: number }[],
  exportedAt: Date
): string {
  return JSON.stringify(
    {
      export_type: 'GDPR Data Export',
      organization_name: organizationName,
      exported_at: exportedAt.toISOString(),
      format_version: '1.0',
      tables: tables.map(t => ({
        name: t.name,
        record_count: t.recordCount,
        files: [`${t.name}.json`, `${t.name}.csv`],
      })),
      total_tables: tables.length,
      total_records: tables.reduce((sum, t) => sum + t.recordCount, 0),
    },
    null,
    2
  )
}

/**
 * Flatten nested objects for CSV export
 * e.g., { address: { city: 'NYC' } } -> { 'address.city': 'NYC' }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        Object.assign(
          acc,
          flattenObject(value as Record<string, unknown>, prefixedKey)
        )
      } else {
        acc[prefixedKey] = value
      }

      return acc
    },
    {} as Record<string, unknown>
  )
}

/**
 * Prepare data for CSV export by flattening nested objects
 */
export function prepareForCSV<T extends Record<string, unknown>>(
  data: T[]
): Record<string, unknown>[] {
  return data.map(row => flattenObject(row))
}
