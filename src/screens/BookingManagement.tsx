import { Fragment, useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore, type BookingStatus } from '../store'
import { formatDate, formatINR, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingManagementProps {
  navigate: NavigateFn
  userRole: UserRole
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Cancelled: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

const actionLabel: Record<BookingStatus, string> = {
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
  Completed: 'marked completed',
  Pending: 'reopened',
}

export default function BookingManagement({ navigate, userRole }: BookingManagementProps) {
  // The API returns only bookings on treks this operator owns (or every booking for an admin).
  const { bookings, findTrek, setBookingStatus, notify } = useStore()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const change = async (id: string, status: BookingStatus) => {
    if (await setBookingStatus(id, status)) notify(`Booking ${id} ${actionLabel[status]}`)
  }

  const rows = [...bookings].sort((a, b) => b.date.localeCompare(a.date))
  const filtered = rows.filter(b => {
    if (filter !== 'All' && b.status !== filter) return false
    const q = search.toLowerCase()
    return !q || b.traveller.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
  })
  const bookedValue = rows.filter(b => b.status === 'Confirmed' || b.status === 'Completed').reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="booking-management" userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Booking Management</h1>
            <p className="text-slate-500 mt-1">Confirm or decline requests on your treks, and mark trips completed.</p>
          </div>
          <div className="bg-forest-50 border border-forest-100 rounded-xl px-5 py-3 text-right">
            <div className="text-xs text-slate-500">Confirmed + completed value</div>
            <div className="font-bold text-forest text-xl">{formatINR(bookedValue)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by trekker name or booking ID..." aria-label="Search bookings" className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filter === s ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {s} ({s === 'All' ? rows.length : rows.filter(b => b.status === s).length})
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trekker</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trek & Date</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Participants</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const sc = statusConfig[b.status]
                  const started = b.date <= today()
                  return (
                    <Fragment key={b.id}>
                      <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono text-xs text-slate-500">{b.id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{b.traveller[0]}</div>
                            <div>
                              <div className="font-medium text-slate-900 text-sm whitespace-nowrap">{b.traveller}</div>
                              <div className="text-xs text-slate-400 whitespace-nowrap">{b.phone || b.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-800 text-sm whitespace-nowrap">{findTrek(b.trekId)?.title ?? b.trekId}</div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">{formatDate(b.date)}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{b.participants} {b.participants > 1 ? 'people' : 'person'}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{formatINR(b.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{b.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button onClick={() => setOpen(o => (o === b.id ? null : b.id))} aria-expanded={open === b.id} className="text-xs font-medium text-slate-500 hover:text-slate-800">
                              {open === b.id ? 'Hide' : 'Details'}
                            </button>
                            {b.status === 'Pending' && (
                              <button onClick={() => change(b.id, 'Confirmed')} className="text-xs font-semibold text-green-600 hover:text-green-700">Confirm</button>
                            )}
                            {b.status === 'Confirmed' && started && (
                              <button onClick={() => change(b.id, 'Completed')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Complete</button>
                            )}
                            {(b.status === 'Pending' || b.status === 'Confirmed') && (
                              <button onClick={() => change(b.id, 'Cancelled')} className="text-xs font-medium text-red-500 hover:text-red-600">
                                {b.status === 'Pending' ? 'Decline' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {open === b.id && (
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <td colSpan={7} className="px-5 py-4">
                            <dl className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                              {[
                                ['Account email', b.email],
                                ['Phone', b.phone],
                                ['Emergency contact', b.emergencyContact],
                                ['Medical notes', b.medicalInfo],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <dt className="text-xs text-slate-400">{label}</dt>
                                  <dd className="text-slate-800 break-words">{value || 'Not given'}</dd>
                                </div>
                              ))}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      {rows.length === 0 ? 'No bookings on your treks yet.' : 'No bookings match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
