import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore, type BookingStatus } from '../store'
import { daysUntil, formatDate, formatINR } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingHistoryProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const FREE_CANCELLATION_DAYS = 30

const statusConfig: Record<BookingStatus, { bg: string; text: string }> = {
  Confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Cancelled: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

export default function BookingHistory({ navigate, userRole, setUserRole }: BookingHistoryProps) {
  const { bookings: allBookings, findTrek, setBookingStatus, notify } = useStore()
  const [filter, setFilter] = useState('All')
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null)
  const statuses = ['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled']

  const filtered = filter === 'All' ? allBookings : allBookings.filter(b => b.status === filter)

  const cancel = (id: string, date: string) => {
    setBookingStatus(id, 'Cancelled')
    setConfirmingCancel(null)
    notify(daysUntil(date) >= FREE_CANCELLATION_DAYS
      ? `Booking ${id} cancelled. Full refund in 5–7 business days (demo).`
      : `Booking ${id} cancelled. Departures within ${FREE_CANCELLATION_DAYS} days are not refundable.`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="booking-history" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-slate-900">My Bookings</h1>
          <p className="text-slate-500 mt-1">Your complete trek booking history</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s} {s === 'All' ? `(${allBookings.length})` : `(${allBookings.filter(b => b.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(b => {
            const sc = statusConfig[b.status]
            const trek = findTrek(b.trekId)
            const cancellable = b.status === 'Confirmed' || b.status === 'Pending'
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex gap-4 items-start flex-wrap sm:flex-nowrap">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img src={trek?.image} alt={trek?.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">{trek?.title ?? 'Trek'}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${sc.bg} ${sc.text}`}>{b.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{b.id} · {trek?.state}</p>
                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap">
                      <span>📅 {formatDate(b.date)}</span>
                      <span>👥 {b.participants} {b.participants > 1 ? 'people' : 'person'}</span>
                      <span className="font-bold text-slate-700">{formatINR(b.amount)}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                    {b.status !== 'Completed' && (
                      <button onClick={() => navigate('trek-details', { trek: b.trekId })} className="text-xs font-medium text-forest hover:text-forest-dark border border-forest rounded-lg px-3 py-1.5 transition-colors">View Trek</button>
                    )}
                    {b.status === 'Completed' && (
                      <button onClick={() => notify(`Thanks! Your review for ${trek?.title ?? 'this trek'} was submitted for moderation (demo).`)} className="text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors">Write Review</button>
                    )}
                    {cancellable && (confirmingCancel === b.id ? (
                      <button onClick={() => cancel(b.id, b.date)} className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1.5 transition-colors">
                        {daysUntil(b.date) >= FREE_CANCELLATION_DAYS ? 'Confirm cancel' : 'Cancel, no refund'}
                      </button>
                    ) : (
                      <button onClick={() => setConfirmingCancel(b.id)} className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">Cancel</button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="font-semibold text-slate-700 mb-2">No {filter !== 'All' ? filter.toLowerCase() : ''} bookings</h3>
              <p className="text-slate-400 text-sm mb-5">Start exploring treks to make your first booking.</p>
              <button onClick={() => navigate('explore')} className="bg-forest text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-forest-dark transition-colors">Explore Treks</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
