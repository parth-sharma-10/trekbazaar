import { useEffect, useState } from 'react'
import type { Screen, NavigateFn, UserRole } from './types'
import { parseHash, toHash, type Route } from './router'
import { useStore } from './store'

import Landing from './screens/Landing'
import Login from './screens/Login'
import SignUp from './screens/SignUp'
import Explore from './screens/Explore'
import TrekDetails from './screens/TrekDetails'
import BookingFlow from './screens/BookingFlow'
import PaymentSuccess from './screens/PaymentSuccess'
import UserDashboard from './screens/UserDashboard'
import BookingHistory from './screens/BookingHistory'
import Wishlist from './screens/Wishlist'
import Settings from './screens/Settings'
import OperatorDashboard from './screens/OperatorDashboard'
import AddEditTrek from './screens/AddEditTrek'
import BookingManagement from './screens/BookingManagement'
import RevenueAnalytics from './screens/RevenueAnalytics'
import AdminDashboard from './screens/AdminDashboard'
import UserManagement from './screens/UserManagement'
import OperatorVerification from './screens/OperatorVerification'
import ReviewsManagement from './screens/ReviewsManagement'

// Screens that only make sense for one role. Opening one by URL switches the demo role.
const roleForScreen: Partial<Record<Screen, UserRole>> = {
  'user-dashboard': 'user',
  'booking-history': 'user',
  wishlist: 'user',
  'operator-dashboard': 'operator',
  'add-trek': 'operator',
  'booking-management': 'operator',
  'revenue-analytics': 'operator',
  'admin-dashboard': 'admin',
  'user-management': 'admin',
  'operator-verification': 'admin',
  'reviews-management': 'admin',
}

const titles: Record<Screen, string> = {
  landing: "Discover India's Greatest Treks",
  login: 'Log in',
  signup: 'Sign up',
  explore: 'Explore Treks',
  'trek-details': 'Trek Details',
  booking: 'Book Your Trek',
  'payment-success': 'Booking Confirmed',
  'user-dashboard': 'Dashboard',
  'booking-history': 'My Bookings',
  wishlist: 'Wishlist',
  settings: 'Settings',
  'operator-dashboard': 'Operator Dashboard',
  'add-trek': 'Manage Trek',
  'booking-management': 'Booking Management',
  'revenue-analytics': 'Revenue Analytics',
  'admin-dashboard': 'Admin Dashboard',
  'user-management': 'User Management',
  'operator-verification': 'Operator Verification',
  'reviews-management': 'Reviews Management',
}

export default function App() {
  const { role, setRole, toast, findTrek } = useStore()
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const { screen, query } = route

  useEffect(() => {
    const required = roleForScreen[screen]
    if (required && required !== role) setRole(required)
    const trekTitle = screen === 'trek-details' || screen === 'booking' ? findTrek(query.trek)?.title : undefined
    const page = trekTitle ? (screen === 'booking' ? `Book ${trekTitle}` : trekTitle) : titles[screen]
    document.title = `${page} · TrekBazaar`
  }, [screen, query.trek, role, setRole, findTrek])

  const navigate: NavigateFn = (next, params) => {
    const hash = toHash(next, params)
    if (hash === window.location.hash) window.scrollTo({ top: 0, behavior: 'smooth' })
    else window.location.hash = hash
  }

  const commonProps = { navigate, userRole: role, setUserRole: setRole }

  const renderScreen = () => {
    switch (screen) {
      case 'landing': return <Landing {...commonProps} section={query.section} />
      case 'login': return <Login navigate={navigate} />
      case 'signup': return <SignUp navigate={navigate} initialRole={query.role === 'operator' ? 'operator' : 'user'} />
      case 'explore': return <Explore {...commonProps} query={query} />
      case 'trek-details': return <TrekDetails {...commonProps} trekId={query.trek} />
      case 'booking': return <BookingFlow {...commonProps} trekId={query.trek} initialDate={query.date} initialParticipants={Number(query.pax) || 1} />
      case 'payment-success': return <PaymentSuccess {...commonProps} bookingId={query.booking} />
      case 'user-dashboard': return <UserDashboard {...commonProps} />
      case 'booking-history': return <BookingHistory {...commonProps} />
      case 'wishlist': return <Wishlist {...commonProps} />
      case 'settings': return <Settings {...commonProps} />
      case 'operator-dashboard': return <OperatorDashboard {...commonProps} />
      case 'add-trek': return <AddEditTrek key={query.edit ?? 'new'} {...commonProps} editTrekId={query.edit ?? null} />
      case 'booking-management': return <BookingManagement {...commonProps} />
      case 'revenue-analytics': return <RevenueAnalytics {...commonProps} />
      case 'admin-dashboard': return <AdminDashboard {...commonProps} />
      case 'user-management': return <UserManagement {...commonProps} />
      case 'operator-verification': return <OperatorVerification {...commonProps} />
      case 'reviews-management': return <ReviewsManagement {...commonProps} />
    }
  }

  return (
    <>
      {/* key remounts the screen on navigation so per-screen state starts fresh */}
      <div key={toHash(screen, query)}>{renderScreen()}</div>
      <div aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-md pointer-events-none">
        {toast && (
          <div className="bg-slate-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl text-center">
            {toast}
          </div>
        )}
      </div>
    </>
  )
}
