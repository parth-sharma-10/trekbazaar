import Navbar from '../components/Navbar'
import { api, errorMessage, useApiList } from '../api'
import { useStore, type Review, type User } from '../store'
import { formatDate, formatINR } from '../lib'
import type { NavigateFn, Screen, UserRole } from '../types'

interface AdminDashboardProps {
  navigate: NavigateFn
  userRole: UserRole
}

const roleBadge: Record<UserRole, string> = {
  user: 'bg-slate-100 text-slate-700',
  operator: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
}

const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function AdminDashboard({ navigate, userRole }: AdminDashboardProps) {
  // An admin's bookings list from the store is every booking on the platform.
  const { notify, treks, bookings, user: me } = useStore()
  const { data: users, error: usersError, reload } = useApiList<User>('/users')
  const { data: reviews, error: reviewsError } = useApiList<Review>('/reviews')

  const operators = users.filter(u => u.role === 'operator')
  const unverified = operators.filter(u => !u.verified).length
  const pendingReviews = reviews.filter(r => r.status === 'Pending').length
  const pendingBookings = bookings.filter(b => b.status === 'Pending').length
  const accepted = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed')
  const acceptedValue = accepted.reduce((sum, b) => sum + b.amount, 0)
  const newThisMonth = bookings.filter(b => b.createdAt?.startsWith(thisMonth())).length
  const approved = reviews.filter(r => r.status === 'Approved')
  const average = approved.length ? (approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1) : null

  const alerts: { message: string; action: string; screen: Screen }[] = [
    unverified > 0 && { message: `${unverified} operator account${unverified === 1 ? '' : 's'} awaiting verification`, action: 'Review now', screen: 'operator-verification' as const },
    pendingReviews > 0 && { message: `${pendingReviews} review${pendingReviews === 1 ? '' : 's'} waiting for moderation`, action: 'Moderate', screen: 'reviews-management' as const },
  ].filter(a => !!a)

  const platformStats = [
    { label: 'Accounts', value: String(users.length), note: `${users.filter(u => u.role === 'user').length} trekkers · ${operators.length} operators`, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Verified Operators', value: String(operators.length - unverified), note: `${unverified} awaiting`, icon: '🏕️', color: 'bg-forest-50 text-forest' },
    { label: 'Treks Listed', value: String(treks.length), note: `${treks.filter(t => t.departures.some(d => d.seatsLeft > 0)).length} with open departures`, icon: '🏔️', color: 'bg-amber-50 text-amber-600' },
    { label: 'Confirmed + Completed Value', value: formatINR(acceptedValue), note: `${accepted.length} accepted bookings`, icon: '💰', color: 'bg-purple-50 text-purple-600' },
    { label: 'Bookings Requested This Month', value: String(newThisMonth), note: `${pendingBookings} pending across operators`, icon: '📋', color: 'bg-green-50 text-green-600' },
    { label: 'Approved Reviews', value: String(approved.length), note: average ? `${average}★ average` : 'No ratings yet', icon: '⭐', color: 'bg-orange-50 text-orange-600' },
  ]

  const newest = [...users].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5)

  const toggleSuspend = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { suspended: !u.suspended })
      notify(u.suspended ? `${u.name} reinstated` : `${u.name} suspended`)
      reload()
    } catch (err) {
      notify(errorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="admin-dashboard" userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform overview from the live database. {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>

        {(usersError || reviewsError) && <p className="mb-4 text-sm text-red-600" role="alert">{usersError ?? reviewsError}</p>}

        {/* Alerts */}
        <div className="space-y-2 mb-8">
          {alerts.length === 0 && (
            <div className="px-4 sm:px-5 py-3.5 rounded-xl border bg-green-50 border-green-100 text-sm font-medium text-green-800">Nothing needs your attention.</div>
          )}
          {alerts.map(a => (
            <div key={a.screen} className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3.5 rounded-xl border bg-amber-50 border-amber-100">
              <span className="text-sm font-medium text-amber-800">{a.message}</span>
              <button onClick={() => navigate(a.screen)} className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors">{a.action}</button>
            </div>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {platformStats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">{s.value}</div>
              <div className="text-sm text-slate-400 mb-1">{s.label}</div>
              <div className="text-xs text-slate-500">{s.note}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Newest accounts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Newest Accounts</h2>
              <button onClick={() => navigate('user-management')} className="text-sm text-forest hover:text-forest-dark font-medium">Manage all →</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {newest.map(u => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-300 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${u.suspended ? 'bg-red-100 text-red-700' : roleBadge[u.role ?? 'user']}`}>{u.suspended ? 'Suspended' : u.role}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{u.createdAt ? formatDate(u.createdAt.slice(0, 10)) : '—'}</td>
                      <td className="px-5 py-4">
                        {u.id === me?.id ? (
                          <span className="text-xs text-slate-400">you</span>
                        ) : (
                          <button onClick={() => toggleSuspend(u)} aria-pressed={!!u.suspended} className={`text-xs font-medium ${u.suspended ? 'text-green-600 hover:text-green-700' : 'text-slate-500 hover:text-red-600'}`}>
                            {u.suspended ? 'Reinstate' : 'Suspend'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick nav */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">Admin Tools</h2>
            {[
              { label: 'User Management', icon: '👥', screen: 'user-management' as const, desc: `${users.length} accounts` },
              { label: 'Operator Verification', icon: '✅', screen: 'operator-verification' as const, desc: `${unverified} awaiting verification` },
              { label: 'Reviews Management', icon: '⭐', screen: 'reviews-management' as const, desc: `${pendingReviews} to moderate` },
              { label: 'All Bookings', icon: '📋', screen: 'booking-management' as const, desc: `${bookings.length} bookings, ${pendingBookings} pending` },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.screen)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-forest-50 transition-colors">{item.icon}</div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <svg className="w-4 h-4 text-slate-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
