// Vercel serverless entry: the same Express app, with one MongoDB connection reused across warm invocations.
import mongoose from 'mongoose'
import { app } from '../server/index.js'

let connecting

export default async function handler(req, res) {
  connecting ??= mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  try {
    await connecting
  } catch (err) {
    connecting = undefined
    console.error('MongoDB connection failed:', err.message)
    res.writeHead(503, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Database unavailable, try again shortly' }))
  }
  return app(req, res)
}
