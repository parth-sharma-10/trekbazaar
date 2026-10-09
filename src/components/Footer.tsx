import type { NavigateFn } from '../types'
import { useStore } from '../store'

interface FooterProps {
  navigate: NavigateFn
}

export default function Footer({ navigate }: FooterProps) {
  const { notify } = useStore()
  const placeholder = (label: string) => () => notify(`${label} is not part of this demo yet.`)
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <button onClick={() => navigate('landing')} className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-forest rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5 1.515a3 3 0 00-3 0L3 5.845a2 2 0 00-1 1.732V21a1 1 0 001 1h6v-6h4v6h6a1 1 0 001-1V7.577a2 2 0 00-1-1.732L13.5 1.515z" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">Trek<span className="text-green-400">Bazaar</span></span>
            </button>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-5">
              India's most trusted trekking marketplace. Discover verified treks, certified operators, and unforgettable Himalayan adventures.
            </p>
            <div className="flex gap-3">
              {['instagram', 'twitter', 'youtube', 'facebook'].map(social => (
                <button key={social} onClick={placeholder(`TrekBazaar on ${social}`)} aria-label={social} className="w-9 h-9 bg-slate-800 hover:bg-forest rounded-full flex items-center justify-center transition-colors">
                  <span className="text-xs text-slate-300">{social[0].toUpperCase()}</span>
                </button>
              ))}
            </div>
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
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About Us', 'How It Works', 'Safety Standards', 'Press', 'Careers'].map(link => (
                <li key={link}>
                  <button onClick={placeholder(link)} className="text-sm text-slate-400 hover:text-white transition-colors">{link}</button>
                </li>
              ))}
              <li>
                <button onClick={() => navigate('signup', { role: 'operator' })} className="text-sm text-slate-400 hover:text-white transition-colors">For Operators</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {['Help Centre', 'Cancellation Policy', 'Booking Guide', 'Insurance', 'Emergency', 'Contact Us'].map(link => (
                <li key={link}>
                  <button onClick={placeholder(link)} className="text-sm text-slate-400 hover:text-white transition-colors">{link}</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} TrekBazaar Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(link => (
              <button key={link} onClick={placeholder(link)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{link}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
