import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import type { NavigateFn, UserRole } from '../types'

interface ReviewsManagementProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const allReviews = [
  { id: 'R001', user: 'Rahul Kumar', trek: 'Roopkund Trek', operator: 'Himalayan Treks Co.', rating: 5, text: 'An absolutely incredible experience. The views were beyond words.', date: 'Oct 15, 2024', status: 'Approved' },
  { id: 'R002', user: 'Priya Sharma', trek: 'Valley of Flowers', operator: 'Wildflower Expeditions', rating: 5, text: 'The valley was stunning, operator extremely professional.', date: 'Sep 22, 2024', status: 'Approved' },
  { id: 'R003', user: 'Arjun Mehta', trek: 'Chadar Trek', operator: 'Ladakh Adventures', rating: 1, text: 'Terrible experience. Guide was unprepared and equipment was substandard. DO NOT BOOK!!!!', date: 'Feb 5, 2025', status: 'Pending' },
  { id: 'R004', user: 'Kavya Nair', trek: 'Kedarkantha Trek', operator: 'Summit Seekers', rating: 4, text: 'Great trek for beginners. Snow was perfect. The meals could have been better.', date: 'Jan 20, 2025', status: 'Pending' },
  { id: 'R005', user: 'Dev Arora', trek: 'Hampta Pass', operator: 'Mountain Spirit', rating: 2, text: 'The operator cancelled our batch last minute with no refund explanation. Very unprofessional.', date: 'Aug 30, 2024', status: 'Flagged' },
  { id: 'R006', user: 'Sneha Patel', trek: 'Triund Trek', operator: 'Mountain Spirit', rating: 5, text: 'Perfect weekend trek! The campsite views at night were magical.', date: 'Nov 8, 2024', status: 'Approved' },
]

const statusConfig: Record<string, { bg: string; text: string }> = {
  Approved: { bg: 'bg-green-100', text: 'text-green-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Flagged: { bg: 'bg-red-100', text: 'text-red-700' },
  Rejected: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

export default function ReviewsManagement({ navigate, userRole, setUserRole }: ReviewsManagementProps) {
  const { notify } = useStore()
  const [filter, setFilter] = useState('All')
  const [reviews, setReviews] = useState(allReviews)

  const filtered = reviews.filter(r => filter === 'All' || r.status === filter)

  const approve = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r))
  const reject = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r))
  const flag = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Flagged' } : r))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="reviews-management" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-slate-900">Reviews Management</h1>
          <p className="text-slate-500 mt-1">Moderate and manage all trek reviews on the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Reviews', value: reviews.length, color: 'bg-white' },
            { label: 'Pending', value: reviews.filter(r => r.status === 'Pending').length, color: 'bg-amber-50' },
            { label: 'Flagged', value: reviews.filter(r => r.status === 'Flagged').length, color: 'bg-red-50' },
            { label: 'Platform Avg', value: '4.7 ★', color: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl border border-slate-100 p-4 text-center`}>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {['All', 'Pending', 'Approved', 'Flagged', 'Rejected'].map(s => (
            <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(r => {
            const sc = statusConfig[r.status]
            const isSuspicious = r.rating <= 2 || r.text.includes('DO NOT') || r.text.includes('unprofessional')
            return (
              <div key={r.id} className={`bg-white rounded-2xl border overflow-hidden ${r.status === 'Flagged' ? 'border-red-200' : 'border-slate-100'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-slate-400 to-slate-300 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{r.user[0]}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{r.user}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{r.trek}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{r.operator}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{r.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSuspicious && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                          ⚠️ Review needed
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{r.status}</span>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-4 ${isSuspicious ? 'text-red-700' : 'text-slate-600'}`}>
                    {isSuspicious ? <span className="bg-red-50 rounded p-1">"{r.text}"</span> : `"${r.text}"`}
                  </p>

                  {(r.status === 'Pending' || r.status === 'Flagged') && (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => approve(r.id)} className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Approve
                      </button>
                      {r.status !== 'Flagged' && (
                        <button onClick={() => flag(r.id)} className="flex items-center gap-1.5 text-xs font-semibold bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg transition-colors">
                          ⚑ Flag
                        </button>
                      )}
                      <button onClick={() => reject(r.id)} className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Reject
                      </button>
                      <button onClick={() => notify(`Message to ${r.user} is not part of this demo.`)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Contact User</button>
                    </div>
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
