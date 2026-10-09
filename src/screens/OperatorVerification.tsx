import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import { formatDate, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface OperatorVerificationProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const initialPending = [
  { id: 'OP001', name: 'Summit Seekers', contact: 'Rahul Tiwari', email: 'rahul@summitseekers.com', phone: '+91 98001 23456', location: 'Dehradun, Uttarakhand', treks: 3, submitted: '2 days ago', exp: '8 years', docs: ['GST Certificate', 'Trekking License', 'Insurance Policy'], certified: true },
  { id: 'OP002', name: 'Northeast Trails', contact: 'Amar Bordoloi', email: 'amar@netrails.com', phone: '+91 87001 34567', location: 'Guwahati, Assam', treks: 2, submitted: '5 days ago', exp: '5 years', docs: ['GST Certificate', 'Trekking License'], certified: false },
  { id: 'OP003', name: 'Bengal Himalaya Co.', contact: 'Sudipta Roy', email: 'sudipta@bengalhimalaya.com', phone: '+91 76001 45678', location: 'Siliguri, West Bengal', treks: 4, submitted: '1 week ago', exp: '12 years', docs: ['GST Certificate', 'Trekking License', 'Insurance Policy', 'YMCA Cert'], certified: true },
]

const initialApproved = [
  { id: 'OP100', name: 'Himalayan Treks Co.', contact: 'Deepak Negi', approvedDate: 'Jan 15, 2024', treks: 5, rating: 4.8 },
  { id: 'OP101', name: 'Mountain Spirit', contact: 'Anjali Thakur', approvedDate: 'Mar 8, 2024', treks: 3, rating: 4.7 },
]

export default function OperatorVerification({ navigate, userRole, setUserRole }: OperatorVerificationProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const { notify } = useStore()
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [rejected, setRejected] = useState([
    { id: 'OP090', name: 'Trail Blazers Co.', contact: 'contact@trailblazers.in', date: 'Feb 28, 2026', reason: 'Incomplete documentation — missing GST certificate' },
  ])

  const approve = (id: string) => {
    const op = pending.find(o => o.id === id)!
    setPending(p => p.filter(o => o.id !== id))
    setApproved(a => [{ id: op.id, name: op.name, contact: op.contact, approvedDate: formatDate(today()), treks: op.treks, rating: 0 }, ...a])
    notify(`${op.name} approved and notified`)
  }

  const reject = (id: string, name: string, contact: string, reason: string) => {
    setPending(p => p.filter(o => o.id !== id))
    setApproved(a => a.filter(o => o.id !== id))
    setRejected(r => [{ id, name, contact, date: formatDate(today()), reason }, ...r])
    notify(`${name} moved to Rejected`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="operator-verification" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-slate-900">Operator Verification</h1>
          <p className="text-slate-500 mt-1">Review and verify trek operator applications</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'pending', label: 'Pending Review', count: pending.length },
            { id: 'approved', label: 'Approved', count: approved.length },
            { id: 'rejected', label: 'Rejected', count: rejected.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t.label}
              <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pending.map(op => (
              <div key={op.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-forest to-green-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">{op.name[0]}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{op.name}</h3>
                        {op.certified && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                            Certified Guide
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{op.contact} · {op.email}</p>
                      <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 flex-wrap">
                        <span>📍 {op.location}</span>
                        <span>⏱️ {op.exp} experience</span>
                        <span>🏔️ {op.treks} treks</span>
                        <span>📅 Submitted {op.submitted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setExpanded(expanded === op.id ? null : op.id)} className="text-sm font-medium text-forest border border-forest rounded-xl px-4 py-2 hover:bg-forest-50 transition-colors">
                      {expanded === op.id ? 'Hide Details' : 'Review'}
                    </button>
                    <button onClick={() => approve(op.id)} className="text-sm font-medium bg-forest text-white rounded-xl px-4 py-2 hover:bg-forest-dark transition-colors">Approve</button>
                    <button onClick={() => reject(op.id, op.name, op.email, 'Did not meet verification requirements')} className="text-sm font-medium border border-red-200 text-red-500 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors">Reject</button>
                  </div>
                </div>

                {expanded === op.id && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Documents Submitted</h4>
                        <ul className="space-y-1.5">
                          {op.docs.map(doc => (
                            <li key={doc} className="flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                              <span className="text-slate-700">{doc}</span>
                              <button onClick={() => notify(`${doc} preview is not part of this demo.`)} className="text-xs text-forest hover:underline">View</button>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Treks Proposed</h4>
                        <p className="text-sm text-slate-500">They've proposed {op.treks} trek routes in their application. View listing for details.</p>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Notes</label>
                          <textarea rows={2} placeholder="Add internal notes about this application..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest resize-none placeholder-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'approved' && (
          <div className="space-y-3">
            {approved.map(op => (
              <div key={op.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-forest to-green-400 rounded-xl flex items-center justify-center text-white font-bold">{op.name[0]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{op.name}</span>
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                    </div>
                    <div className="text-xs text-slate-400">{op.contact} · Approved {op.approvedDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">{op.treks} treks{op.rating > 0 ? ` · ⭐${op.rating}` : ''}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Verified</span>
                  <button onClick={() => reject(op.id, op.name, op.contact, 'Verification revoked by admin')} className="text-sm text-red-500 hover:text-red-700 font-medium">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="space-y-3">
            {rejected.map(op => (
              <div key={op.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold shrink-0">{op.name[0]}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900">{op.name}</div>
                    <div className="text-xs text-slate-400">{op.contact} · Rejected: {op.date}</div>
                    <div className="text-xs text-red-600 mt-1">Reason: {op.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pending' && pending.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">No applications waiting for review.</div>
        )}
      </div>
    </div>
  )
}
