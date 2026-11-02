import axios from 'axios'

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
