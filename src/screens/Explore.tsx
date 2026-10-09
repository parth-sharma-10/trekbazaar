import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TrekCard from '../components/TrekCard'
import { useStore } from '../store'
import { toHash, type Query } from '../router'
import type { NavigateFn, UserRole } from '../types'

interface ExploreProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
  query: Query
}

const PRICE_FLOOR = 3000

export default function Explore({ navigate, userRole, setUserRole, query }: ExploreProps) {
  const { treks } = useStore()
  const priceCeiling = Math.max(25000, Math.ceil(Math.max(...treks.map(t => t.price)) / 5000) * 5000)
  const [search, setSearch] = useState(query.q ?? '')
  const [difficulty, setDifficulty] = useState<string[]>(query.difficulty ? query.difficulty.split(',') : [])
  const [duration, setDuration] = useState<string[]>(query.duration ? query.duration.split(',') : [])
  const [maxPrice, setMaxPrice] = useState(Number(query.max) || priceCeiling)
  const [state, setState] = useState(query.state ?? '')
  const [sort, setSort] = useState(query.sort ?? 'popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mirror filters into the URL so refresh and shared links keep them. replaceState
  // avoids a history entry per keystroke and does not fire hashchange.
  useEffect(() => {
    const hash = toHash('explore', {
      q: search.trim(),
      difficulty: difficulty.join(','),
      duration: duration.join(','),
      state,
      max: maxPrice < priceCeiling ? String(maxPrice) : undefined,
      sort: sort === 'popular' ? undefined : sort,
    })
    if (hash !== window.location.hash) history.replaceState(null, '', hash)
  }, [search, difficulty, duration, state, maxPrice, sort, priceCeiling])

  const toggleDiff = (d: string) => setDifficulty(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const toggleDur = (d: string) => setDuration(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const clearFilters = () => { setSearch(''); setDifficulty([]); setDuration([]); setMaxPrice(priceCeiling); setState('') }
  const activeFilterCount = difficulty.length + duration.length + (state ? 1 : 0) + (maxPrice < priceCeiling ? 1 : 0)

  const needle = search.trim().toLowerCase()
  const filtered = treks.filter(t => {
    if (needle && ![t.title, t.location, t.state, ...t.tags].some(f => f.toLowerCase().includes(needle))) return false
    if (difficulty.length && !difficulty.includes(t.difficulty)) return false
    if (t.price > maxPrice) return false
    if (state && t.state !== state) return false
    if (duration.length) {
      const d = t.durationDays
      const inRange = duration.some(r => {
        if (r === '1-3') return d >= 1 && d <= 3
        if (r === '4-6') return d >= 4 && d <= 6
        if (r === '7-10') return d >= 7 && d <= 10
        if (r === '10+') return d > 10
        return false
      })
      if (!inRange) return false
    }
    return true
  }).sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'rating') return b.rating - a.rating
    return b.reviewCount - a.reviewCount
  })

  const states = [...new Set(treks.map(t => t.state))]

  // Called as a function, not rendered as <FilterSidebar />: a component defined inside
  // render remounts every update, which drops the range slider mid-drag.
  const filterSidebar = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Filters</h3>
        <button onClick={clearFilters} className="text-xs text-forest hover:text-forest-dark font-medium">Clear all</button>
      </div>

      {/* Difficulty */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Difficulty</h4>
        <div className="space-y-2">
          {[
            { label: 'Easy', color: 'bg-green-100 text-green-800' },
            { label: 'Moderate', color: 'bg-amber-100 text-amber-800' },
            { label: 'Difficult', color: 'bg-orange-100 text-orange-800' },
            { label: 'Expert', color: 'bg-red-100 text-red-800' },
          ].map(({ label, color }) => (
            <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={difficulty.includes(label)}
                onChange={() => toggleDiff(label)}
                className="accent-forest rounded"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Duration</h4>
        <div className="space-y-2">
          {[{ label: 'Weekend (1–3 days)', val: '1-3' }, { label: 'Short (4–6 days)', val: '4-6' }, { label: 'Week (7–10 days)', val: '7-10' }, { label: 'Long (10+ days)', val: '10+' }].map(({ label, val }) => (
            <label key={val} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={duration.includes(val)} onChange={() => toggleDur(val)} className="accent-forest" />
              <span className="text-sm text-slate-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-700">Max Price</h4>
          <span className="text-sm font-semibold text-forest">₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={PRICE_FLOOR}
          max={priceCeiling}
          step={500}
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          aria-label="Maximum price per person"
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>₹{PRICE_FLOOR.toLocaleString('en-IN')}</span>
          <span>₹{priceCeiling.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* State */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">State</h4>
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          aria-label="State"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-forest"
        >
          <option value="">All States</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="explore" userRole={userRole} setUserRole={setUserRole} />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl text-slate-900 mb-1">Explore Treks</h1>
          <p className="text-slate-500 mb-5">Discover {treks.length} verified treks across India's most stunning mountain ranges</p>
          <div className="relative max-w-xl">
            <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by trek, region or tag (e.g. snow, lake)"
              aria-label="Search treks"
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            {filterSidebar()}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-expanded={sidebarOpen} className="lg:hidden flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filters {activeFilterCount > 0 && <span className="bg-forest text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
                </button>
                <span className="text-sm text-slate-500 font-medium" aria-live="polite">{filtered.length} trek{filtered.length === 1 ? '' : 's'} found</span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  aria-label="Sort treks"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode('grid')} aria-label="Grid view" aria-pressed={viewMode === 'grid'} className={`p-2 ${viewMode === 'grid' ? 'bg-forest text-white' : 'text-slate-400 hover:text-slate-600 bg-white'} transition-colors`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button onClick={() => setViewMode('list')} aria-label="List view" aria-pressed={viewMode === 'list'} className={`p-2 ${viewMode === 'list' ? 'bg-forest text-white' : 'text-slate-400 hover:text-slate-600 bg-white'} transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile sidebar */}
            {sidebarOpen && (
              <div className="lg:hidden mb-6">
                {filterSidebar()}
              </div>
            )}

            {/* Active filters */}
            {(difficulty.length > 0 || duration.length > 0 || state || needle) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {needle && (
                  <span className="flex items-center gap-1.5 bg-forest-50 text-forest text-xs font-medium px-3 py-1.5 rounded-full">
                    "{search.trim()}"
                    <button onClick={() => setSearch('')} aria-label="Clear search" className="hover:text-forest-dark">×</button>
                  </span>
                )}
                {duration.map(d => (
                  <span key={d} className="flex items-center gap-1.5 bg-forest-50 text-forest text-xs font-medium px-3 py-1.5 rounded-full">
                    {d === '10+' ? '10+ days' : `${d.replace('-', '–')} days`}
                    <button onClick={() => toggleDur(d)} aria-label={`Remove ${d} days filter`} className="hover:text-forest-dark">×</button>
                  </span>
                ))}
                {difficulty.map(d => (
                  <span key={d} className="flex items-center gap-1.5 bg-forest-50 text-forest text-xs font-medium px-3 py-1.5 rounded-full">
                    {d}
                    <button onClick={() => toggleDiff(d)} aria-label={`Remove ${d} filter`} className="hover:text-forest-dark">×</button>
                  </span>
                ))}
                {state && (
                  <span className="flex items-center gap-1.5 bg-forest-50 text-forest text-xs font-medium px-3 py-1.5 rounded-full">
                    {state}
                    <button onClick={() => setState('')} aria-label={`Remove ${state} filter`} className="hover:text-forest-dark">×</button>
                  </span>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏔️</div>
                <h3 className="font-display text-2xl text-slate-700 mb-2">No treks found</h3>
                <p className="text-slate-400 mb-6">Try adjusting your filters to see more results.</p>
                <button onClick={clearFilters} className="bg-forest text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-forest-dark transition-colors">Clear Filters</button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
                {filtered.map(trek => (
                  viewMode === 'grid' ? (
                    <TrekCard key={trek.id} trek={trek} navigate={navigate} />
                  ) : (
                    <button
                      key={trek.id}
                      onClick={() => navigate('trek-details', { trek: trek.id })}
                      className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row overflow-hidden"
                    >
                      <div className="h-40 sm:h-auto sm:w-48 shrink-0 relative overflow-hidden bg-slate-200">
                        <img src={trek.image} alt={trek.title} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-slate-900">{trek.title}</h3>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ml-2 ${trek.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : trek.difficulty === 'Moderate' ? 'bg-amber-100 text-amber-800' : trek.difficulty === 'Difficult' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{trek.difficulty}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{trek.location}, {trek.state}</p>
                          <p className="text-sm text-slate-500 line-clamp-2">{trek.description}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                          <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap">
                            <span>{trek.duration}</span>
                            <span>↑ {trek.maxAltitude}</span>
                            <span>⭐ {trek.rating} ({trek.reviewCount})</span>
                          </div>
                          <span className="font-bold text-slate-900">₹{trek.price.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer navigate={navigate} />
    </div>
  )
}
