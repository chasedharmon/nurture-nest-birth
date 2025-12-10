import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the referral URL for a partner
 */
export function getReferralUrl(baseUrl: string, referralCode: string): string {
  return `${baseUrl}?ref=${referralCode}`
}
