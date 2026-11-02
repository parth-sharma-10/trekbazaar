import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import { formatDate, formatINR } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface OperatorDashboardProps {
  navigate: NavigateFn
  userRole: UserRole
}

const statusConfig: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Completed: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-slate-100 text-slate-600',
}

// Value of bookings the operator has accepted. No money moves through TrekBazaar.
const isBooked = (status: string) => status === 'Confirmed' || status === 'Completed'

export default function OperatorDashboard({ navigate, userRole }: OperatorDashboardProps) {
  const { treks, bookings, findTrek, deleteTrek, notify, user } = useStore()
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  const remove = async (id: string, title: string) => {
    setConfirmingDelete(null)
    if (await deleteTrek(id)) notify(`${title} deleted`)
  }
  // The API only returns bookings on this operator's own treks.
  const myTreks = treks.filter(t => t.operatorId === user?.id)
  const pending = bookings.filter(b => b.status === 'Pending')
  const bookedValue = bookings.filter(b => isBooked(b.status)).reduce((sum, b) => sum + b.amount, 0)
  const reviewed = myTreks.filter(t => t.reviewCount > 0)
  const reviewTotal = reviewed.reduce((sum, t) => sum + t.reviewCount, 0)
  const averageRating = reviewTotal
    ? (reviewed.reduce((sum, t) => sum + t.rating * t.reviewCount, 0) / reviewTotal).toFixed(1)
    : '—'
  const stats = [
    { label: 'Listed Treks', value: String(myTreks.length), icon: '🏔️', color: 'bg-forest-50 text-forest' },
    { label: 'Requests to Review', value: String(pending.length), icon: '⏳', color: 'bg-amber-50 text-amber-600' },
    { label: 'Confirmed + Completed Value', value: formatINR(bookedValue), icon: '💰', color: 'bg-blue-50 text-blue-600' },
    { label: reviewTotal ? `Average of ${reviewTotal} review${reviewTotal === 1 ? '' : 's'}` : 'No reviews yet', value: averageRating, icon: '⭐', color: 'bg-purple-50 text-purple-600' },
  ]
  const recent = bookings.slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="operator-dashboard" userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Operator Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.name}</p>
          </div>
          {user?.verified && (
            <button onClick={() => navigate('add-trek')} className="flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-semibold px-5 py-2.5 rounded-full transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add New Trek
            </button>
          )}
        </div>

        {!user?.verified && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8" role="status">
            <p className="text-sm font-semibold text-amber-800">Awaiting verification</p>
            <p className="text-xs text-amber-700 mt-0.5">An admin has to verify your account before you can publish treks. This page updates when they do.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent bookings */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Recent Bookings</h2>
              <button onClick={() => navigate('booking-management')} className="text-sm text-forest hover:text-forest-dark font-medium">View all →</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {recent.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No bookings on your treks yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trekker</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map(b => (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900 text-sm">{findTrek(b.trekId)?.title ?? b.trekId}</div>
                            <div className="text-xs text-slate-400 font-mono">{b.id}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{b.traveller[0]}</div>
                              <span className="text-sm text-slate-700">{b.traveller}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(b.date)} · {b.participants}P</td>
                          <td className="px-5 py-4 font-semibold text-slate-900 text-sm">{formatINR(b.amount)}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[b.status]}`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* My Treks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">My Treks</h2>
                {user?.verified && <button onClick={() => navigate('add-trek')} className="text-sm text-forest hover:text-forest-dark font-medium">+ Add</button>}
              </div>
              <div className="space-y-3">
                {myTreks.length === 0 && (
                  <p className="bg-white rounded-2xl border border-slate-100 p-4 text-sm text-slate-400">You have not published a trek yet.</p>
                )}
                {myTreks.map(t => {
                  const trekBookings = bookings.filter(b => b.trekId === t.id)
                  const value = trekBookings.filter(b => isBooked(b.status)).reduce((sum, b) => sum + b.amount, 0)
                  const open = t.departures.filter(d => d.seatsLeft > 0).length
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
                      <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <button onClick={() => navigate('trek-details', { trek: t.id })} className="font-medium text-slate-900 text-sm truncate hover:text-forest text-left">{t.title}</button>
                          <span className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${open ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {open ? `${open} open date${open === 1 ? '' : 's'}` : 'No open dates'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{trekBookings.length} booking{trekBookings.length === 1 ? '' : 's'} · {t.reviewCount > 0 ? `⭐ ${t.rating}` : 'No reviews'}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-semibold text-forest">{formatINR(value)}</span>
                          {confirmingDelete === t.id ? (
                            <span className="flex gap-2">
                              <button onClick={() => remove(t.id, t.title)} className="text-xs font-semibold text-red-600 hover:text-red-700">Confirm delete</button>
                              <button onClick={() => setConfirmingDelete(null)} className="text-xs font-medium text-slate-500">Keep</button>
                            </span>
                          ) : (
                            <span className="flex gap-3">
                              <button onClick={() => navigate('add-trek', { edit: t.id })} className="text-xs font-medium text-slate-500 hover:text-forest">Edit</button>
                              <button onClick={() => setConfirmingDelete(t.id)} className="text-xs font-medium text-slate-500 hover:text-red-600">Delete</button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {user?.verified && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-blue-800">Verified operator</p>
                <p className="text-xs text-blue-600 mt-0.5">An admin has verified your account, so you can publish treks.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
