import { useState } from 'react'
import Navbar from '../components/Navbar'
import type { NavigateFn, UserRole } from '../types'

interface RevenueAnalyticsProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

// Twelve months of sample figures, oldest first, labelled relative to the current month.
const sampleRevenue = [
  [185000, 12], [220000, 15], [165000, 11], [310000, 21], [420000, 28], [380000, 25],
  [290000, 19], [340000, 22], [480000, 32], [510000, 34], [395000, 26], [285000, 18],
]
const monthlyData = sampleRevenue.map(([revenue, bookings], i) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - (sampleRevenue.length - 1 - i))
  return { month: d.toLocaleDateString('en-IN', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}`, revenue, bookings }
})

const periods = { '3M': 3, '6M': 6, '12M': 12 } as const

const trekPerformance = [
  { name: 'Roopkund Trek', bookings: 42, revenue: 609000, rating: 4.8, growth: 18 },
  { name: 'Chadar Trek', bookings: 28, revenue: 504000, rating: 4.9, growth: 12 },
  { name: 'Valley of Flowers', bookings: 35, revenue: 392000, rating: 4.9, growth: 24 },
  { name: 'Hampta Pass', bookings: 22, revenue: 215600, rating: 4.7, growth: -5 },
]

export default function RevenueAnalytics({ navigate, userRole, setUserRole }: RevenueAnalyticsProps) {
  const [period, setPeriod] = useState<keyof typeof periods>('12M')
  const visible = monthlyData.slice(-periods[period])
  const maxRevenue = Math.max(...visible.map(d => d.revenue))
  const totalRevenue = visible.reduce((sum, d) => sum + d.revenue, 0)
  const totalBookings = visible.reduce((sum, d) => sum + d.bookings, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="revenue-analytics" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Revenue Analytics</h1>
            <p className="text-slate-500 mt-1">Track your earnings, bookings, and trek performance</p>
          </div>
          <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1">
            {(Object.keys(periods) as (keyof typeof periods)[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-forest text-white' : 'text-slate-600 hover:text-slate-900'}`}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, change: '+24%', icon: '💰', color: 'from-forest to-green-400' },
            { label: 'Total Bookings', value: totalBookings, change: '+18%', icon: '📋', color: 'from-blue-500 to-blue-400' },
            { label: 'Avg. per Booking', value: `₹${Math.round(totalRevenue / totalBookings / 1000)}K`, change: '+8%', icon: '📊', color: 'from-purple-500 to-purple-400' },
            { label: 'Completion Rate', value: '94%', change: '+2%', icon: '✅', color: 'from-amber-500 to-amber-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white text-lg mb-3`}>{kpi.icon}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                <span className="text-xs font-medium text-green-600">{kpi.change}</span>
              </div>
              <div className="text-sm text-slate-400 mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-slate-900">Monthly Revenue</h2>
                <p className="text-xs text-slate-400 mt-0.5">Last {periods[period]} months · sample data</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-forest inline-block" /> Revenue</span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1 sm:gap-2 h-48">
              {visible.map(d => {
                const h = (d.revenue / maxRevenue) * 100
                return (
                  <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 group">
                    <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '168px' }}>
                      <div
                        className="w-full bg-forest rounded-t-lg hover:bg-forest-dark transition-colors relative"
                        style={{ height: `${h}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ₹{(d.revenue / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">{d.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trek breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Trek Performance</h2>
            <div className="space-y-4">
              {trekPerformance.map(t => {
                const pct = (t.revenue / Math.max(...trekPerformance.map(x => x.revenue))) * 100
                return (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700 truncate mr-2">{t.name}</span>
                      <span className={`text-xs font-semibold ${t.growth > 0 ? 'text-green-600' : 'text-red-500'}`}>{t.growth > 0 ? '+' : ''}{t.growth}%</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-2 mb-1">
                      <div className="bg-forest rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{t.bookings} bookings · ⭐{t.rating}</span>
                      <span className="font-medium text-slate-600">₹{(t.revenue / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bookings trend */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Booking Volume by Month</h2>
          <div className="flex items-end gap-1.5 sm:gap-3 h-24">
            {visible.map(d => {
              const h = (d.bookings / Math.max(...visible.map(x => x.bookings))) * 100
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '72px' }}>
                    <div className="w-full bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all" style={{ height: `${h}%` }} />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.bookings}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-full">{d.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
