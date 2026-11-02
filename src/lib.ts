// Pure helpers shared by screens. No React here so they can be tested with `node --test`.

export { MAX_PARTICIPANTS, SERVICE_FEE_RATE, newBookingId, priceBreakdown, toISODate, today } from './pricing.js'
import { toISODate, today } from './pricing.js'

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysUntil(iso: string, from = today()): number {
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()
  return Math.round(ms / 86_400_000)
}


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

// Indian mobile numbers: optional +91 / 0 prefix, then 10 digits starting 6-9.
export function isPhone(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '')
  return /^(\+91|0)?[6-9]\d{9}$/.test(digits)
}


export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'
}
