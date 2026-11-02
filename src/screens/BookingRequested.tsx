import { useStore } from '../store'
import { formatDate, formatINR } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingRequestedProps {
  navigate: NavigateFn
  userRole: UserRole
  bookingId: string | undefined
}

export default function BookingRequested({ navigate, bookingId }: BookingRequestedProps) {
  const { bookings, findTrek } = useStore()
  const booking = bookings.find(b => b.id === bookingId)
  const trek = findTrek(booking?.trekId)

  if (!booking || !trek) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 text-center">
        <div>
          <h1 className="font-display text-3xl text-slate-900 mb-2">Booking not found</h1>
          <p className="text-slate-500 mb-6">We couldn't find that booking in your account.</p>
          <button onClick={() => navigate('booking-history')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">View my bookings</button>
        </div>
      </div>
    )
  }

  const downloadSummary = () => {
    const lines = [
      'TrekBazaar booking request',
      '',
      `Booking ID:     ${booking.id}`,
      `Status:         ${booking.status}`,
      `Trek:           ${trek.title}`,
      `Operator:       ${trek.operator}`,
      `Departure:      ${formatDate(booking.date)}`,
      `Participants:   ${booking.participants}`,
      `Lead traveller: ${booking.traveller}`,
      `Meeting point:  ${trek.meetingPoint}`,
      `Amount:         INR ${booking.amount.toLocaleString('en-IN')} (payable to the operator, not paid yet)`,
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${booking.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-forest to-green-500 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-white mb-2">Request Sent</h1>
            <p className="text-white/80 text-sm">{trek.operator} will review it and confirm your seats.</p>
          </div>

          <div className="p-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking ID</span>
                <span className="font-mono font-bold text-forest text-sm">{booking.id}</span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Status', value: booking.status },
                  { label: 'Trek', value: trek.title },
                  { label: 'Departure', value: formatDate(booking.date) },
                  { label: 'Participants', value: `${booking.participants} ${booking.participants > 1 ? 'people' : 'person'}` },
                  { label: 'Meeting Point', value: trek.meetingPoint },
                  { label: 'Amount', value: `${formatINR(booking.amount)}, payable to the operator` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-slate-400 shrink-0">{label}</span>
                    <span className="font-medium text-slate-800 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-amber-800 mb-1">What happens next?</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• The operator sees your request and the contact details you gave</li>
                <li>• When they confirm, the status in My Bookings changes to Confirmed</li>
                <li>• Payment is arranged with the operator; nothing was charged here</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('booking-history')}
                className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                View My Bookings
              </button>
              <button
                onClick={downloadSummary}
                className="w-full border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Download Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
