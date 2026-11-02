import { fileURLToPath } from 'node:url'
import express from 'express'
import mongoose from 'mongoose'
import { authenticate } from './auth.js'
import { bookings, reviews, treks, users } from './routes.js'

const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trekbazaar'

export const app = express()
app.disable('x-powered-by')

app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  const started = Date.now()
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`))
  next()
})

app.use('/api', authenticate)
app.get('/api/health', (req, res) => res.json({ ok: true, db: mongoose.connection.name }))
app.use('/api/treks', treks)
app.use('/api/bookings', bookings)
app.use('/api/users', users)
app.use('/api/reviews', reviews)

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` }))

// Express 5 forwards rejected promises from async handlers here.
app.use((err, req, res, _next) => {
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0]
    return res.status(400).json({ error: first?.message ?? err.message })
  }
  if (err.name === 'CastError') return res.status(400).json({ error: `Invalid value for ${err.path}` })
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value'
    return res.status(409).json({ error: `A record with this ${field} already exists` })
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' })
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

export async function start(uri = MONGO_URI, port = PORT) {
  await mongoose.connect(uri)
  console.log('Connected to MongoDB:', mongoose.connection.name)
  return app.listen(port, () => console.log(`API running on http://localhost:${port}`))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start().catch(err => {
    console.error(`Failed to start: ${err.message}. Is MongoDB running at ${MONGO_URI}?`)
    process.exit(1)
  })
}
