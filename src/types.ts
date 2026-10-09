export type Screen =
  | 'landing' | 'login' | 'signup'
  | 'explore' | 'trek-details' | 'booking' | 'payment-success'
  | 'user-dashboard' | 'booking-history' | 'wishlist' | 'settings'
  | 'operator-dashboard' | 'add-trek' | 'booking-management' | 'revenue-analytics'
  | 'admin-dashboard' | 'user-management' | 'operator-verification' | 'reviews-management'

// Serialized into the URL hash, e.g. #/trek-details?trek=3
export type NavParams = Record<string, string | undefined>

export type NavigateFn = (screen: Screen, params?: NavParams) => void

export type UserRole = 'user' | 'operator' | 'admin'
