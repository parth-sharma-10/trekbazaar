import { useStore } from '../store'
import { formatDate, formatINR } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface PaymentSuccessProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
  bookingId: string | undefined
}

export default function PaymentSuccess({ navigate, bookingId }: PaymentSuccessProps) {
  const { bookings, findTrek } = useStore()
  const booking = bookings.find(b => b.id === bookingId)
  const trek = findTrek(booking?.trekId)

  if (!booking || !trek) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 text-center">
        <div>
          <h1 className="font-display text-3xl text-slate-900 mb-2">Booking not found</h1>
          <p className="text-slate-500 mb-6">We couldn't find that booking on this device.</p>
          <button onClick={() => navigate('booking-history')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">View my bookings</button>
        </div>
      </div>
    )
  }

  const downloadReceipt = () => {
    const lines = [
      'TrekBazaar booking receipt (demo)',
      '',
      `Booking ID:    ${booking.id}`,
      `Trek:          ${trek.title}`,
      `Departure:     ${formatDate(booking.date)}`,
      `Participants:  ${booking.participants}`,
      `Lead traveller: ${booking.traveller}`,
      `Meeting point: ${trek.meetingPoint}`,
      `Amount paid:   INR ${booking.amount.toLocaleString('en-IN')}`,
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
        {/* Success animation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-forest to-green-500 px-8 py-10 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-white mb-2">Booking Confirmed!</h1>
            <p className="text-white/80 text-sm">Your adventure is officially booked. Get ready to conquer the mountains!</p>
          </div>

          {/* Booking details */}
          <div className="p-6">
            <div className="bg-slate-50 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking ID</span>
                <span className="font-mono font-bold text-forest text-sm">{booking.id}</span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Trek', value: trek.title },
                  { label: 'Departure', value: formatDate(booking.date) },
                  { label: 'Participants', value: `${booking.participants} ${booking.participants > 1 ? 'people' : 'person'}` },
                  { label: 'Meeting Point', value: trek.meetingPoint },
                  { label: 'Amount Paid', value: formatINR(booking.amount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-slate-400 shrink-0">{label}</span>
                    <span className="font-medium text-slate-800 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: '📧', label: 'Confirmation email (demo)' },
                { icon: '📱', label: 'SMS update (demo)' },
              ].map(item => (
                <div key={item.label} className="text-center bg-slate-50 rounded-xl p-3">
                  <div className="text-2xl mb-1" aria-hidden="true">{item.icon}</div>
                  <p className="text-xs text-slate-500 leading-tight">{item.label}</p>
                </div>
              ))}
              <button onClick={downloadReceipt} className="text-center bg-slate-50 hover:bg-forest-50 rounded-xl p-3 transition-colors">
                <div className="text-2xl mb-1" aria-hidden="true">📄</div>
                <p className="text-xs text-forest font-medium leading-tight">Download receipt</p>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-amber-800 mb-1">📋 What happens next?</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• The operator will call you 7 days before departure</li>
                <li>• Packing list will be emailed 2 weeks before</li>
                <li>• You can track your booking in your dashboard</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('user-dashboard')}
                className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors"
              >
                Go to My Dashboard
              </button>
              <button
                onClick={() => navigate('explore')}
                className="w-full border-2 border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Explore More Treks
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Plans changed?{' '}
          <button onClick={() => navigate('booking-history')} className="text-forest hover:text-forest-dark underline">Manage this booking</button>
        </p>
      </div>
    </div>
  )
}
