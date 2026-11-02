import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import { formatDate, formatINR, isPhone, MAX_PARTICIPANTS, priceBreakdown } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingFlowProps {
  navigate: NavigateFn
  trekId: string | undefined
  initialDate?: string
  initialParticipants: number
  userRole: UserRole
}

type Errors = Partial<Record<string, string>>

const inputClass = (invalid: boolean) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest placeholder-slate-400 ${invalid ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-red-600 mt-1" role="alert">{message}</p> : null
}

export default function BookingFlow({ navigate, trekId, initialDate, initialParticipants, userRole }: BookingFlowProps) {
  const { findTrek, user, addBooking } = useStore()
  const trek = findTrek(trekId)
  const departures = (trek?.departures ?? []).filter(d => d.seatsLeft > 0)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [processing, setProcessing] = useState(false)
  const [firstName, ...rest] = (user?.name ?? '').split(' ')
  const [form, setForm] = useState({
    date: departures.some(d => d.date === initialDate) ? initialDate! : '',
    participants: Math.min(MAX_PARTICIPANTS, Math.max(1, initialParticipants)),
    firstName,
    lastName: rest.join(' '),
    phone: user?.phone ?? '',
    emergencyContact: '',
    medicalInfo: '',
  })

  if (!trek) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar navigate={navigate} currentScreen="booking" userRole={userRole} />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl text-slate-900 mb-2">Choose a trek first</h1>
          <p className="text-slate-500 mb-6">Pick a trek to see its departures and book a spot.</p>
          <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">Explore treks</button>
        </div>
      </div>
    )
  }

  const { subtotal, serviceFee, total } = priceBreakdown(trek.price, form.participants)
  const selected = departures.find(d => d.date === form.date)
  const maxParticipants = Math.min(MAX_PARTICIPANTS, selected?.seatsLeft ?? MAX_PARTICIPANTS)
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
    if (!isPhone(form.phone)) e.phone = 'Enter a 10-digit Indian mobile number'
    if (form.emergencyContact.trim().length < 5) e.emergencyContact = 'Add an emergency contact name and phone'
    return e
  }

  // Wait a frame so aria-invalid has rendered, then bring the first bad field into view.
  const focusFirstError = () =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())

  const goTo = (next: number, validate?: () => Errors) => {
    const found = validate?.() ?? {}
    setErrors(found)
    if (Object.keys(found).length > 0) focusFirstError()
    else {
      setStep(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // No payment is taken online: the request is stored as Pending and the operator confirms it.
  const submit = async () => {
    setProcessing(true)
    const booking = await addBooking({
      trekId: trek.id,
      date: form.date,
      participants: form.participants,
      traveller: `${form.firstName.trim()} ${form.lastName.trim()}`,
      phone: form.phone.trim(),
      emergencyContact: form.emergencyContact.trim(),
      medicalInfo: form.medicalInfo.trim(),
    })
    setProcessing(false)
    if (booking) navigate('booking-requested', { booking: booking.id })
  }

  const steps = ['Select Dates', 'Participants', 'Review']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="booking" userRole={userRole} />

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

                {departures.length === 0 && (
                  <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3 mb-6">
                    {trek.operator} has no departures with free seats right now. Check back later.
                  </p>
                )}
                <div className="space-y-3 mb-6" role="radiogroup" aria-label="Departure dates">
                  {departures.map(b => (
                    <button
                      key={b.date}
                      role="radio"
                      aria-checked={form.date === b.date}
                      onClick={() => update({ date: b.date, participants: Math.min(form.participants, b.seatsLeft) })}
                      className={`w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 rounded-xl border-2 transition-all ${form.date === b.date ? 'border-forest bg-forest-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="text-left">
                        <div className={`font-semibold ${form.date === b.date ? 'text-forest' : 'text-slate-800'}`}>{formatDate(b.date)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{trek.duration} · Starts at {trek.meetingPoint}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${b.seatsLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {b.seatsLeft} seat{b.seatsLeft === 1 ? '' : 's'} left
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
                  {selected && form.participants >= maxParticipants && (
                    <p className="text-xs text-amber-700 mt-2">Only {selected.seatsLeft} seat{selected.seatsLeft === 1 ? '' : 's'} left on this departure.</p>
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
                    <span className="block text-sm font-medium text-slate-700 mb-1.5">Email</span>
                    <p className="px-4 py-3 text-sm text-slate-500 bg-slate-50 rounded-xl truncate">{user?.email}</p>
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
                    Review Request
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-2xl text-slate-900 mb-1">Review Your Request</h2>
                <p className="text-slate-500 text-sm mb-6">
                  No payment is taken online. {trek.operator} reviews the request, confirms your seats and arranges payment with you directly.
                </p>

                <dl className="divide-y divide-slate-100 border border-slate-100 rounded-xl mb-6 text-sm">
                  {[
                    ['Departure', formatDate(form.date)],
                    ['Participants', `${form.participants} ${form.participants > 1 ? 'people' : 'person'}`],
                    ['Lead traveller', `${form.firstName.trim()} ${form.lastName.trim()}`],
                    ['Phone', form.phone],
                    ['Emergency contact', form.emergencyContact],
                    ['Medical notes', form.medicalInfo.trim() || 'None'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 px-4 py-3">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-slate-900 font-medium text-right break-words min-w-0">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} disabled={processing} className="border-2 border-slate-200 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40">Back</button>
                  <button onClick={submit} disabled={processing} className="flex-1 bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-wait">
                    {processing ? 'Sending request…' : 'Send Booking Request'}
                  </button>
                </div>
              </div>
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

              <p className="mt-4 text-xs text-slate-500">Payable to the operator after they confirm. You can cancel from My Bookings until the trek starts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
