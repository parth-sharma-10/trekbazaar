import Navbar from '../components/Navbar'
import TrekCard from '../components/TrekCard'
import { useCurrentUser, useStore } from '../store'
import { daysUntil, formatDate, formatINR, initials } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface UserDashboardProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const activities = [
  { icon: '✅', text: 'Booking confirmed for Roopkund Trek', time: '2 hours ago' },
  { icon: '⭐', text: 'You reviewed Kedarkantha Trek', time: '5 days ago' },
  { icon: '❤️', text: 'Added Chadar Trek to wishlist', time: '1 week ago' },
  { icon: '✅', text: 'Completed Triund Trek', time: '3 weeks ago' },
]

const VETERAN_TREKS = 10

export default function UserDashboard({ navigate, userRole, setUserRole }: UserDashboardProps) {
  const { bookings, wishlist, treks, findTrek } = useStore()
  const user = useCurrentUser()
  const upcomingBookings = bookings
    .filter(b => (b.status === 'Confirmed' || b.status === 'Pending') && daysUntil(b.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
  const completed = bookings.filter(b => b.status === 'Completed')
  const booked = new Set(bookings.map(b => b.trekId))
  const recommended = treks.filter(t => !booked.has(t.id) && !wishlist.includes(t.id)).slice(0, 2)

  const stats = [
    { label: 'Treks Completed', value: completed.length, icon: '🏔️', color: 'bg-forest-50 text-forest' },
    { label: 'Upcoming', value: upcomingBookings.length, icon: '📅', color: 'bg-blue-50 text-blue-600' },
    { label: 'Wishlist', value: wishlist.length, icon: '❤️', color: 'bg-red-50 text-red-500' },
    { label: 'Total Bookings', value: bookings.length, icon: '📋', color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="user-dashboard" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-slate-900">Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 mt-1">
            {upcomingBookings.length > 0
              ? `Your next adventure is ${daysUntil(upcomingBookings[0].date)} days away. Time to start packing!`
              : 'No treks on the calendar yet. Find your next one below.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming treks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Upcoming Bookings</h2>
              <button onClick={() => navigate('booking-history')} className="text-sm text-forest hover:text-forest-dark font-medium">View all →</button>
            </div>

            {upcomingBookings.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-slate-500 text-sm mb-4">You have no upcoming bookings.</p>
                <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm">Find a trek</button>
              </div>
            )}

            {upcomingBookings.map(b => {
              const trek = findTrek(b.trekId)
              return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 flex gap-4 hover:shadow-md transition-shadow">
                <div className="hidden sm:block w-20 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src={trek?.image} alt={trek?.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{trek?.title ?? 'Trek'}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${b.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{b.id}</p>
                  <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">📅 {formatDate(b.date)}</span>
                    <span className="font-semibold text-forest">{daysUntil(b.date)} days to go</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">{formatINR(b.amount)}</div>
                  <button onClick={() => navigate('trek-details', { trek: b.trekId })} className="mt-2 text-xs text-forest hover:text-forest-dark font-medium">View trek →</button>
                </div>
              </div>
              )
            })}

            {/* Recommended */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Recommended For You</h2>
                <button onClick={() => navigate('explore')} className="text-sm text-forest hover:text-forest-dark font-medium">Explore all →</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommended.map(t => (
                  <TrekCard key={t.id} trek={t} navigate={navigate} compact />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">{initials(user.name)}</div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              <div className="space-y-1">
                {[
                  { label: 'Edit Profile', screen: 'settings' as const },
                  { label: 'My Wishlist', screen: 'wishlist' as const },
                  { label: 'Booking History', screen: 'booking-history' as const },
                ].map(item => (
                  <button key={item.label} onClick={() => navigate(item.screen)} className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between">
                    {item.label}
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Trek badge */}
            <div className="bg-gradient-to-br from-forest to-green-500 rounded-2xl p-5 text-white">
              <div className="text-3xl mb-2">🏅</div>
              <div className="font-display text-xl mb-1">Himalayan Explorer</div>
              <div className="text-white/70 text-xs mb-3">{completed.length} trek{completed.length === 1 ? '' : 's'} completed</div>
              <div className="bg-white/20 rounded-full h-2" role="progressbar" aria-valuenow={completed.length} aria-valuemax={VETERAN_TREKS} aria-label="Progress to Veteran status">
                <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min(100, (completed.length / VETERAN_TREKS) * 100)}%` }} />
              </div>
              <div className="text-xs text-white/60 mt-1.5">{Math.max(0, VETERAN_TREKS - completed.length)} more treks to reach Veteran status</div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-base mt-0.5">{a.icon}</span>
                    <div>
                      <p className="text-xs text-slate-700 leading-snug">{a.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
