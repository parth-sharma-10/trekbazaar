// Plain JS so the Express server can import it on Vercel, which compiles .ts files away.
// The frontend gets these through lib.ts.

export const SERVICE_FEE_RATE = 0.05
export const MAX_PARTICIPANTS = 16

/** @param {number} pricePerPerson @param {number} participants */
export function priceBreakdown(pricePerPerson, participants) {
  const subtotal = pricePerPerson * participants
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  return { subtotal, serviceFee, total: subtotal + serviceFee }
}

export function newBookingId(now = new Date()) {
  return `TB-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
}
