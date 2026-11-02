import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore, type Booking } from '../store'
import { formatINR, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface RevenueAnalyticsProps {
  navigate: NavigateFn
  userRole: UserRole
}

const periods = { '3M': 3, '6M': 6, '12M': 12 } as const

// Value counts bookings the operator has accepted. TrekBazaar takes no payments, so this is
// what trekkers owe the operator, not money received.
const counts = (b: Booking) => b.status === 'Confirmed' || b.status === 'Completed'

// The `size` calendar months ending at the later of this month and the latest departure.
function monthWindow(bookings: Booking[], size: number) {
  const last = bookings.reduce((max, b) => (b.date > max ? b.date : max), today()).slice(0, 7)
  const [y, m] = last.split('-').map(Number)
  return Array.from({ length: size }, (_, i) => {
    const d = new Date(y, m - 1 - (size - 1 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }
  })
}

export default function RevenueAnalytics({ navigate, userRole }: RevenueAnalyticsProps) {
  // The API scopes bookings to this operator's treks.
  const { bookings, treks, user } = useStore()
  const [period, setPeriod] = useState<keyof typeof periods>('6M')

  const months = monthWindow(bookings, periods[period]).map(m => {
    const inMonth = bookings.filter(b => b.date.startsWith(m.key))
    return {
      ...m,
      value: inMonth.filter(counts).reduce((sum, b) => sum + b.amount, 0),
      bookings: inMonth.filter(b => b.status !== 'Cancelled').length,
    }
  })
  const maxValue = Math.max(1, ...months.map(m => m.value))
  const maxBookings = Math.max(1, ...months.map(m => m.bookings))

  const accepted = bookings.filter(counts)
  const totalValue = accepted.reduce((sum, b) => sum + b.amount, 0)
  const cancelled = bookings.filter(b => b.status === 'Cancelled').length
  const kpis = [
    { label: 'Confirmed + Completed Value', value: formatINR(totalValue), icon: '💰', color: 'from-forest to-green-400' },
    { label: 'Accepted Bookings', value: String(accepted.length), icon: '📋', color: 'from-blue-500 to-blue-400' },
    { label: 'Average per Booking', value: accepted.length ? formatINR(Math.round(totalValue / accepted.length)) : '—', icon: '📊', color: 'from-purple-500 to-purple-400' },
    { label: 'Cancelled or Declined', value: bookings.length ? `${Math.round(cancelled / bookings.length * 100)}%` : '—', icon: '✖️', color: 'from-amber-500 to-amber-400' },
  ]

  const performance = treks
    .filter(t => userRole === 'admin' || t.operatorId === user?.id)
    .map(t => {
      const mine = bookings.filter(b => b.trekId === t.id)
      return {
        id: t.id,
        name: t.title,
        bookings: mine.filter(counts).length,
        value: mine.filter(counts).reduce((sum, b) => sum + b.amount, 0),
        rating: t.reviewCount > 0 ? `⭐${t.rating}` : 'No reviews',
      }
    })
    .sort((a, b) => b.value - a.value)
  const maxTrekValue = Math.max(1, ...performance.map(t => t.value))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="revenue-analytics" userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-slate-900">Booking Analytics</h1>
            <p className="text-slate-500 mt-1">Worked out from the bookings on your treks. No payments go through TrekBazaar.</p>
          </div>
          <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1">
            {(Object.keys(periods) as (keyof typeof periods)[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-forest text-white' : 'text-slate-600 hover:text-slate-900'}`}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white text-lg mb-3`}>{kpi.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
              <div className="text-sm text-slate-400 mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Value chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
            <div className="mb-6">
              <h2 className="font-semibold text-slate-900">Accepted Value by Departure Month</h2>
              <p className="text-xs text-slate-400 mt-0.5">Confirmed and completed bookings, grouped by trip date</p>
            </div>

            <div className="flex items-end gap-1 sm:gap-2 h-48">
              {months.map(d => (
                <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '168px' }}>
                    <div className="w-full bg-forest rounded-t-lg hover:bg-forest-dark transition-colors relative" style={{ height: `${(d.value / maxValue) * 100}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatINR(d.value)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-full">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trek breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Trek Performance</h2>
            {performance.length === 0 && <p className="text-sm text-slate-400">You have not published a trek yet.</p>}
            <div className="space-y-4">
              {performance.map(t => (
                <div key={t.id}>
                  <div className="text-sm font-medium text-slate-700 truncate mb-1.5">{t.name}</div>
                  <div className="bg-slate-100 rounded-full h-2 mb-1">
                    <div className="bg-forest rounded-full h-2 transition-all" style={{ width: `${(t.value / maxTrekValue) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{t.bookings} accepted · {t.rating}</span>
                    <span className="font-medium text-slate-600">{formatINR(t.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings trend */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-900 mb-6">Active Bookings by Departure Month</h2>
          <div className="flex items-end gap-1.5 sm:gap-3 h-24">
            {months.map(d => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '72px' }}>
                  <div className="w-full bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all" style={{ height: `${(d.bookings / maxBookings) * 100}%` }} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.bookings}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-full">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
