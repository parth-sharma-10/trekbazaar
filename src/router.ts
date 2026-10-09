import type { Screen } from './types'

export const SCREENS: readonly Screen[] = [
  'landing', 'login', 'signup',
  'explore', 'trek-details', 'booking', 'payment-success',
  'user-dashboard', 'booking-history', 'wishlist', 'settings',
  'operator-dashboard', 'add-trek', 'booking-management', 'revenue-analytics',
  'admin-dashboard', 'user-management', 'operator-verification', 'reviews-management',
]

export type Query = Record<string, string>

export interface Route {
  screen: Screen
  query: Query
}

// Hash routing keeps the app deployable on any static host (GitHub Pages included)
// without server-side rewrites. Unknown paths fall back to the landing page.
export function parseHash(hash: string): Route {
  const [path, qs = ''] = hash.replace(/^#\/?/, '').split('?')
  const screen = (SCREENS as readonly string[]).includes(path) ? (path as Screen) : 'landing'
  return { screen, query: Object.fromEntries(new URLSearchParams(qs)) }
}

export function toHash(screen: Screen, query: Record<string, string | undefined> = {}): string {
  const entries = Object.entries(query).filter((e): e is [string, string] => !!e[1])
  const qs = new URLSearchParams(entries).toString()
  return `#/${screen === 'landing' ? '' : screen}${qs ? `?${qs}` : ''}`
}
