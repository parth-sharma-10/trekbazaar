import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useStore } from '../store'
import { formatDate, formatINR, getBatches, MAX_PARTICIPANTS, priceBreakdown } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface TrekDetailsProps {
  navigate: NavigateFn
  trekId: string | undefined
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

const reviews = [
  { name: 'Ankit Sharma', date: 'Oct 2024', rating: 5, text: 'An absolutely incredible experience. The operator was professional and the views were unlike anything I\'ve ever seen.', avatar: 'AS' },
  { name: 'Meera Pillai', date: 'Sep 2024', rating: 5, text: 'Well-organized, safe, and the meals were surprisingly good. My fitness prepared me well but the altitude still challenged me.', avatar: 'MP' },
  { name: 'Dev Arora', date: 'Jun 2024', rating: 4, text: 'Great trek overall. The team was experienced and supportive. Day 6 was the hardest but most rewarding day of my life.', avatar: 'DA' },
]

const diffColors: Record<string, string> = {
  Easy: 'bg-green-100 text-green-800',
  Moderate: 'bg-amber-100 text-amber-800',
  Difficult: 'bg-orange-100 text-orange-800',
  Expert: 'bg-red-100 text-red-800',
}

export default function TrekDetails({ navigate, trekId, userRole, setUserRole }: TrekDetailsProps) {
  const { findTrek, wishlist, toggleWishlist, notify } = useStore()
  const trek = findTrek(trekId)
  const [activeTab, setActiveTab] = useState('overview')
  const [activeImg, setActiveImg] = useState(0)
  const batches = getBatches(trekId ?? '')
  const [selectedDate, setSelectedDate] = useState(batches[0].date)
  const [participants, setParticipants] = useState(1)

  if (!trek) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar navigate={navigate} currentScreen="trek-details" userRole={userRole} setUserRole={setUserRole} />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4">🧭</div>
          <h1 className="font-display text-3xl text-slate-900 mb-2">Trek not found</h1>
          <p className="text-slate-500 mb-6">This trek may have been removed or the link is incorrect.</p>
          <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-sm">Browse all treks</button>
        </div>
      </div>
    )
  }

  const wishlisted = wishlist.includes(trek.id)
  const price = priceBreakdown(trek.price, participants)
  const bookNow = () => navigate('booking', { trek: trek.id, date: selectedDate, pax: String(participants) })

  const tabs = ['overview', 'itinerary', 'inclusions', 'reviews', 'map']

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="trek-details" userRole={userRole} setUserRole={setUserRole} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-slate-500">
          <button onClick={() => navigate('landing')} className="hover:text-forest transition-colors">Home</button>
          <span>›</span>
          <button onClick={() => navigate('explore')} className="hover:text-forest transition-colors">Explore</button>
          <span>›</span>
          <span className="text-slate-900 font-medium truncate">{trek.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="rounded-2xl overflow-hidden bg-slate-200">
              <div className="aspect-[16/9] relative overflow-hidden">
                <img src={trek.gallery[activeImg] || trek.image} alt={trek.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {trek.gallery.length > 1 && (
                <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                  {trek.gallery.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Show photo ${i + 1}`}
                      aria-pressed={activeImg === i}
                      className={`w-16 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-forest' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${diffColors[trek.difficulty]}`}>{trek.difficulty}</span>
                    {trek.tags.map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl text-slate-900">{trek.title}</h1>
                  <p className="text-slate-500 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {trek.location}, {trek.state}
                  </p>
                </div>
                <button onClick={() => toggleWishlist(trek.id)} aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={wishlisted} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${wishlisted ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-red-300'}`}>
                  <svg className={`w-5 h-5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < Math.floor(trek.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-bold text-slate-800">{trek.reviewCount > 0 ? trek.rating : 'New listing'}</span>
                <span className="text-slate-400 text-sm">({trek.reviewCount} reviews)</span>
                <span className="text-slate-200">·</span>
                <span className="text-sm text-slate-500">by {trek.operator}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Duration', value: trek.duration, icon: '🕐' },
                  { label: 'Max Altitude', value: trek.maxAltitude, icon: '⛰️' },
                  { label: 'Group Size', value: trek.groupSize, icon: '👥' },
                  { label: 'Best Months', value: trek.bestMonths, icon: '📅' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-xs text-slate-400 mb-0.5">{item.label}</div>
                    <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto" role="tablist">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-forest text-forest' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">About This Trek</h3>
                      <p className="text-slate-600 leading-relaxed">{trek.description}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">Highlights</h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {trek.highlights.map(h => (
                          <li key={h} className="flex items-start gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-forest mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-500">⚠️</span>
                        <div>
                          <p className="text-sm font-semibold text-amber-800 mb-1">Meeting Point</p>
                          <p className="text-sm text-amber-700">{trek.meetingPoint}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'itinerary' && (
                  <div className="space-y-4">
                    {trek.itinerary.map((day, i) => (
                      <div key={day.day} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-forest rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{day.day}</div>
                          {i < trek.itinerary.length - 1 && <div className="w-0.5 bg-forest-100 flex-1 mt-2 min-h-[24px]" />}
                        </div>
                        <div className="pb-4">
                          <h4 className="font-semibold text-slate-900 mb-1">{day.title}</h4>
                          <p className="text-sm text-slate-500 leading-relaxed">{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'inclusions' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>
                        Inclusions
                      </h3>
                      <ul className="space-y-2">
                        {trek.inclusions.map(inc => (
                          <li key={inc} className="flex items-start gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {inc}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-xs">✕</span>
                        Exclusions
                      </h3>
                      <ul className="space-y-2">
                        {trek.exclusions.map(exc => (
                          <li key={exc} className="flex items-start gap-2 text-sm text-slate-600">
                            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {exc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && trek.reviewCount === 0 && (
                  <p className="text-sm text-slate-500">No reviews yet. Be the first to trek it.</p>
                )}

                {activeTab === 'reviews' && trek.reviewCount > 0 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                      <div className="text-center shrink-0">
                        <div className="font-display text-5xl text-forest">{trek.rating}</div>
                        <div className="flex gap-0.5 justify-center mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{trek.reviewCount} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                          const pct = star === 5 ? 68 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 2 : 1
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 w-4">{star}</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {reviews.map(r => (
                      <div key={r.name} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-forest to-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{r.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-slate-900 text-sm">{r.name}</span>
                              <span className="text-xs text-slate-400">{r.date}</span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {Array.from({ length: r.rating }).map((_, i) => (
                                <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              ))}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{r.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'map' && (
                  <div className="rounded-xl overflow-hidden bg-slate-100 h-64 flex items-center justify-center relative">
                    <img
                      src={trek.image}
                      alt="Trek area"
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="bg-white rounded-2xl shadow-lg px-6 py-4 text-center">
                        <div className="text-3xl mb-2">🗺️</div>
                        <p className="font-semibold text-slate-700">Interactive Map</p>
                        <p className="text-xs text-slate-400 mt-1">Route map is not part of this demo</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 lg:sticky lg:top-24">
              <div className="flex items-baseline gap-1 mb-5">
                <span className="font-display text-3xl text-slate-900">₹{trek.price.toLocaleString('en-IN')}</span>
                <span className="text-slate-400 text-sm">/ person</span>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label htmlFor="batch" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Departure</label>
                  <select
                    id="batch"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    {batches.map(b => (
                      <option key={b.date} value={b.date}>{formatDate(b.date)} · {b.spots} spots left</option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Participants</span>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2.5">
                    <button onClick={() => setParticipants(Math.max(1, participants - 1))} aria-label="Fewer participants" disabled={participants <= 1} className="disabled:opacity-40 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors text-lg leading-none">−</button>
                    <span className="flex-1 text-center text-sm font-semibold text-slate-900" aria-live="polite">{participants}</span>
                    <button onClick={() => setParticipants(Math.min(MAX_PARTICIPANTS, participants + 1))} aria-label="More participants" disabled={participants >= MAX_PARTICIPANTS} className="disabled:opacity-40 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors text-lg leading-none">+</button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{formatINR(trek.price)} × {participants}</span>
                  <span className="text-slate-700">{formatINR(price.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Service fee</span>
                  <span className="text-slate-700">{formatINR(price.serviceFee)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-forest">{formatINR(price.total)}</span>
                </div>
              </div>

              <button
                onClick={bookNow}
                className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-3.5 rounded-xl transition-colors mb-3"
              >
                Book This Trek
              </button>

              <button
                onClick={() => notify(`Custom date request sent to ${trek.operator}. They usually reply within 24 hours.`)}
                className="w-full border-2 border-forest text-forest hover:bg-forest-50 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Request Custom Date
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Secure booking · Free cancellation 30 days before
              </div>
            </div>

            {/* Operator card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-forest to-green-400 rounded-xl flex items-center justify-center text-white font-bold">
                  {trek.operator[0]}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{trek.operator}</div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-blue-500 fill-blue-500" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                    <span className="text-xs text-blue-600 font-medium">Verified Operator</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="font-bold text-slate-800">4.9 ★</div>
                  <div className="text-slate-400">Rating</div>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <div className="font-bold text-slate-800">6 yrs</div>
                  <div className="text-slate-400">Experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  )
}
