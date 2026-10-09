import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { treks as seedTreks, type Trek } from './data/treks'
import { addDays, priceBreakdown, today } from './lib'
import type { UserRole } from './types'

export interface User {
  name: string
  email: string
  phone: string
  city: string
  bio: string
}

export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'

export interface Booking {
  id: string
  trekId: string
  date: string // ISO yyyy-mm-dd
  participants: number
  amount: number
  status: BookingStatus
  traveller: string
}

interface PersistedState {
  user: User | null
  role: UserRole
  wishlist: string[]
  bookings: Booking[]
  customTreks: Trek[]
  darkMode: boolean
}

// ponytail: one localStorage key stands in for a backend; swap these setters for API calls when one exists.
const STORAGE_KEY = 'trekbazaar:v1'

export const DEMO_USER: User = {
  name: 'Rahul Kumar',
  email: 'rahul.kumar@example.com',
  phone: '+91 98765 43210',
  city: 'Delhi',
  bio: 'Passionate trekker exploring the Himalayas one trail at a time.',
}

function seedBooking(id: string, trekId: string, offsetDays: number, participants: number, status: BookingStatus): Booking {
  const trek = seedTreks.find(t => t.id === trekId)!
  return {
    id,
    trekId,
    date: addDays(today(), offsetDays),
    participants,
    amount: priceBreakdown(trek.price, participants).total,
    status,
    traveller: DEMO_USER.name,
  }
}

function initialState(): PersistedState {
  const year = new Date().getFullYear()
  const prefersDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  return {
    user: null,
    role: 'user',
    wishlist: ['1', '4', '5'],
    bookings: [
      seedBooking(`TB-${year}-389123`, '1', 47, 2, 'Confirmed'),
      seedBooking(`TB-${year}-245678`, '2', 12, 1, 'Pending'),
      seedBooking(`TB-${year - 1}-178923`, '5', -260, 3, 'Completed'),
      seedBooking(`TB-${year - 1}-093421`, '8', -360, 2, 'Completed'),
      seedBooking(`TB-${year - 1}-052341`, '3', -420, 1, 'Cancelled'),
    ],
    customTreks: [],
    darkMode: prefersDark,
  }
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    // Private mode or corrupted JSON: start from the seed data.
  }
  return initialState()
}

interface Store extends PersistedState {
  treks: Trek[]
  findTrek: (id: string | undefined) => Trek | undefined
  setRole: (role: UserRole) => void
  login: (user: Partial<User> & Pick<User, 'name' | 'email'>, role: UserRole) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void
  toggleWishlist: (trekId: string) => void
  addBooking: (booking: Booking) => void
  setBookingStatus: (id: string, status: BookingStatus) => void
  saveTrek: (trek: Trek) => void
  resetDemo: () => void
  darkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (enabled: boolean) => void
  toast: string | null
  notify: (message: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked: the session still works in memory.
    }
  }, [state])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (state.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [state.darkMode])

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 3000)
  }, [])

  const store = useMemo<Store>(() => {
    // Custom treks with a seed id are edits of that seed trek; others are new listings.
    const overrides = new Map(state.customTreks.map(t => [t.id, t]))
    const seedIds = new Set(seedTreks.map(t => t.id))
    const treks = [
      ...seedTreks.map(t => overrides.get(t.id) ?? t),
      ...state.customTreks.filter(t => !seedIds.has(t.id)),
    ]

    return {
      ...state,
      treks,
      findTrek: id => treks.find(t => t.id === id),
      setRole: role => setState(s => ({ ...s, role })),
      login: (user, role) => setState(s => ({ ...s, role, user: { ...DEMO_USER, phone: '', city: '', bio: '', ...user } })),
      logout: () => setState(s => ({ ...s, user: null, role: 'user' })),
      updateUser: patch => setState(s => ({ ...s, user: { ...(s.user ?? DEMO_USER), ...patch } })),
      toggleWishlist: id => setState(s => ({
        ...s,
        wishlist: s.wishlist.includes(id) ? s.wishlist.filter(x => x !== id) : [...s.wishlist, id],
      })),
      addBooking: booking => setState(s => ({ ...s, bookings: [booking, ...s.bookings] })),
      setBookingStatus: (id, status) => setState(s => ({
        ...s,
        bookings: s.bookings.map(b => (b.id === id ? { ...b, status } : b)),
      })),
      saveTrek: trek => setState(s => ({
        ...s,
        customTreks: [...s.customTreks.filter(t => t.id !== trek.id), trek],
      })),
      resetDemo: () => setState(initialState()),
      toggleDarkMode: () => setState(s => ({ ...s, darkMode: !s.darkMode })),
      setDarkMode: enabled => setState(s => ({ ...s, darkMode: enabled })),
      toast,
      notify,
    }
  }, [state, toast, notify])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}

export function useCurrentUser(): User {
  return useStore().user ?? DEMO_USER
}
