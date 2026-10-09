import type { Trek } from '../data/treks'
import type { NavigateFn } from '../types'
import { useStore } from '../store'

const difficultyConfig = {
  Easy: { bg: 'bg-green-100', text: 'text-green-800' },
  Moderate: { bg: 'bg-amber-100', text: 'text-amber-800' },
  Difficult: { bg: 'bg-orange-100', text: 'text-orange-800' },
  Expert: { bg: 'bg-red-100', text: 'text-red-800' },
}

interface TrekCardProps {
  trek: Trek
  navigate: NavigateFn
  compact?: boolean
}

export default function TrekCard({ trek, navigate, compact = false }: TrekCardProps) {
  const diff = difficultyConfig[trek.difficulty]
  const { wishlist, toggleWishlist } = useStore()
  const wishlisted = wishlist.includes(trek.id)
  const open = () => navigate('trek-details', { trek: trek.id })

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter') open() }}
      role="link"
      tabIndex={0}
      aria-label={`${trek.title}, ${trek.difficulty}, ${trek.duration}`}
    >
      <div className={`relative overflow-hidden bg-slate-200 ${compact ? 'h-40' : 'h-52'}`}>
        <img
          src={trek.image}
          alt={trek.title}
          loading="lazy"
          className="w-full h-full object-cover trek-card-img group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <button
            onClick={e => { e.stopPropagation(); toggleWishlist(trek.id) }}
            onKeyDown={e => e.stopPropagation()}
            aria-label={wishlisted ? `Remove ${trek.title} from wishlist` : `Save ${trek.title} to wishlist`}
            aria-pressed={wishlisted}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white active:scale-90 transition-all shadow-sm"
          >
            <svg className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
          {trek.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-white/90 backdrop-blur-sm text-slate-700 font-medium px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-slate-900 leading-tight text-[15px]">{trek.title}</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${diff.bg} ${diff.text}`}>
            {trek.difficulty}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {trek.location}, {trek.state}
        </p>

        {!compact && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{trek.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {trek.duration}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trek.maxAltitude}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-bold text-slate-900">₹{trek.price.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 ml-1">/ person</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {trek.reviewCount > 0 ? (
              <>
                <span className="text-sm font-semibold text-slate-800">{trek.rating}</span>
                <span className="text-xs text-slate-400">({trek.reviewCount})</span>
              </>
            ) : (
              <span className="text-xs font-semibold text-forest">New</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
