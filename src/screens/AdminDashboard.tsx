import Navbar from '../components/Navbar'
import { useState } from 'react'
import { useStore } from '../store'
import type { NavigateFn, UserRole } from '../types'

interface AdminDashboardProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const alerts = [
  { type: 'warning', message: '3 operator applications pending review', action: 'Review Now', screen: 'operator-verification' as const },
  { type: 'info', message: '12 new reviews submitted this week', action: 'Moderate', screen: 'reviews-management' as const },
  { type: 'success', message: 'Platform revenue up 24% vs last month', action: null, screen: null },
  { type: 'warning', message: '2 user accounts flagged for suspicious activity', action: 'Investigate', screen: 'user-management' as const },
]

const recentUsers = [
  { name: 'Sneha Patel', email: 'sneha@example.com', role: 'User', joined: '2h ago', treks: 0 },
  { name: 'Vikram Singh', email: 'vikram@example.com', role: 'Operator', joined: '5h ago', treks: 3 },
  { name: 'Riya Nair', email: 'riya@example.com', role: 'User', joined: '1d ago', treks: 2 },
  { name: 'Suresh Kumar', email: 'suresh@example.com', role: 'User', joined: '2d ago', treks: 0 },
]

export default function AdminDashboard({ navigate, userRole, setUserRole }: AdminDashboardProps) {
  const { notify } = useStore()
  const [suspended, setSuspended] = useState<string[]>([])
  const toggleSuspend = (email: string, name: string) => {
    const isSuspended = suspended.includes(email)
    setSuspended(s => isSuspended ? s.filter(x => x !== email) : [...s, email])
    notify(isSuspended ? `${name} reinstated` : `${name} suspended`)
  }
  const platformStats = [
    { label: 'Total Users', value: '52,341', change: '+847 this week', icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Operators', value: '148', change: '+3 pending', icon: '🏕️', color: 'bg-forest-50 text-forest' },
    { label: 'Total Treks', value: '1,284', change: '+12 this month', icon: '🏔️', color: 'bg-amber-50 text-amber-600' },
    { label: 'Platform Revenue', value: '₹4.2Cr', change: '+24% vs last month', icon: '💰', color: 'bg-purple-50 text-purple-600' },
    { label: 'Bookings This Month', value: '2,847', change: '+18%', icon: '📋', color: 'bg-green-50 text-green-600' },
    { label: 'Reviews This Week', value: '312', change: '4.7★ avg', icon: '⭐', color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="admin-dashboard" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform-wide overview and management. {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        </div>

        {/* Alerts */}
        <div className="space-y-2 mb-8">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3.5 rounded-xl border ${a.type === 'warning' ? 'bg-amber-50 border-amber-100' : a.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex items-center gap-3">
                <span>{a.type === 'warning' ? '⚠️' : a.type === 'success' ? '✅' : 'ℹ️'}</span>
                <span className={`text-sm font-medium ${a.type === 'warning' ? 'text-amber-800' : a.type === 'success' ? 'text-green-800' : 'text-blue-800'}`}>{a.message}</span>
              </div>
              {a.action && a.screen && (
                <button onClick={() => navigate(a.screen!)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ${a.type === 'warning' ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} transition-colors`}>
                  {a.action}
                </button>
              )}
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
              <div className="text-xs text-green-600 font-medium">{s.change}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent users */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">New Users</h2>
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
                  {recentUsers.map(u => (
                    <tr key={u.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
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
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${suspended.includes(u.email) ? 'bg-red-100 text-red-700' : u.role === 'Operator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{suspended.includes(u.email) ? 'Suspended' : u.role}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{u.joined}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => navigate('user-management')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="View profile" aria-label={`View ${u.name}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => toggleSuspend(u.email, u.name)} className={`p-1.5 hover:bg-red-50 rounded-lg transition-colors ${suspended.includes(u.email) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} title={suspended.includes(u.email) ? 'Reinstate' : 'Suspend'} aria-label={`${suspended.includes(u.email) ? 'Reinstate' : 'Suspend'} ${u.name}`} aria-pressed={suspended.includes(u.email)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        </div>
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
              { label: 'User Management', icon: '👥', screen: 'user-management' as const, desc: '52,341 users' },
              { label: 'Operator Verification', icon: '✅', screen: 'operator-verification' as const, desc: '3 pending review' },
              { label: 'Reviews Management', icon: '⭐', screen: 'reviews-management' as const, desc: '12 to moderate' },
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

            {/* Revenue summary */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <div className="text-xs text-white/60 uppercase tracking-wide mb-2">Platform Revenue</div>
              <div className="font-display text-3xl mb-1">₹4.2 Cr</div>
              <div className="text-xs text-white/60">Last 12 months · Up 24% YoY</div>
              <div className="mt-4 flex gap-2">
                <div className="flex-1 bg-white/10 rounded-lg p-2.5">
                  <div className="text-xs text-white/60">Commission</div>
                  <div className="font-bold text-sm">₹42L (10%)</div>
                </div>
                <div className="flex-1 bg-white/10 rounded-lg p-2.5">
                  <div className="text-xs text-white/60">Payouts</div>
                  <div className="font-bold text-sm">₹3.78 Cr</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
