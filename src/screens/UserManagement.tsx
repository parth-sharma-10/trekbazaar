import { useState } from 'react'
import Navbar from '../components/Navbar'
import { api, errorMessage, useApiList } from '../api'
import { useStore, type User } from '../store'
import { formatDate, formatINR } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface UserManagementProps {
  navigate: NavigateFn
  userRole: UserRole
}

type Status = 'Active' | 'Suspended' | 'Unverified'

const statusConfig: Record<Status, { bg: string; text: string }> = {
  Active: { bg: 'bg-green-100', text: 'text-green-700' },
  Suspended: { bg: 'bg-red-100', text: 'text-red-700' },
  Unverified: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

const statusOf = (u: User): Status =>
  u.suspended ? 'Suspended' : u.role === 'operator' && !u.verified ? 'Unverified' : 'Active'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default function UserManagement({ navigate, userRole }: UserManagementProps) {
  const { notify, user: me, bookings, treks } = useStore()
  const { data: users, error, reload } = useApiList<User>('/users')
  const [roleFilter, setRoleFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter.toLowerCase()) return false
    if (statusFilter !== 'All' && statusOf(u) !== statusFilter) return false
    const q = search.toLowerCase()
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  // Every change goes to the API; the list is then reloaded so the table shows what was stored.
  const update = async (u: User, patch: Partial<User>, message: string) => {
    try {
      await api.put(`/users/${u.id}`, patch)
      notify(message)
      reload()
    } catch (err) {
      notify(errorMessage(err))
    }
  }

  const remove = async (u: User) => {
    setConfirmingDelete(null)
    try {
      await api.delete(`/users/${u.id}`)
      notify(`${u.name} deleted`)
      reload()
    } catch (err) {
      notify(errorMessage(err))
    }
  }

  const activity = (u: User) => {
    if (u.role === 'operator') {
      const listed = treks.filter(t => t.operatorId === u.id).length
      return `${listed} trek${listed === 1 ? '' : 's'} listed`
    }
    if (u.role === 'admin') return '—'
    const theirs = bookings.filter(b => b.email === u.email)
    const value = theirs.filter(b => b.status === 'Confirmed' || b.status === 'Completed').reduce((sum, b) => sum + b.amount, 0)
    return `${theirs.length} booking${theirs.length === 1 ? '' : 's'} · ${formatINR(value)}`
  }

  const stats = [
    { label: 'Accounts', value: users.length, color: 'bg-slate-50' },
    { label: 'Operators', value: users.filter(u => u.role === 'operator').length, color: 'bg-blue-50' },
    { label: 'Suspended', value: users.filter(u => u.suspended).length, color: 'bg-red-50' },
    { label: 'Joined in the last 7 days', value: users.filter(u => u.createdAt && Date.now() - Date.parse(u.createdAt) < WEEK_MS).length, color: 'bg-green-50' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="user-management" userRole={userRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Every account in the database. Suspended accounts cannot sign in.</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl border border-slate-100 p-4 text-center`}>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." aria-label="Search users" className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest bg-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'User', 'Operator', 'Admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} aria-pressed={roleFilter === r} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${roleFilter === r ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{r}</button>
            ))}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-forest">
              <option value="All">All Status</option>
              <option>Active</option>
              <option>Unverified</option>
              <option>Suspended</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Activity</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const status = statusOf(u)
                  const sc = statusConfig[status]
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm whitespace-nowrap">{u.name}{isMe && ' (you)'}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isMe || u.role === 'admin' ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">{u.role}</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={e => update(u, { role: e.target.value as UserRole }, `${u.name} is now ${e.target.value === 'operator' ? 'an operator' : 'a trekker'}`)}
                            aria-label={`Role of ${u.name}`}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                          >
                            <option value="user">Trekker</option>
                            <option value="operator">Operator</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{u.createdAt ? formatDate(u.createdAt.slice(0, 10)) : '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{activity(u)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {isMe ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : confirmingDelete === u.id ? (
                          <span className="flex gap-2 whitespace-nowrap">
                            <button onClick={() => remove(u)} className="text-xs font-semibold text-red-600 hover:text-red-700">Confirm delete</button>
                            <button onClick={() => setConfirmingDelete(null)} className="text-xs font-medium text-slate-500">Keep</button>
                          </span>
                        ) : (
                          <span className="flex gap-3 whitespace-nowrap">
                            <button
                              onClick={() => update(u, { suspended: !u.suspended }, u.suspended ? `${u.name} reinstated` : `${u.name} suspended`)}
                              className={`text-xs font-medium ${u.suspended ? 'text-green-600 hover:text-green-700' : 'text-slate-500 hover:text-red-600'}`}
                            >
                              {u.suspended ? 'Reinstate' : 'Suspend'}
                            </button>
                            <button onClick={() => setConfirmingDelete(u.id!)} className="text-xs font-medium text-slate-500 hover:text-red-600">Delete</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">No accounts match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
