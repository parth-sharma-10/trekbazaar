import { useState } from 'react'
import { useStore, type User } from '../store'
import type { NavigateFn } from '../types'

interface LoginProps {
  navigate: NavigateFn
}

const homeFor = { user: 'user-dashboard', operator: 'operator-dashboard', admin: 'admin-dashboard' } as const

export default function Login({ navigate }: LoginProps) {
  const { login } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const enter = (user: User | undefined) => {
    setBusy(false)
    if (user) navigate(homeFor[user.role ?? 'user'])
  }

  // Credentials are checked by POST /api/users/login against the users collection.
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    enter(await login(email, password))
  }


  return (
    <div className="min-h-screen flex">
      {/* Left — image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-800">
        <img
          src="https://images.unsplash.com/photo-1625735263128-17bbb0f30d31?w=900&h=1200&fit=crop&auto=format"
          alt="Mountain trekking"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest/60 to-slate-900/50" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
              </svg>
            </div>
            <span className="font-bold text-xl">TrekBazaar</span>
          </div>
          <h2 className="font-display text-3xl mb-3">Your mountains are waiting.</h2>
          <p className="text-white/70 text-sm leading-relaxed">Log in to request seats, track your bookings and review treks you have completed.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-forest rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
              </svg>
            </div>
            <span className="font-bold text-lg">Trek<span className="text-forest">Bazaar</span></span>
          </div>

          <h1 className="font-display text-3xl text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 mb-8">Log in to your TrekBazaar account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                id="email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  autoComplete="current-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all pr-10 placeholder-slate-400"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    {showPw
                      ? <><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></>
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors mt-2">
              Log in
            </button>
          </form>


          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('signup')} className="text-forest hover:text-forest-dark font-semibold transition-colors">Sign up free</button>
          </p>

          <p className="text-center mt-4">
            <button onClick={() => navigate('landing')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to homepage</button>
          </p>
        </div>
      </div>
    </div>
  )
}
