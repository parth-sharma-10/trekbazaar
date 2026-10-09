import Navbar from '../components/Navbar'
import TrekCard from '../components/TrekCard'
import { useStore } from '../store'
import type { NavigateFn, UserRole } from '../types'

interface WishlistProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
}

export default function Wishlist({ navigate, userRole, setUserRole }: WishlistProps) {
  const { treks, wishlist } = useStore()
  const wishlistTreks = treks.filter(t => wishlist.includes(t.id))

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="wishlist" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-slate-900">My Wishlist</h1>
            <p className="text-slate-500 mt-1">{wishlistTreks.length} trek{wishlistTreks.length !== 1 ? 's' : ''} saved for later</p>
          </div>
          {wishlistTreks.length > 0 && (
            <button onClick={() => navigate('explore')} className="bg-forest hover:bg-forest-dark text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
              + Add More
            </button>
          )}
        </div>

        {wishlistTreks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="text-6xl mb-4">🏔️</div>
            <h3 className="font-display text-2xl text-slate-700 mb-2">Your wishlist is empty</h3>
            <p className="text-slate-400 mb-6">Start exploring treks and save the ones you love for later.</p>
            <button onClick={() => navigate('explore')} className="bg-forest text-white px-8 py-3.5 rounded-full font-semibold hover:bg-forest-dark transition-colors">Explore Treks</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistTreks.map(trek => (
              <TrekCard key={trek.id} trek={trek} navigate={navigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
