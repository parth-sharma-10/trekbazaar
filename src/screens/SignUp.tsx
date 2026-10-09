import { useState } from 'react'
import { useStore } from '../store'
import type { NavigateFn } from '../types'

interface SignUpProps {
  navigate: NavigateFn
  initialRole: 'user' | 'operator'
}

export default function SignUp({ navigate, initialRole }: SignUpProps) {
  const { login, notify } = useStore()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: initialRole })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ name: form.name.trim(), email: form.email.trim(), phone: form.phone ? `+91 ${form.phone.trim()}` : '' }, form.role)
    notify(form.role === 'operator' ? 'Operator account created. Verification usually takes 2–3 business days.' : `Welcome to TrekBazaar, ${form.name.trim().split(' ')[0]}!`)
    navigate(form.role === 'operator' ? 'operator-dashboard' : 'user-dashboard')
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-800">
        <img
          src="https://images.unsplash.com/photo-1666438238957-76f3afac8eae?w=900&h=1200&fit=crop&auto=format"
          alt="Valley trek"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-forest/60" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
              </svg>
            </div>
            <span className="font-bold text-xl">TrekBazaar</span>
          </div>
          <h2 className="font-display text-3xl mb-3">Start your<br />Himalayan journey.</h2>
          <p className="text-white/70 text-sm leading-relaxed">Create a free account and get access to 1,200+ curated treks with verified operators.</p>
        </div>
      </div>

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

          <h1 className="font-display text-3xl text-slate-900 mb-2">Create your account</h1>
          <p className="text-slate-500 mb-8">Join the TrekBazaar community today</p>

          {/* Account type toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6" role="group" aria-label="Account type">
            <button
              type="button"
              aria-pressed={form.role === 'user'}
              onClick={() => setForm(f => ({ ...f, role: 'user' }))}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${form.role === 'user' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Trekker
            </button>
            <button
              type="button"
              aria-pressed={form.role === 'operator'}
              onClick={() => setForm(f => ({ ...f, role: 'operator' }))}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${form.role === 'operator' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              Trek Operator
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
              <input
                id="name"
                autoComplete="name"
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Rahul Kumar"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input
                id="email"
                autoComplete="email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="rahul@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone number <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-600 shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  id="phone"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{4} ?[0-9]{5}"
                  title="10-digit Indian mobile number"
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="98765 43210"
                  className="flex-1 min-w-0 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                id="password"
                autoComplete="new-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent transition-all placeholder-slate-400"
              />
            </div>

            {form.role === 'operator' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-700 font-medium mb-1">Operator Account</p>
                <p className="text-xs text-blue-600">You'll need to submit your operator details and certifications after signing up. Our team will verify your profile within 2-3 business days.</p>
              </div>
            )}

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" required id="terms" className="mt-0.5 accent-forest" />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-relaxed">
                I agree to TrekBazaar's{' '}
                <span className="text-forest underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-forest underline">Privacy Policy</span>
              </label>
            </div>

            <button type="submit" className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors mt-2">
              {form.role === 'operator' ? 'Create Operator Account' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="text-forest hover:text-forest-dark font-semibold transition-colors">Log in</button>
          </p>

          <p className="text-center mt-4">
            <button onClick={() => navigate('landing')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to homepage</button>
          </p>
        </div>
      </div>
    </div>
  )
}
