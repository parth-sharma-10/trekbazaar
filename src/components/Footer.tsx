import type { NavigateFn } from '../types'

interface FooterProps {
  navigate: NavigateFn
}

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <button onClick={() => navigate('landing')} className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-forest rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">Trek<span className="text-green-400">Bazaar</span></span>
            </button>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              A marketplace for Indian treks: browse listings, request a seat, and let the operator confirm it.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Treks', params: {} },
                { label: 'Uttarakhand', params: { state: 'Uttarakhand' } },
                { label: 'Himachal Pradesh', params: { state: 'Himachal Pradesh' } },
                { label: 'Weekend Treks', params: { duration: '1-3' } },
                { label: 'Expert Treks', params: { difficulty: 'Expert' } },
                { label: 'Beginner Treks', params: { difficulty: 'Easy' } },
              ].map(({ label: link, params }) => (
                <li key={link}>
                  <button onClick={() => navigate('explore', params)} className="text-sm text-slate-400 hover:text-white transition-colors">{link}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Accounts</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Log in', screen: 'login' as const, params: {} },
                { label: 'Create an account', screen: 'signup' as const, params: {} },
                { label: 'For Operators', screen: 'signup' as const, params: { role: 'operator' } },
              ].map(({ label, screen, params }) => (
                <li key={label}>
                  <button onClick={() => navigate(screen, params)} className="text-sm text-slate-400 hover:text-white transition-colors">{label}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} TrekBazaar, a student MERN project.</p>
        </div>
      </div>
    </footer>
  )
}
