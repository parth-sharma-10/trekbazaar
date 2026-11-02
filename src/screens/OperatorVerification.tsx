import { useState } from 'react'
import Navbar from '../components/Navbar'
import { api, errorMessage, useApiList } from '../api'
import { useStore, type User } from '../store'
import { formatDate } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface OperatorVerificationProps {
  navigate: NavigateFn
  userRole: UserRole
}

// Verification is the `verified` flag on an operator account: until it is set, the API refuses
// to let that operator publish treks. Admins check the details below before approving.
export default function OperatorVerification({ navigate, userRole }: OperatorVerificationProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending')
  const { notify, treks } = useStore()
  const { data: users, error, reload } = useApiList<User>('/users')
  const operators = users.filter(u => u.role === 'operator')
  const pending = operators.filter(u => !u.verified)
  const verified = operators.filter(u => u.verified)
  const shown = activeTab === 'pending' ? pending : verified

  const setVerified = async (op: User, value: boolean) => {
    try {
      await api.put(`/users/${op.id}`, { verified: value })
      notify(value ? `${op.name} verified. They can publish treks now.` : `Verification revoked for ${op.name}`)
      reload()
    } catch (err) {
      notify(errorMessage(err))
    }
  }

  const tabs = [
    { id: 'pending' as const, label: 'Awaiting Verification', count: pending.length },
    { id: 'verified' as const, label: 'Verified', count: verified.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="operator-verification" userRole={userRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-slate-900">Operator Verification</h1>
          <p className="text-slate-500 mt-1">Operators can publish treks only after you verify their account.</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

        <div className="flex gap-2 mb-6 flex-wrap" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {shown.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-400">
              {activeTab === 'pending' ? 'No operator accounts are waiting for verification.' : 'No operators are verified yet.'}
            </div>
          )}
          {shown.map(op => {
            const listed = treks.filter(t => t.operatorId === op.id).length
            return (
              <div key={op.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center text-white font-bold">{op.name[0]}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{op.name}</h3>
                      <p className="text-xs text-slate-400">Joined {op.createdAt ? formatDate(op.createdAt.slice(0, 10)) : '—'}{op.suspended && ' · suspended'}</p>
                    </div>
                  </div>
                  {activeTab === 'pending' ? (
                    <button onClick={() => setVerified(op, true)} className="bg-forest hover:bg-forest-dark text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Verify</button>
                  ) : (
                    <button onClick={() => setVerified(op, false)} className="border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-xl transition-colors">Revoke</button>
                  )}
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                  {[
                    ['Email', op.email],
                    ['Phone', op.phone],
                    ['City', op.city],
                    ['Treks listed', String(listed)],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-xl px-3 py-2 min-w-0">
                      <dt className="text-xs text-slate-400">{label}</dt>
                      <dd className="text-slate-800 truncate">{value || 'Not given'}</dd>
                    </div>
                  ))}
                </dl>
                {op.bio && <p className="mt-3 text-sm text-slate-600">{op.bio}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
