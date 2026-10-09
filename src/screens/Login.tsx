import { useState } from 'react'
import { DEMO_USER, useStore } from '../store'
import type { NavigateFn } from '../types'

interface LoginProps {
  navigate: NavigateFn
}

// "rahul.kumar@x.com" -> "Rahul Kumar"
function nameFromEmail(email: string): string {
  return email.split('@')[0].split(/[._-]+/).filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(' ') || 'Trekker'
}

export default function Login({ navigate }: LoginProps) {
  const { login, notify } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Demo auth: any email and password are accepted; there is no backend to check them against.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login({ name: nameFromEmail(email), email: email.trim() }, 'user')
    navigate('user-dashboard')
  }

  const socialLogin = (provider: string) => {
    login(DEMO_USER, 'user')
    notify(`Signed in with ${provider} (demo)`)
    navigate('user-dashboard')
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
          <p className="text-white/70 text-sm leading-relaxed">Join 50,000+ trekkers who've found their perfect Himalayan adventure on TrekBazaar.</p>
          <div className="flex gap-4 mt-6">
            {['1,200+ Treks', '150+ Operators', '4.8★ Rating'].map(s => (
              <div key={s} className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">{s}</div>
            ))}
          </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <button type="button" onClick={() => notify(email ? `Password reset link sent to ${email} (demo)` : 'Enter your email first, then tap Forgot password')} className="text-xs text-forest hover:text-forest-dark font-medium">Forgot password?</button>
              </div>
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

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => socialLogin('Google')} className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button onClick={() => socialLogin('GitHub')} className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>

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
