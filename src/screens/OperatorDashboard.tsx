import Navbar from '../components/Navbar'
import { useStore } from '../store'
import { addDays, formatINR, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface OperatorDashboardProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const shortDate = (offset: number) =>
  new Date(addDays(today(), offset) + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

const recentBookings = [
  { id: 'TB-2026-389123', trekker: 'Rahul Kumar', trek: 'Roopkund Trek', date: shortDate(47), participants: 2, amount: 30450, status: 'Confirmed' },
  { id: 'TB-2026-387456', trekker: 'Priya Sharma', trek: 'Chadar Trek', date: shortDate(98), participants: 1, amount: 18900, status: 'Pending' },
  { id: 'TB-2026-384001', trekker: 'Arjun Mehta', trek: 'Roopkund Trek', date: shortDate(68), participants: 3, amount: 45675, status: 'Confirmed' },
  { id: 'TB-2026-378234', trekker: 'Kavya Nair', trek: 'Chadar Trek', date: shortDate(-20), participants: 2, amount: 37800, status: 'Completed' },
]

// Sample sales for the operator's seed listings; new listings start at zero.
const trekSales: Record<string, { bookings: number; revenue: number }> = {
  '1': { bookings: 23, revenue: 334350 },
  '4': { bookings: 14, revenue: 252000 },
}

const OPERATOR_ID = 'op1'

export default function OperatorDashboard({ navigate, userRole, setUserRole }: OperatorDashboardProps) {
  const { treks } = useStore()
  const myTreks = treks.filter(t => t.operatorId === OPERATOR_ID)
  const stats = [
    { label: 'Active Treks', value: String(myTreks.length), change: '+1', up: true, icon: '🏔️', color: 'bg-forest-50 text-forest' },
    { label: 'Total Bookings', value: '87', change: '+12', up: true, icon: '📋', color: 'bg-blue-50 text-blue-600' },
    { label: 'This Month Revenue', value: '₹2.4L', change: '+18%', up: true, icon: '💰', color: 'bg-amber-50 text-amber-600' },
    { label: 'Average Rating', value: '4.8', change: '+0.1', up: true, icon: '⭐', color: 'bg-purple-50 text-purple-600' },
  ]

  const statusConfig: Record<string, string> = {
    Confirmed: 'bg-green-100 text-green-700',
    Pending: 'bg-amber-100 text-amber-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="operator-dashboard" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Operator Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, Himalayan Treks Co. Here's your overview.</p>
          </div>
          <button onClick={() => navigate('add-trek')} className="flex items-center gap-2 bg-forest hover:bg-forest-dark text-white font-semibold px-5 py-2.5 rounded-full transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add New Trek
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <span className={`text-xs font-medium ${s.up ? 'text-green-600' : 'text-red-500'}`}>{s.change}</span>
              </div>
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
                    {recentBookings.map(b => (
                      <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-slate-900 text-sm">{b.trek}</div>
                          <div className="text-xs text-slate-400 font-mono">{b.id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{b.trekker[0]}</div>
                            <span className="text-sm text-slate-700">{b.trekker}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{b.date} · {b.participants}P</td>
                        <td className="px-5 py-4 font-semibold text-slate-900 text-sm">₹{b.amount.toLocaleString('en-IN')}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[b.status]}`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* My Treks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">My Treks</h2>
                <button onClick={() => navigate('add-trek')} className="text-sm text-forest hover:text-forest-dark font-medium">+ Add</button>
              </div>
              <div className="space-y-3">
                {myTreks.map(t => {
                  const sales = trekSales[t.id] ?? { bookings: 0, revenue: 0 }
                  return (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
                      <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        <img src={t.image} alt={t.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <button onClick={() => navigate('trek-details', { trek: t.id })} className="font-medium text-slate-900 text-sm truncate hover:text-forest text-left">{t.title}</button>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2 shrink-0">Active</span>
                        </div>
                        <div className="text-xs text-slate-400">{sales.bookings} bookings · {t.reviewCount > 0 ? `⭐ ${t.rating}` : 'New'}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-semibold text-forest">{formatINR(sales.revenue)}</span>
                          <button onClick={() => navigate('add-trek', { edit: t.id })} className="text-xs font-medium text-slate-500 hover:text-forest">Edit</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Add New Trek', screen: 'add-trek' as const, icon: '➕' },
                  { label: 'Manage Bookings', screen: 'booking-management' as const, icon: '📋' },
                  { label: 'View Analytics', screen: 'revenue-analytics' as const, icon: '📊' },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.screen)} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-forest-50 text-slate-700 hover:text-forest rounded-xl text-sm font-medium transition-colors">
                    <span>{a.icon}</span>
                    {a.label}
                    <svg className="w-4 h-4 ml-auto text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Verification badge */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
              <div>
                <p className="text-sm font-semibold text-blue-800">Verified Operator</p>
                <p className="text-xs text-blue-600 mt-0.5">Your profile is verified and trusted by trekkers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
