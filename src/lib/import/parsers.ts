/**
 * File parsing utilities for CSV and Excel files
 */
import * as XLSX from 'xlsx'
import type { ParsedFile } from './types'

const MAX_PREVIEW_ROWS = 10

/**
 * Parse a CSV file from text content
 */
export function parseCSV(content: string, filename: string): ParsedFile {
  const lines = content.split(/\r?\n/).filter(line => line.trim())

  if (lines.length === 0) {
    return {
      filename,
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: [],
    }
  }

  // Parse headers from first line
  const headers = parseCSVLine(lines[0]!)

  // Parse data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!)
    if (values.some(v => v.trim())) {
      // Skip empty rows
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
  }

  return {
    filename,
    headers,
    rows,
    totalRows: rows.length,
    previewRows: rows.slice(0, MAX_PREVIEW_ROWS),
  }
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Don't forget the last value
  result.push(current.trim())

  return result
}

/**
 * Parse an Excel file from ArrayBuffer
 */
export function parseExcel(buffer: ArrayBuffer, filename: string): ParsedFile {
  const workbook = XLSX.read(buffer, { type: 'array' })

  // Use the first sheet
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    return {
      filename,
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: [],
    }
  }

  const worksheet = workbook.Sheets[firstSheetName]!
  const jsonData = XLSX.utils.sheet_to_json<
    (string | number | boolean | null)[]
  >(worksheet, {
    header: 1,
    defval: '',
  })

  if (jsonData.length === 0) {
    return {
      filename,
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: [],
    }
  }

  // First row is headers
  const headers = (jsonData[0] as unknown[]).map(h => String(h || '').trim())

  // Rest are data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < jsonData.length; i++) {
    const rowValues = jsonData[i] as unknown[]
    if (rowValues.some(v => v !== '' && v !== null && v !== undefined)) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        const value = rowValues[index]
        row[header] = value !== null && value !== undefined ? String(value) : ''
      })
      rows.push(row)
    }
  }

  return {
    filename,
    headers,
    rows,
    totalRows: rows.length,
    previewRows: rows.slice(0, MAX_PREVIEW_ROWS),
  }
}

/**
 * Parse a file based on its extension
 */
export async function parseFile(file: File): Promise<ParsedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    const text = await file.text()
    return parseCSV(text, file.name)
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer()
    return parseExcel(buffer, file.name)
  }

  throw new Error(
    `Unsupported file type: ${extension}. Please use CSV or Excel files.`
  )
}

/**
 * Detect file encoding and parse accordingly
 */
export function detectDelimiter(content: string): ',' | ';' | '\t' {
  const firstLine = content.split(/\r?\n/)[0] || ''

  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const tabCount = (firstLine.match(/\t/g) || []).length

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t'
  if (semicolonCount > commaCount) return ';'
  return ','
}
