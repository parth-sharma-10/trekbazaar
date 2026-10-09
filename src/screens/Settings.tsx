import { useState } from 'react'
import Navbar from '../components/Navbar'
import { useCurrentUser, useStore } from '../store'
import { initials, isEmail } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface SettingsProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

export default function Settings({ navigate, userRole, setUserRole }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const { updateUser, notify, resetDemo, darkMode, toggleDarkMode } = useStore()
  const user = useCurrentUser()
  const [profile, setProfile] = useState(user)
  const [photo, setPhoto] = useState<string | null>(null)
  const [notifications, setNotifications] = useState({ bookingUpdates: true, newsletter: false, offers: true, reminders: true })
  const [twoFactor, setTwoFactor] = useState(true)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [regions, setRegions] = useState(['Uttarakhand', 'Himachal Pradesh'])
  const [saved, setSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSave = () => {
    if (!profile.name.trim()) return notify('Name cannot be empty')
    if (!isEmail(profile.email)) return notify('Enter a valid email address')
    updateUser({ ...profile, name: profile.name.trim(), email: profile.email.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwords.current) return setPasswordError('Enter your current password')
    if (passwords.next.length < 8) return setPasswordError('New password must be at least 8 characters')
    if (passwords.next !== passwords.confirm) return setPasswordError('New passwords do not match')
    setPasswordError('')
    setPasswords({ current: '', next: '', confirm: '' })
    notify('Password updated (demo)')
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="settings" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display text-3xl text-slate-900 mb-6">Settings & Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="flex md:flex-col gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`shrink-0 md:w-full text-left whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-forest text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-900 text-lg">Your Profile</h2>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden shrink-0">
                    {photo ? <img src={photo} alt="Profile preview" className="w-full h-full object-cover" /> : initials(profile.name)}
                  </div>
                  <div>
                    <label className="inline-block cursor-pointer text-sm font-medium text-forest hover:text-forest-dark border border-forest rounded-xl px-4 py-2 transition-colors focus-within:ring-2 focus-within:ring-forest">
                      Change Photo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        className="sr-only"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 2 * 1024 * 1024) return notify('Photo must be 2MB or smaller')
                          setPhoto(URL.createObjectURL(file))
                        }}
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input id="profile-name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest" />
                  </div>
                  <div>
                    <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input id="profile-email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest" />
                  </div>
                  <div>
                    <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                    <input id="profile-phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest" />
                  </div>
                  <div>
                    <label htmlFor="profile-city" className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                    <input id="profile-city" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest" />
                  </div>
                </div>
                <div>
                  <label htmlFor="profile-bio" className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                  <textarea id="profile-bio" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest resize-none" />
                </div>
                <button onClick={handleSave} className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-forest hover:bg-forest-dark text-white'}`}>
                  {saved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-900 text-lg">Password & Security</h2>
                <form onSubmit={updatePassword} className="space-y-4" noValidate>
                  {([
                    ['current', 'Current Password', 'current-password'],
                    ['next', 'New Password', 'new-password'],
                    ['confirm', 'Confirm New Password', 'new-password'],
                  ] as const).map(([key, label, autoComplete]) => (
                    <div key={key}>
                      <label htmlFor={`pw-${key}`} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                      <input
                        id={`pw-${key}`}
                        type="password"
                        autoComplete={autoComplete}
                        value={passwords[key]}
                        onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest"
                      />
                    </div>
                  ))}
                  {passwordError && <p className="text-sm text-red-600" role="alert">{passwordError}</p>}
                  <button type="submit" className="bg-forest hover:bg-forest-dark text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">Update Password</button>
                </form>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">SMS Authentication</p>
                      <p className="text-xs text-slate-400">Receive codes via SMS to {user.phone || 'your phone'}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={twoFactor}
                      aria-label="SMS authentication"
                      onClick={() => setTwoFactor(v => !v)}
                      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${twoFactor ? 'bg-forest' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-900 text-lg">Notification Preferences</h2>
                <div className="space-y-3">
                  {[
                    { key: 'bookingUpdates', label: 'Booking Updates', desc: 'Confirmations, cancellations, reminders' },
                    { key: 'reminders', label: 'Trek Reminders', desc: 'Packing lists and departure reminders' },
                    { key: 'offers', label: 'Deals & Offers', desc: 'Discounts and limited-time trek offers' },
                    { key: 'newsletter', label: 'Newsletter', desc: 'Monthly trek inspiration and tips' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
                        role="switch"
                        aria-checked={notifications[item.key as keyof typeof notifications]}
                        aria-label={item.label}
                        className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${notifications[item.key as keyof typeof notifications] ? 'bg-forest' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-5">
                <h2 className="font-semibold text-slate-900 text-lg">Trek Preferences</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pref-difficulty" className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Difficulty</label>
                    <select id="pref-difficulty" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest text-slate-700">
                      <option>Moderate</option>
                      <option>Easy</option>
                      <option>Difficult</option>
                      <option>Expert</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pref-duration" className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Duration</label>
                    <select id="pref-duration" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest text-slate-700">
                      <option>4–6 Days</option>
                      <option>1–3 Days</option>
                      <option>7–10 Days</option>
                      <option>10+ Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Favorite Regions</label>
                  <div className="flex flex-wrap gap-2">
                    {['Uttarakhand', 'Himachal Pradesh', 'Ladakh', 'West Bengal', 'Nagaland', 'Sikkim'].map(r => (
                      <button
                        key={r}
                        aria-pressed={regions.includes(r)}
                        onClick={() => setRegions(rs => rs.includes(r) ? rs.filter(x => x !== r) : [...rs, r])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${regions.includes(r) ? 'border-forest bg-forest text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-forest-100'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => notify('Preferences saved')} className="bg-forest hover:bg-forest-dark text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">Save Preferences</button>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-semibold text-slate-900 mb-1">Appearance</h3>
                  <p className="text-xs text-slate-400 mb-3">Customize how TrekBazaar looks on your screen.</p>
                  <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-xl p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Dark Mode</p>
                      <p className="text-xs text-slate-400">Switch to a sleek dark interface that reduces eye strain</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      role="switch"
                      aria-checked={darkMode}
                      aria-label="Dark Mode toggle"
                      className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${darkMode ? 'bg-forest' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-semibold text-slate-900 mb-1">Demo data</h3>
                  <p className="text-xs text-slate-400 mb-3">Bookings, wishlist and published treks are stored in this browser. Reset to start over.</p>
                  {confirmReset ? (
                    <div className="flex gap-2">
                      <button onClick={() => { resetDemo(); setConfirmReset(false); navigate('landing') }} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">Yes, reset everything</button>
                      <button onClick={() => setConfirmReset(false)} className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">Keep my data</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmReset(true)} className="border border-red-200 text-red-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">Reset demo data</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
