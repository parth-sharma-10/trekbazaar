import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import {
  formatDate, formatINR, getBatches, isCardNumber, isEmail, isExpiry, isPhone, isUpiId,
  MAX_PARTICIPANTS, newBookingId, priceBreakdown,
} from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingFlowProps {
  navigate: NavigateFn
  trekId: string | undefined
  initialDate?: string
  initialParticipants: number
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

type Errors = Partial<Record<string, string>>

const inputClass = (invalid: boolean) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest placeholder-slate-400 ${invalid ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-red-600 mt-1" role="alert">{message}</p> : null
}

export default function BookingFlow({ navigate, trekId, initialDate, initialParticipants, userRole, setUserRole }: BookingFlowProps) {
  const { findTrek, user, addBooking } = useStore()
  const trek = findTrek(trekId)
  const batches = getBatches(trekId ?? '')
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [processing, setProcessing] = useState(false)
  const [firstName, ...rest] = (user?.name ?? '').split(' ')
  const [form, setForm] = useState({
    date: batches.some(b => b.date === initialDate) ? initialDate! : '',
    participants: Math.min(MAX_PARTICIPANTS, Math.max(1, initialParticipants)),
    firstName,
    lastName: rest.join(' '),
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    emergencyContact: '',
    medicalInfo: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiry: '',
    cvv: '',
    upiId: '',
    bank: 'HDFC Bank',
  })

  if (!trek) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar navigate={navigate} currentScreen="booking" userRole={userRole} setUserRole={setUserRole} />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl text-slate-900 mb-2">Choose a trek first</h1>
          <p className="text-slate-500 mb-6">Pick a trek to see its departures and book a spot.</p>
          <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">Explore treks</button>
        </div>
      </div>
    )
  }

  const { subtotal, serviceFee, total } = priceBreakdown(trek.price, form.participants)
  const selectedBatch = batches.find(b => b.date === form.date)
  const maxParticipants = Math.min(MAX_PARTICIPANTS, selectedBatch?.spots ?? MAX_PARTICIPANTS)
  const update = (patch: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...patch }))
    setErrors(e => {
      const next = { ...e }
      Object.keys(patch).forEach(k => delete next[k])
      return next
    })
  }

  const validateDetails = (): Errors => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = 'Enter your first name'
    if (!form.lastName.trim()) e.lastName = 'Enter your last name'
    if (!isEmail(form.email)) e.email = 'Enter a valid email address'
    if (!isPhone(form.phone)) e.phone = 'Enter a 10-digit Indian mobile number'
    if (form.emergencyContact.trim().length < 5) e.emergencyContact = 'Add an emergency contact name and phone'
    return e
  }

  const validatePayment = (): Errors => {
    const e: Errors = {}
    if (form.paymentMethod === 'card') {
      if (!isCardNumber(form.cardNumber)) e.cardNumber = 'Card number must be 16 digits'
      if (!isExpiry(form.expiry)) e.expiry = 'Use MM/YY and a future date'
      if (!/^\d{3,4}$/.test(form.cvv)) e.cvv = '3 or 4 digits'
    }
    if (form.paymentMethod === 'upi' && !isUpiId(form.upiId)) e.upiId = 'Enter a UPI ID like name@bank'
    return e
  }

  const goTo = (next: number, validate?: () => Errors) => {
    const found = validate?.() ?? {}
    setErrors(found)
    if (Object.keys(found).length === 0) {
      setStep(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const pay = () => {
    const found = validatePayment()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setProcessing(true)
    // ponytail: simulated gateway delay; replace with a real payment intent when a backend exists.
    window.setTimeout(() => {
      const id = newBookingId()
      addBooking({
        id,
        trekId: trek.id,
        date: form.date,
        participants: form.participants,
        amount: total,
        status: 'Confirmed',
        traveller: `${form.firstName.trim()} ${form.lastName.trim()}`,
      })
      navigate('payment-success', { booking: id })
    }, 1200)
  }

  const steps = ['Select Dates', 'Participants', 'Payment']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="booking" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('trek-details', { trek: trek.id })} className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to {trek.title}
        </button>

        {/* Progress */}
        <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
          {steps.map((s, i) => {
            const n = i + 1
            const done = step > n
            const active = step === n
            return (
              <li key={s} className="flex items-center gap-2 sm:gap-4" aria-current={active ? 'step' : undefined}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${done ? 'bg-forest text-white' : active ? 'bg-forest text-white ring-4 ring-forest-100' : 'bg-slate-200 text-slate-500'}`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : n}
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-slate-900' : 'text-slate-400 hidden sm:inline'}`}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-6 sm:w-16 h-0.5 ${done ? 'bg-forest' : 'bg-slate-200'}`} />}
              </li>
            )
          })}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
            {step === 1 && (
              <div>
                <h2 className="font-display text-2xl text-slate-900 mb-1">Select Your Batch</h2>
                <p className="text-slate-500 text-sm mb-6">Choose a departure date for your trek</p>

                <div className="space-y-3 mb-6" role="radiogroup" aria-label="Departure dates">
                  {batches.map(b => (
                    <button
                      key={b.date}
                      role="radio"
                      aria-checked={form.date === b.date}
                      onClick={() => update({ date: b.date, participants: Math.min(form.participants, b.spots) })}
                      className={`w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 rounded-xl border-2 transition-all ${form.date === b.date ? 'border-forest bg-forest-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="text-left">
                        <div className={`font-semibold ${form.date === b.date ? 'text-forest' : 'text-slate-800'}`}>{formatDate(b.date)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{trek.duration} · Starts at {trek.meetingPoint}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${b.spots <= 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {b.spots} spot{b.spots === 1 ? '' : 's'} left
                        </span>
                        {form.date === b.date && (
                          <div className="w-5 h-5 bg-forest rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <span className="block text-sm font-semibold text-slate-700 mb-2">Number of Participants</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => update({ participants: Math.max(1, form.participants - 1) })} disabled={form.participants <= 1} aria-label="Fewer participants" className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-forest hover:text-forest transition-colors text-xl disabled:opacity-40">−</button>
                    <span className="text-2xl font-bold text-slate-900 w-8 text-center" aria-live="polite">{form.participants}</span>
                    <button onClick={() => update({ participants: Math.min(maxParticipants, form.participants + 1) })} disabled={form.participants >= maxParticipants} aria-label="More participants" className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-forest hover:text-forest transition-colors text-xl disabled:opacity-40">+</button>
                    <span className="text-sm text-slate-400">{form.participants > 1 ? 'people' : 'person'}</span>
                  </div>
                  {selectedBatch && form.participants >= maxParticipants && (
                    <p className="text-xs text-amber-700 mt-2">Only {selectedBatch.spots} spot{selectedBatch.spots === 1 ? '' : 's'} left on this departure.</p>
                  )}
                </div>

                <button
                  onClick={() => goTo(2)}
                  disabled={!form.date}
                  className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {form.date ? 'Continue to Participant Details' : 'Select a departure to continue'}
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={e => { e.preventDefault(); goTo(3, validateDetails) }} noValidate>
                <h2 className="font-display text-2xl text-slate-900 mb-1">Participant Details</h2>
                <p className="text-slate-500 text-sm mb-6">Lead traveller details for trek registration and safety</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                    <input id="firstName" autoComplete="given-name" value={form.firstName} onChange={e => update({ firstName: e.target.value })} placeholder="Rahul" aria-invalid={!!errors.firstName} className={inputClass(!!errors.firstName)} />
                    <FieldError message={errors.firstName} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                    <input id="lastName" autoComplete="family-name" value={form.lastName} onChange={e => update({ lastName: e.target.value })} placeholder="Kumar" aria-invalid={!!errors.lastName} className={inputClass(!!errors.lastName)} />
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input id="email" type="email" autoComplete="email" value={form.email} onChange={e => update({ email: e.target.value })} placeholder="rahul@example.com" aria-invalid={!!errors.email} className={inputClass(!!errors.email)} />
                    <FieldError message={errors.email} />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={e => update({ phone: e.target.value })} placeholder="+91 98765 43210" aria-invalid={!!errors.phone} className={inputClass(!!errors.phone)} />
                    <FieldError message={errors.phone} />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="emergency" className="block text-sm font-medium text-slate-700 mb-1.5">Emergency Contact (Name & Phone)</label>
                  <input id="emergency" value={form.emergencyContact} onChange={e => update({ emergencyContact: e.target.value })} placeholder="Priya Kumar — +91 87654 32109" aria-invalid={!!errors.emergencyContact} className={inputClass(!!errors.emergencyContact)} />
                  <FieldError message={errors.emergencyContact} />
                </div>

                <div className="mb-6">
                  <label htmlFor="medical" className="block text-sm font-medium text-slate-700 mb-1.5">Medical Conditions or Allergies <span className="text-slate-400 font-normal">(optional)</span></label>
                  <textarea id="medical" value={form.medicalInfo} onChange={e => update({ medicalInfo: e.target.value })} placeholder="List any medical conditions, medications, or dietary restrictions..." rows={3} className={`${inputClass(false)} resize-none`} />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border-2 border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                    Back
                  </button>
                  <button type="submit" className="flex-1 bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors">
                    Continue to Payment
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={e => { e.preventDefault(); pay() }} noValidate>
                <h2 className="font-display text-2xl text-slate-900 mb-1">Secure Payment</h2>
                <p className="text-slate-500 text-sm mb-6">Demo checkout. No real payment is taken.</p>

                <div className="flex gap-2 sm:gap-3 mb-5" role="radiogroup" aria-label="Payment method">
                  {['card', 'upi', 'netbanking'].map(method => (
                    <button
                      type="button"
                      key={method}
                      role="radio"
                      aria-checked={form.paymentMethod === method}
                      onClick={() => update({ paymentMethod: method })}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${form.paymentMethod === method ? 'border-forest bg-forest-50 text-forest' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {method === 'upi' ? 'UPI' : method === 'netbanking' ? 'Net Banking' : 'Card'}
                    </button>
                  ))}
                </div>

                {form.paymentMethod === 'card' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="card" className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                      <input
                        id="card"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={form.cardNumber}
                        onChange={e => update({ cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })}
                        placeholder="4242 4242 4242 4242"
                        aria-invalid={!!errors.cardNumber}
                        className={`${inputClass(!!errors.cardNumber)} font-mono`}
                      />
                      <FieldError message={errors.cardNumber} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiry" className="block text-sm font-medium text-slate-700 mb-1.5">Expiry</label>
                        <input
                          id="expiry"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          value={form.expiry}
                          onChange={e => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                            update({ expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits })
                          }}
                          placeholder="MM/YY"
                          aria-invalid={!!errors.expiry}
                          className={`${inputClass(!!errors.expiry)} font-mono`}
                        />
                        <FieldError message={errors.expiry} />
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-slate-700 mb-1.5">CVV</label>
                        <input id="cvv" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={form.cvv} onChange={e => update({ cvv: e.target.value.replace(/\D/g, '') })} placeholder="•••" aria-invalid={!!errors.cvv} className={`${inputClass(!!errors.cvv)} font-mono`} />
                        <FieldError message={errors.cvv} />
                      </div>
                    </div>
                  </div>
                )}

                {form.paymentMethod === 'upi' && (
                  <div className="mb-6">
                    <label htmlFor="upi" className="block text-sm font-medium text-slate-700 mb-1.5">UPI ID</label>
                    <input id="upi" value={form.upiId} onChange={e => update({ upiId: e.target.value })} placeholder="rahul@okhdfc" aria-invalid={!!errors.upiId} className={inputClass(!!errors.upiId)} />
                    <FieldError message={errors.upiId} />
                  </div>
                )}

                {form.paymentMethod === 'netbanking' && (
                  <div className="mb-6">
                    <label htmlFor="bank" className="block text-sm font-medium text-slate-700 mb-1.5">Select Bank</label>
                    <select id="bank" value={form.bank} onChange={e => update({ bank: e.target.value })} className={`${inputClass(false)} text-slate-600 bg-white`}>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>SBI</option>
                      <option>Axis Bank</option>
                      <option>Kotak Bank</option>
                    </select>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 mb-5 text-xs text-slate-500 flex items-start gap-2">
                  <svg className="w-4 h-4 text-forest shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  By completing this booking, you agree to our Terms of Service and cancellation policy. Free cancellation up to 30 days before departure.
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} disabled={processing} className="border-2 border-slate-200 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40">Back</button>
                  <button type="submit" disabled={processing} className="flex-1 bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-wait">
                    {processing ? 'Processing payment…' : `Pay ${formatINR(total)}`}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Booking summary */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 lg:sticky lg:top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Booking Summary</h3>
              <div className="flex gap-3 mb-4">
                <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src={trek.image} alt={trek.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm leading-tight">{trek.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{trek.location}, {trek.state}</div>
                  <div className="text-xs text-slate-500 mt-1">{trek.duration} · {trek.difficulty}</div>
                </div>
              </div>

              {form.date && (
                <div className="bg-forest-50 rounded-xl px-4 py-3 mb-4 text-sm">
                  <div className="text-xs text-slate-500 mb-0.5">Departure</div>
                  <div className="font-semibold text-forest">{formatDate(form.date)}</div>
                </div>
              )}

              <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-500">
                  <span>{formatINR(trek.price)} × {form.participants}</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service fee (5%)</span>
                  <span>{formatINR(serviceFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-forest">{formatINR(total)}</span>
                </div>
              </div>

              <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center gap-2 text-xs text-green-700">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Free cancellation until 30 days before departure
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
