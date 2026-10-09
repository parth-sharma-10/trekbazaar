// Pure helpers shared by screens. No React here so they can be tested with `node --test`.

export const SERVICE_FEE_RATE = 0.05
export const MAX_PARTICIPANTS = 16

export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function today(): string {
  return toISODate(new Date())
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function daysUntil(iso: string, from = today()): number {
  const ms = new Date(iso + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()
  return Math.round(ms / 86_400_000)
}

export function priceBreakdown(pricePerPerson: number, participants: number) {
  const subtotal = pricePerPerson * participants
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  return { subtotal, serviceFee, total: subtotal + serviceFee }
}

export interface Batch {
  date: string
  spots: number
}

// Departures every three weeks starting two weeks out. Spots are derived from the
// trek id so the same trek always shows the same availability.
export function getBatches(trekId: string, from = today(), count = 5): Batch[] {
  const seed = [...trekId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return Array.from({ length: count }, (_, i) => ({
    date: addDays(from, 14 + i * 21),
    spots: ((seed * 7 + i * 5) % 12) + 1,
  }))
}

export function newBookingId(now = new Date()): string {
  return `TB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
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

export function isCardNumber(value: string): boolean {
  return /^\d{16}$/.test(value.replace(/\s/g, ''))
}

export function isExpiry(value: string, now = new Date()): boolean {
  const m = value.replace(/\s/g, '').match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

export function isUpiId(value: string): boolean {
  return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(value.trim())
}

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'
}
