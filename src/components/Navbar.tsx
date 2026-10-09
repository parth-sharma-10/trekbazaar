import { useEffect, useState } from 'react'
import type { NavigateFn, Screen, UserRole } from '../types'
import { useStore } from '../store'
import { initials } from '../lib'

interface NavbarProps {
  navigate: NavigateFn
  currentScreen: Screen
  userRole: UserRole
  setUserRole: (role: UserRole) => void
}

const userNav = [
  { label: 'Explore', screen: 'explore' as Screen },
  { label: 'Dashboard', screen: 'user-dashboard' as Screen },
  { label: 'My Bookings', screen: 'booking-history' as Screen },
  { label: 'Wishlist', screen: 'wishlist' as Screen },
]

const operatorNav = [
  { label: 'Dashboard', screen: 'operator-dashboard' as Screen },
  { label: 'Add Trek', screen: 'add-trek' as Screen },
  { label: 'Bookings', screen: 'booking-management' as Screen },
  { label: 'Analytics', screen: 'revenue-analytics' as Screen },
]

const adminNav = [
  { label: 'Overview', screen: 'admin-dashboard' as Screen },
  { label: 'Users', screen: 'user-management' as Screen },
  { label: 'Operators', screen: 'operator-verification' as Screen },
  { label: 'Reviews', screen: 'reviews-management' as Screen },
]

export default function Navbar({ navigate, currentScreen, userRole, setUserRole }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isPublicScreen = ['landing', 'explore', 'trek-details', 'login', 'signup'].includes(currentScreen)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    if (!profileOpen && !mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setProfileOpen(false); setMobileOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [profileOpen, mobileOpen])
  const { user, logout, darkMode, toggleDarkMode } = useStore()
  const displayName = userRole === 'admin' ? 'Admin' : userRole === 'operator' ? 'Himalayan Treks Co.' : user?.name ?? 'Rahul Kumar'
  const showAuthButtons = isPublicScreen && !user

  const navItems = userRole === 'operator' ? operatorNav : userRole === 'admin' ? adminNav : userNav

  const roleColor = userRole === 'admin' ? 'bg-purple-600' : userRole === 'operator' ? 'bg-blue-600' : 'bg-forest'

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => navigate('landing')} className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-forest rounded-xl flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Trek<span className="text-forest">Bazaar</span></span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {isPublicScreen ? (
              <>
                <button onClick={() => navigate('explore')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'explore' ? 'bg-forest-50 text-forest' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Explore Treks</button>
                <button onClick={() => navigate('landing', { section: 'destinations' })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">Destinations</button>
                <button onClick={() => navigate('signup', { role: 'operator' })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors">For Operators</button>
              </>
            ) : (
              navItems.map(item => (
                <button
                  key={item.screen}
                  onClick={() => navigate(item.screen)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === item.screen ? 'bg-forest-50 text-forest' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Role switcher demo */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-xs" role="group" aria-label="Demo: view as role">
              <span className="hidden lg:inline px-1.5 text-slate-400 font-medium">View as</span>
              {(['user', 'operator', 'admin'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setUserRole(role)
                    navigate(role === 'operator' ? 'operator-dashboard' : role === 'admin' ? 'admin-dashboard' : 'user-dashboard')
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${userRole === role ? `${roleColor} text-white` : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {showAuthButtons ? (
              <>
                <button onClick={() => navigate('login')} className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</button>
                <button onClick={() => navigate('signup')} className="text-sm font-semibold bg-forest hover:bg-forest-dark text-white px-4 py-2 rounded-full transition-colors">Sign up</button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                  className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {initials(displayName)}
                  </div>
                  <span className="hidden xl:block text-sm font-medium text-slate-700 max-w-32 truncate">{displayName}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {profileOpen && <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />}
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                    <div className="px-4 py-2 text-xs text-slate-400 truncate">{user ? user.email : 'Demo session'}</div>
                    <button onClick={() => { navigate(userRole === 'operator' ? 'operator-dashboard' : userRole === 'admin' ? 'admin-dashboard' : 'user-dashboard'); setProfileOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Dashboard</button>
                    <button onClick={() => { navigate('settings'); setProfileOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Profile & Settings</button>
                    <button onClick={() => { navigate('wishlist'); setProfileOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">Wishlist</button>
                    <div className="border-t border-slate-100 my-1" />
                    <button onClick={() => { logout(); navigate('landing'); setProfileOpen(false) }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">Log out</button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 pt-3">
            <div className="flex flex-col gap-1">
              {(isPublicScreen ? [{ label: 'Explore Treks', screen: 'explore' as Screen }, ...(user ? [] : [{ label: 'Log in', screen: 'login' as Screen }])] : navItems).map(item => (
                <button
                  key={item.screen}
                  onClick={() => { navigate(item.screen); setMobileOpen(false) }}
                  className="text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3 px-4">View as</div>
              <div className="flex gap-2 mt-1.5 px-4">
                {(['user', 'operator', 'admin'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRole(role)
                      navigate(role === 'operator' ? 'operator-dashboard' : role === 'admin' ? 'admin-dashboard' : 'user-dashboard')
                      setMobileOpen(false)
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize ${userRole === role ? `${roleColor} text-white` : 'bg-slate-100 text-slate-600'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 px-4 py-2 bg-slate-100/60 rounded-xl">
                <span className="text-xs font-semibold text-slate-600">Appearance</span>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-xs font-medium text-slate-700 shadow-sm"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
