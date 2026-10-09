import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useStore } from '../store'
import type { NavigateFn, UserRole } from '../types'

interface UserManagementProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const initialUsers = [
  { id: 'U001', name: 'Rahul Kumar', email: 'rahul@example.com', role: 'User', joined: 'Jan 2023', status: 'Active', treks: 7, spent: 85000 },
  { id: 'U002', name: 'Priya Sharma', email: 'priya@example.com', role: 'User', joined: 'Mar 2023', status: 'Active', treks: 4, spent: 46000 },
  { id: 'U003', name: 'Himalayan Treks Co.', email: 'op@himalayan.com', role: 'Operator', joined: 'Jun 2022', status: 'Verified', treks: 5, spent: 0 },
  { id: 'U004', name: 'Arjun Mehta', email: 'arjun@example.com', role: 'User', joined: 'May 2024', status: 'Active', treks: 2, spent: 21000 },
  { id: 'U005', name: 'Mountain Spirit', email: 'ops@mountainspirit.com', role: 'Operator', joined: 'Aug 2022', status: 'Verified', treks: 3, spent: 0 },
  { id: 'U006', name: 'Kavya Nair', email: 'kavya@example.com', role: 'User', joined: 'Sep 2024', status: 'Active', treks: 1, spent: 11200 },
  { id: 'U007', name: 'Dev Arora', email: 'dev@example.com', role: 'User', joined: 'Oct 2024', status: 'Suspended', treks: 0, spent: 0 },
  { id: 'U008', name: 'Northeast Trails', email: 'info@netrails.com', role: 'Operator', joined: 'Feb 2025', status: 'Pending', treks: 2, spent: 0 },
]

const statusConfig: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'bg-green-100', text: 'text-green-700' },
  Verified: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Suspended: { bg: 'bg-red-100', text: 'text-red-700' },
  Pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
}

export default function UserManagement({ navigate, userRole, setUserRole }: UserManagementProps) {
  const { notify } = useStore()
  const [users, setUsers] = useState(initialUsers)
  const [roleFilter, setRoleFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = users.filter(u => {
    if (roleFilter !== 'All' && u.role !== roleFilter) return false
    if (statusFilter !== 'All' && u.status !== statusFilter) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleSuspend = (id: string) => {
    const target = users.find(u => u.id === id)!
    const next = target.status === 'Suspended' ? (target.role === 'Operator' ? 'Verified' : 'Active') : 'Suspended'
    setUsers(us => us.map(u => (u.id === id ? { ...u, status: next } : u)))
    notify(next === 'Suspended' ? `${target.name} suspended` : `${target.name} reinstated`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="user-management" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage all registered users and operator accounts</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users', value: '52,341', color: 'bg-slate-50' },
            { label: 'Operators', value: '148', color: 'bg-blue-50' },
            { label: 'Suspended', value: '23', color: 'bg-red-50' },
            { label: 'New This Week', value: '847', color: 'bg-green-50' },
          ].map(s => (
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
            {['All', 'User', 'Operator'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} aria-pressed={roleFilter === r} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${roleFilter === r ? 'bg-forest text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{r}</button>
            ))}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-forest">
              <option value="All">All Status</option>
              <option>Active</option>
              <option>Verified</option>
              <option>Suspended</option>
              <option>Pending</option>
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
                  const sc = statusConfig[u.status]
                  return (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div>
                          <div>
                            <div className="font-medium text-slate-900 text-sm whitespace-nowrap">{u.name}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.role === 'Operator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{u.joined}</td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {u.role === 'User' ? `${u.treks} treks · ₹${(u.spent / 1000).toFixed(0)}K` : `${u.treks} treks listed`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{u.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => notify(`${u.name} · ${u.email} · joined ${u.joined}`)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="View" aria-label={`View ${u.name}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button onClick={() => notify('Editing user accounts is not part of this demo.')} className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-amber-500 transition-colors" title="Edit" aria-label={`Edit ${u.name}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => toggleSuspend(u.id)} className={`p-1.5 hover:bg-red-50 rounded-lg transition-colors ${u.status === 'Suspended' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} title={u.status === 'Suspended' ? 'Reinstate' : 'Suspend'} aria-label={`${u.status === 'Suspended' ? 'Reinstate' : 'Suspend'} ${u.name}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
