import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'

// In development Vite proxies /api to the Express server (see vite.config.ts).
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', timeout: 10000 })

// The server always answers errors as { error: string }.
export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error) return err.response.data.error
    if (!err.response) return 'Cannot reach the TrekBazaar server. Is it running?'
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}

// Loads one API list for a screen; `reload` refetches it after a change.
export function useApiList<T>(path: string) {
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(() => {
    api.get<T[]>(path)
      .then(r => {
        setData(r.data)
        setError(null)
      })
      .catch(err => setError(errorMessage(err)))
  }, [path])
  useEffect(reload, [reload])
  return { data, error, reload }
}
