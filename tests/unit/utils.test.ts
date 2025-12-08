import { describe, it, expect } from 'vitest'

// Test utility functions that don't require database access

describe('Utility Functions', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.org')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
      expect(isValidEmail('noat.domain.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Phone number formatting', () => {
    const formatPhoneNumber = (phone: string): string => {
      const cleaned = phone.replace(/\D/g, '')
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      }
      return phone
    }

    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('3085551234')).toBe('(308) 555-1234')
      expect(formatPhoneNumber('308-555-1234')).toBe('(308) 555-1234')
      expect(formatPhoneNumber('(308) 555-1234')).toBe('(308) 555-1234')
    })

    it('should return original for non-10-digit numbers', () => {
      expect(formatPhoneNumber('555-1234')).toBe('555-1234')
      expect(formatPhoneNumber('123')).toBe('123')
    })
  })

  describe('Date formatting', () => {
    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    }

    it('should format dates correctly', () => {
      const date = new Date('2025-01-15T12:00:00Z')
      const formatted = formatDate(date)
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
      expect(formatted).toContain('2025')
    })
  })

  describe('Invoice number generation', () => {
    const generateInvoiceNumber = (year: number, sequence: number): string => {
      return `INV-${year}-${sequence.toString().padStart(4, '0')}`
    }

    it('should generate correct invoice number format', () => {
      expect(generateInvoiceNumber(2025, 1)).toBe('INV-2025-0001')
      expect(generateInvoiceNumber(2025, 42)).toBe('INV-2025-0042')
      expect(generateInvoiceNumber(2025, 1234)).toBe('INV-2025-1234')
    })
  })

  describe('File size formatting', () => {
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }

    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(500)).toBe('500 B')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })
  })

  describe('File type validation', () => {
    const ALLOWED_TYPES: Record<string, string[]> = {
      contract: ['application/pdf'],
      birth_plan: ['application/pdf', 'application/msword'],
      photo: ['image/jpeg', 'image/png', 'image/webp'],
      other: ['application/pdf', 'image/jpeg', 'image/png'],
    }

    const isValidFileType = (
      documentType: string,
      mimeType: string
    ): boolean => {
      const allowed = ALLOWED_TYPES[documentType] ?? ALLOWED_TYPES.other ?? []
      return allowed.includes(mimeType)
    }

    it('should validate contract file types', () => {
      expect(isValidFileType('contract', 'application/pdf')).toBe(true)
      expect(isValidFileType('contract', 'image/jpeg')).toBe(false)
    })

    it('should validate photo file types', () => {
      expect(isValidFileType('photo', 'image/jpeg')).toBe(true)
      expect(isValidFileType('photo', 'image/png')).toBe(true)
      expect(isValidFileType('photo', 'application/pdf')).toBe(false)
    })

    it('should use other types as fallback', () => {
      expect(isValidFileType('unknown', 'application/pdf')).toBe(true)
      expect(isValidFileType('unknown', 'image/jpeg')).toBe(true)
    })
  })

  describe('Status badge colors', () => {
    const getStatusColor = (status: string): string => {
      const colors: Record<string, string> = {
        new: 'bg-blue-100 text-blue-800',
        contacted: 'bg-yellow-100 text-yellow-800',
        scheduled: 'bg-purple-100 text-purple-800',
        client: 'bg-green-100 text-green-800',
        lost: 'bg-gray-100 text-gray-800',
      }
      return colors[status] || 'bg-gray-100 text-gray-800'
    }

    it('should return correct colors for each status', () => {
      expect(getStatusColor('new')).toContain('blue')
      expect(getStatusColor('client')).toContain('green')
      expect(getStatusColor('lost')).toContain('gray')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toContain('gray')
    })
  })

  describe('Sanitize filename', () => {
    const sanitizeFilename = (filename: string): string => {
      return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    }

    it('should sanitize special characters', () => {
      expect(sanitizeFilename('my file.pdf')).toBe('my_file.pdf')
      expect(sanitizeFilename('document (1).pdf')).toBe('document__1_.pdf')
      expect(sanitizeFilename('test@file#name.pdf')).toBe('test_file_name.pdf')
    })

    it('should keep valid characters', () => {
      expect(sanitizeFilename('valid-file.pdf')).toBe('valid-file.pdf')
      expect(sanitizeFilename('file123.PDF')).toBe('file123.PDF')
    })
  })

  describe('Max file size validation', () => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    const isFileSizeValid = (bytes: number): boolean => {
      return bytes <= MAX_FILE_SIZE
    }

    it('should accept files under 10MB', () => {
      expect(isFileSizeValid(5 * 1024 * 1024)).toBe(true)
      expect(isFileSizeValid(10 * 1024 * 1024)).toBe(true)
    })

    it('should reject files over 10MB', () => {
      expect(isFileSizeValid(11 * 1024 * 1024)).toBe(false)
      expect(isFileSizeValid(100 * 1024 * 1024)).toBe(false)
    })
  })
})
