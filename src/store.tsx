import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Trek } from './data/treks'
import { api, errorMessage } from './api'
import type { UserRole } from './types'

export interface User {
  id?: string
  role?: UserRole
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
  email?: string
}

export type NewBooking = Omit<Booking, 'id' | 'amount' | 'status' | 'email'>

// Treks, bookings and accounts live in MongoDB behind the Express API.
// Only per-browser preferences are kept in localStorage.
interface Prefs {
  user: User | null
  token: string | null
  wishlist: string[]
  darkMode: boolean
}

const STORAGE_KEY = 'trekbazaar:v3'

// The seeded trekker account the social-login buttons sign in to (password trek1234).
export const DEMO_USER: User = {
  name: 'Rahul Kumar',
  email: 'rahul.kumar@example.com',
  phone: '+91 98765 43210',
  city: 'Delhi',
  bio: 'Passionate trekker exploring the Himalayas one trail at a time.',
}
export const DEMO_PASSWORD = 'trek1234'

function initialPrefs(): Prefs {
  const prefersDark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  return { user: null, token: null, wishlist: ['1', '4', '5'], darkMode: prefersDark }
}

function load(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialPrefs(), ...JSON.parse(raw) }
  } catch {
    // Private mode or corrupted JSON: start from the defaults.
  }
  return initialPrefs()
}

type LoadState = 'loading' | 'ready' | 'error'

interface Session {
  user: User
  token: string
}

interface Store extends Prefs {
  role: UserRole
  status: LoadState
  loadError: string | null
  reload: () => void
  treks: Trek[]
  bookings: Booking[]
  myBookings: Booking[]
  findTrek: (id: string | undefined) => Trek | undefined
  login: (email: string, password: string) => Promise<User | undefined>
  register: (profile: Pick<User, 'name' | 'email' | 'phone'> & { password: string; role: UserRole }) => Promise<User | undefined>
  logout: () => void
  updateUser: (patch: Partial<User>) => Promise<User | undefined>
  toggleWishlist: (trekId: string) => void
  addBooking: (booking: NewBooking) => Promise<Booking | undefined>
  setBookingStatus: (id: string, status: BookingStatus) => Promise<Booking | undefined>
  saveTrek: (trek: Trek, isNew: boolean) => Promise<Trek | undefined>
  deleteTrek: (id: string) => Promise<boolean>
  resetDemo: () => void
  toggleDarkMode: () => void
  setDarkMode: (enabled: boolean) => void
  toast: string | null
  notify: (message: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load)
  const [treks, setTreks] = useState<Trek[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // Storage full or blocked: the session still works in memory.
    }
  }, [prefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.darkMode)
  }, [prefs.darkMode])

  const notify = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(null), 3000)
  }, [])

  // Every request carries the session token; the server decides what each role may see and do.
  useEffect(() => {
    if (prefs.token) api.defaults.headers.common.Authorization = `Bearer ${prefs.token}`
    else delete api.defaults.headers.common.Authorization
  }, [prefs.token])

  useEffect(() => {
    const id = api.interceptors.response.use(undefined, err => {
      if (err.response?.status === 401 && err.config?.headers?.Authorization) {
        setPrefs(p => ({ ...p, user: null, token: null }))
      }
      return Promise.reject(err)
    })
    return () => api.interceptors.response.eject(id)
  }, [])

  const reload = useCallback(() => {
    setStatus('loading')
    // Bookings are private, so a guest only loads the public trek list.
    Promise.all([api.get<Trek[]>('/treks'), prefs.token ? api.get<Booking[]>('/bookings') : { data: [] }])
      .then(([t, b]) => {
        setTreks(t.data)
        setBookings(b.data)
        setStatus('ready')
      })
      .catch(err => {
        setLoadError(errorMessage(err))
        setStatus('error')
      })
  }, [prefs.token])

  useEffect(reload, [reload])

  const store = useMemo<Store>(() => {
    // Runs an API call; on failure shows the server's message and resolves to undefined.
    async function attempt<T>(call: () => Promise<T>): Promise<T | undefined> {
      try {
        return await call()
      } catch (err) {
        notify(errorMessage(err))
        return undefined
      }
    }

    const signIn = ({ user, token }: Session) => {
      setPrefs(p => ({ ...p, user, token }))
      return user
    }
    const replaceBooking = (b: Booking) => {
      setBookings(list => list.map(x => (x.id === b.id ? b : x)))
      return b
    }
    const currentEmail = prefs.user?.email.toLowerCase()

    return {
      ...prefs,
      role: prefs.user?.role ?? 'user',
      status,
      loadError,
      reload,
      treks,
      bookings,
      myBookings: bookings.filter(b => b.email === currentEmail),
      findTrek: id => treks.find(t => t.id === id),
      login: (email, password) => attempt(async () =>
        signIn((await api.post<Session>('/users/login', { email, password })).data)),
      register: profile => attempt(async () =>
        signIn((await api.post<Session>('/users/register', profile)).data)),
      logout: () => setPrefs(p => ({ ...p, user: null, token: null })),
      updateUser: patch => attempt(async () => {
        const merged = { ...(prefs.user ?? DEMO_USER), ...patch }
        const saved = merged.id ? (await api.put<User>(`/users/${merged.id}`, merged)).data : merged
        setPrefs(p => ({ ...p, user: saved }))
        return saved
      }),
      toggleWishlist: id => setPrefs(p => ({
        ...p,
        wishlist: p.wishlist.includes(id) ? p.wishlist.filter(x => x !== id) : [...p.wishlist, id],
      })),
      addBooking: booking => attempt(async () => {
        const { data } = await api.post<Booking>('/bookings', booking)
        setBookings(list => [data, ...list])
        return data
      }),
      setBookingStatus: (id, next) => attempt(async () =>
        replaceBooking((await api.patch<Booking>(`/bookings/${id}`, { status: next })).data)),
      saveTrek: (trek, isNew) => attempt(async () => {
        const { data } = isNew ? await api.post<Trek>('/treks', trek) : await api.put<Trek>(`/treks/${trek.id}`, trek)
        setTreks(list => (isNew ? [...list, data] : list.map(t => (t.id === data.id ? data : t))))
        return data
      }),
      deleteTrek: async id => !!(await attempt(async () => {
        await api.delete(`/treks/${id}`)
        setTreks(list => list.filter(t => t.id !== id))
        setPrefs(p => ({ ...p, wishlist: p.wishlist.filter(x => x !== id) }))
        return true
      })),
      resetDemo: () => {
        setPrefs(initialPrefs())
        reload()
      },
      toggleDarkMode: () => setPrefs(p => ({ ...p, darkMode: !p.darkMode })),
      setDarkMode: enabled => setPrefs(p => ({ ...p, darkMode: enabled })),
      toast,
      notify,
    }
  }, [prefs, treks, bookings, status, loadError, reload, toast, notify])

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
