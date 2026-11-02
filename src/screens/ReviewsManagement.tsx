import { useState } from 'react'
import Navbar from '../components/Navbar'
import { api, errorMessage, useApiList } from '../api'
import { useStore, type Review, type ReviewStatus } from '../store'
import { formatDate } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface ReviewsManagementProps {
  navigate: NavigateFn
  userRole: UserRole
}

const statusConfig: Record<ReviewStatus, { bg: string; text: string }> = {
  Approved: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Rejected: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

const STAR = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

// Only approved reviews are public and count toward a trek's rating.
export default function ReviewsManagement({ navigate, userRole }: ReviewsManagementProps) {
  const { notify, findTrek, reload: reloadTreks } = useStore()
  const { data: reviews, error, reload } = useApiList<Review>('/reviews')
  const [filter, setFilter] = useState<'All' | ReviewStatus>('Pending')

  const filtered = reviews.filter(r => filter === 'All' || r.status === filter)
  const approved = reviews.filter(r => r.status === 'Approved')
  const average = approved.length ? (approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1) : null

  const moderate = async (r: Review, status: 'Approved' | 'Rejected') => {
    try {
      await api.patch(`/reviews/${r.id}`, { status })
      notify(`Review by ${r.userName} ${status.toLowerCase()}`)
      reload()
      reloadTreks()
    } catch (err) {
      notify(errorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="reviews-management" userRole={userRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-slate-900">Reviews Management</h1>
          <p className="text-slate-500 mt-1">Reviews come from trekkers who completed a trek. Approved ones go public and count toward ratings.</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reviews', value: reviews.length, color: 'bg-white' },
            { label: 'Pending', value: reviews.filter(r => r.status === 'Pending').length, color: 'bg-amber-50' },
            { label: 'Rejected', value: reviews.filter(r => r.status === 'Rejected').length, color: 'bg-red-50' },
            { label: average ? `Average of ${approved.length} approved` : 'No approved reviews', value: average ? `${average} ★` : '—', color: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl border border-slate-100 p-4 text-center`}>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-400">
              {filter === 'Pending' ? 'Nothing to moderate.' : 'No reviews here.'}
            </div>
          )}
          {filtered.map(r => {
            const trek = findTrek(r.trekId)
            const sc = statusConfig[r.status]
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{r.userName}</div>
                    <div className="text-xs text-slate-400">
                      {trek?.title ?? 'Deleted trek'}{trek && ` · ${trek.operator}`} · {formatDate(r.createdAt.slice(0, 10))}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{r.status}</span>
                </div>
                <div className="flex gap-0.5 mb-2" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20"><path d={STAR} /></svg>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{r.comment}</p>
                <div className="flex gap-2 flex-wrap">
                  {r.status !== 'Approved' && (
                    <button onClick={() => moderate(r, 'Approved')} className="text-xs font-semibold text-white bg-forest hover:bg-forest-dark px-3 py-1.5 rounded-lg transition-colors">Approve</button>
                  )}
                  {r.status !== 'Rejected' && (
                    <button onClick={() => moderate(r, 'Rejected')} className="text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Reject</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
