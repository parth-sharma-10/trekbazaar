import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TrekCard from '../components/TrekCard'
import { destinations } from '../data/treks'
import { useStore } from '../store'
import type { NavigateFn, UserRole } from '../types'

interface LandingProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
  section?: string
}

const testimonials = [
  { name: 'Priya Sharma', location: 'Delhi', trek: 'Roopkund Trek', rating: 5, text: 'Absolutely life-changing. The operator was professional, safety was paramount, and the views were beyond description. TrekBazaar made the whole booking so seamless.', avatar: 'PS' },
  { name: 'Arjun Mehta', location: 'Bangalore', trek: 'Kedarkantha Trek', rating: 5, text: 'My first high-altitude trek and it was perfect. The operator helped me prepare, and the entire experience from booking to descent was flawless.', avatar: 'AM' },
  { name: 'Kavya Nair', location: 'Mumbai', trek: 'Valley of Flowers', rating: 5, text: 'The Valley of Flowers is a dream, but having a verified operator through TrekBazaar made it feel safe and well-organized. 10/10 would recommend.', avatar: 'KN' },
]

const stats = [
  { value: '1,200+', label: 'Curated Treks' },
  { value: '150+', label: 'Verified Operators' },
  { value: '50,000+', label: 'Happy Trekkers' },
  { value: '4.8★', label: 'Average Rating' },
]

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Verified Operators',
    desc: 'Every operator is background-checked, safety-certified, and reviewed by our team before listing on TrekBazaar.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Book with confidence using our escrow payment system. Funds are released to operators only after your trek is complete.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: 'Live Trek Tracking',
    desc: 'Share your location with loved ones using our real-time GPS tracking. Peace of mind for you and your family.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    title: '24/7 Trek Support',
    desc: 'Our mountain experts are available around the clock during your trek for any emergencies or questions.'
  },
]

export default function Landing({ navigate, userRole, setUserRole, section }: LandingProps) {
  const [searchDest, setSearchDest] = useState('')
  const [searchDiff, setSearchDiff] = useState('')
  const [searchDuration, setSearchDuration] = useState('')
  const { treks } = useStore()

  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
  }, [section])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('explore', { q: searchDest.trim(), difficulty: searchDiff, duration: searchDuration })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="landing" userRole={userRole} setUserRole={setUserRole} />

      {/* Hero */}
      <section className="relative min-h-[92vh] py-24 flex items-center justify-center overflow-hidden bg-slate-800">
        <img
          src="https://images.unsplash.com/photo-1625735263130-6ff46f244010?w=1600&h=900&fit=crop&auto=format"
          alt="Himalayan mountain peaks"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            1,200+ treks available right now
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            Discover India's<br />
            <span className="italic text-green-300">Greatest Treks</span>
          </h1>
          <p className="text-white/80 text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Book curated treks with verified operators across the Himalayas, Western Ghats, and beyond. Every adventure, beautifully organized.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} role="search" className="bg-white rounded-2xl shadow-2xl p-2 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-1 relative">
                <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Destination or trek name"
                  aria-label="Destination or trek name"
                  value={searchDest}
                  onChange={e => setSearchDest(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none rounded-xl"
                />
              </div>
              <select
                value={searchDiff}
                onChange={e => setSearchDiff(e.target.value)}
                aria-label="Difficulty"
                className="w-full px-3 py-3 text-sm text-slate-600 focus:outline-none bg-white rounded-xl border-l border-slate-100"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Difficult">Difficult</option>
                <option value="Expert">Expert</option>
              </select>
              <select
                value={searchDuration}
                onChange={e => setSearchDuration(e.target.value)}
                aria-label="Duration"
                className="w-full px-3 py-3 text-sm text-slate-600 focus:outline-none bg-white rounded-xl border-l border-slate-100"
              >
                <option value="">Any Duration</option>
                <option value="1-3">1–3 Days</option>
                <option value="4-6">4–6 Days</option>
                <option value="7-10">7–10 Days</option>
                <option value="10+">10+ Days</option>
              </select>
              <button
                type="submit"
                className="bg-forest hover:bg-forest-dark text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
              >
                Search Treks
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {['Roopkund', 'Valley of Flowers', 'Chadar Trek', 'Kedarkantha', 'Hampta Pass'].map(tag => (
              <button
                key={tag}
                onClick={() => navigate('explore', { q: tag })}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full transition-colors border border-white/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 animate-bounce motion-reduce:animate-none">
          <span className="text-white/50 text-xs">Scroll to explore</span>
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl text-forest mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section id="destinations" className="py-20 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-forest font-semibold text-sm uppercase tracking-widest mb-2">Explore by Region</p>
              <h2 className="font-display text-3xl sm:text-4xl text-slate-900">Featured Destinations</h2>
            </div>
            <button onClick={() => navigate('explore')} className="hidden sm:flex items-center gap-1 text-sm font-medium text-forest hover:text-forest-dark transition-colors">
              View all <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {destinations.map(dest => (
              <button
                key={dest.name}
                onClick={() => navigate('explore', { state: dest.name })}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-200 hover:shadow-lg transition-all"
              >
                <img src={dest.image} alt={dest.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <div className="text-white font-semibold text-sm leading-tight">{dest.name}</div>
                  <div className="text-white/60 text-xs">{dest.count} treks</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Treks */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-forest font-semibold text-sm uppercase tracking-widest mb-2">Handpicked For You</p>
              <h2 className="font-display text-3xl sm:text-4xl text-slate-900">Popular Treks</h2>
            </div>
            <button onClick={() => navigate('explore')} className="hidden sm:flex items-center gap-1 text-sm font-medium text-forest hover:text-forest-dark transition-colors">
              View all treks <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {treks.slice(0, 4).map(trek => (
              <TrekCard key={trek.id} trek={trek} navigate={navigate} />
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">
              Explore All Treks
            </button>
          </div>
        </div>
      </section>

      {/* Why TrekBazaar */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-forest font-semibold text-sm uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="font-display text-3xl sm:text-4xl text-slate-900 mb-4">Adventure, Made Safe</h2>
            <p className="text-slate-500 text-lg">We combine the freedom of adventure with the safety of verified operators, transparent pricing, and technology-powered peace of mind.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-forest-50 rounded-xl flex items-center justify-center text-forest mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-forest font-semibold text-sm uppercase tracking-widest mb-2">Trekker Stories</p>
            <h2 className="font-display text-3xl sm:text-4xl text-slate-900">Loved by Adventurers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.location} · {t.trek}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1651319481112-b7027eeb4e8f?w=1400&h=500&fit=crop&auto=format"
          alt="Camping under stars"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-4xl sm:text-5xl text-white mb-5">Your Next Summit Awaits</h2>
          <p className="text-white/70 text-lg mb-8">Join 50,000+ trekkers who've discovered their perfect Himalayan adventure on TrekBazaar.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-4 rounded-full transition-colors">
              Find Your Trek
            </button>
            <button onClick={() => navigate('signup')} className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full transition-colors">
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Operator CTA */}
      <section className="py-16 bg-forest-50 border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl text-slate-900 mb-2">Are you a Trek Operator?</h3>
            <p className="text-slate-500">List your treks on TrekBazaar and reach thousands of verified trekkers across India.</p>
          </div>
          <button
            onClick={() => navigate('signup', { role: 'operator' })}
            className="shrink-0 bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm"
          >
            Partner With Us
          </button>
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  )
}
