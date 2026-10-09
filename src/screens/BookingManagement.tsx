import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import { addDays, formatDate, formatINR, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface BookingManagementProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const OPERATOR_ID = 'op1'

// Bookings from other trekkers. The signed-in trekker's own bookings are merged in from the store.
const sampleBookings = [
  { id: 'TB-2026-387456', trekker: 'Priya Sharma', trek: 'Chadar Trek', date: addDays(today(), 98), participants: 1, amount: 18900, status: 'Pending', phone: '+91 87654 32109' },
  { id: 'TB-2026-384001', trekker: 'Arjun Mehta', trek: 'Roopkund Trek', date: addDays(today(), 68), participants: 3, amount: 45675, status: 'Confirmed', phone: '+91 76543 21098' },
  { id: 'TB-2026-378234', trekker: 'Kavya Nair', trek: 'Chadar Trek', date: addDays(today(), -20), participants: 2, amount: 37800, status: 'Completed', phone: '+91 65432 10987' },
  { id: 'TB-2026-371002', trekker: 'Dev Arora', trek: 'Roopkund Trek', date: addDays(today(), 30), participants: 1, amount: 15225, status: 'Cancelled', phone: '+91 54321 09876' },
  { id: 'TB-2026-365123', trekker: 'Ananya Gupta', trek: 'Chadar Trek', date: addDays(today(), 112), participants: 4, amount: 75600, status: 'Pending', phone: '+91 43210 98765' },
]

const statusConfig: Record<string, { bg: string; text: string }> = {
  Confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Cancelled: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

export default function BookingManagement({ navigate, userRole, setUserRole }: BookingManagementProps) {
  const { bookings, findTrek, setBookingStatus, notify, user } = useStore()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sampleStatus, setSampleStatus] = useState<Record<string, string>>({})

  const ownBookings = bookings
    .filter(b => findTrek(b.trekId)?.operatorId === OPERATOR_ID)
    .map(b => ({ id: b.id, trekker: b.traveller, trek: findTrek(b.trekId)!.title, date: b.date, participants: b.participants, amount: b.amount, status: b.status as string, phone: user?.phone || '+91 98765 43210' }))
  const allBookings = [...ownBookings, ...sampleBookings.map(b => ({ ...b, status: sampleStatus[b.id] ?? b.status }))]
    .sort((a, b) => b.date.localeCompare(a.date))

  const confirm = (id: string) => {
    if (ownBookings.some(b => b.id === id)) setBookingStatus(id, 'Confirmed')
    else setSampleStatus(s => ({ ...s, [id]: 'Confirmed' }))
    notify(`Booking ${id} confirmed. The trekker has been notified (demo).`)
  }

  const filtered = allBookings.filter(b => {
    if (filter !== 'All' && b.status !== filter) return false
    if (search && !b.trekker.toLowerCase().includes(search.toLowerCase()) && !b.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalRevenue = allBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="booking-management" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Booking Management</h1>
            <p className="text-slate-500 mt-1">Manage all your trek bookings in one place</p>
          </div>
          <div className="bg-forest-50 border border-forest-100 rounded-xl px-5 py-3 text-right">
            <div className="text-xs text-slate-500">Total Revenue (Active)</div>
            <div className="font-bold text-forest text-xl">{formatINR(totalRevenue)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by trekker name or booking ID..." className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filter === s ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{s}</button>
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
                  return (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-slate-500">{b.id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{b.trekker[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm whitespace-nowrap">{b.trekker}</div>
                            <div className="text-xs text-slate-400 whitespace-nowrap">{b.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 text-sm whitespace-nowrap">{b.trek}</div>
                        <div className="text-xs text-slate-400 whitespace-nowrap">{formatDate(b.date)}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{b.participants} {b.participants > 1 ? 'people' : 'person'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{formatINR(b.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{b.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => notify(`${b.id}: ${b.trekker}, ${b.participants} ${b.participants > 1 ? 'people' : 'person'}, ${b.phone}`)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="View" aria-label={`View booking ${b.id}`}>
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          {b.status === 'Pending' && (
                            <button onClick={() => confirm(b.id)} className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Confirm" aria-label={`Confirm booking ${b.id}`}>
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          <button onClick={() => notify(`Message thread with ${b.trekker} is not part of this demo.`)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Message" aria-label={`Message ${b.trekker}`}>
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">No bookings match your filters.</td>
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
