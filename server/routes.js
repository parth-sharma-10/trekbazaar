import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import express from 'express'
import { newBookingId, priceBreakdown } from '../src/lib.ts'
import { Booking, Trek, User } from './models.js'

const opts = { returnDocument: 'after', runValidators: true }

function notFound(res, what) {
  return res.status(404).json({ error: `${what} not found` })
}

// ---------- Treks ----------
export const treks = express.Router()

treks.get('/', async (req, res) => {
  const filter = {}
  if (req.query.state) filter.state = req.query.state
  if (req.query.difficulty) filter.difficulty = req.query.difficulty
  if (req.query.operatorId) filter.operatorId = req.query.operatorId
  res.json(await Trek.find(filter).sort({ createdAt: 1 }))
})

treks.get('/:id', async (req, res) => {
  const trek = await Trek.findOne({ id: req.params.id })
  if (!trek) return notFound(res, 'Trek')
  res.json(trek)
})

treks.post('/', async (req, res) => {
  const trek = await Trek.create({ ...req.body, id: req.body.id || `c${Date.now()}` })
  res.status(201).json(trek)
})

treks.put('/:id', async (req, res) => {
  const { id: _ignored, ...patch } = req.body
  const trek = await Trek.findOneAndUpdate({ id: req.params.id }, patch, opts)
  if (!trek) return notFound(res, 'Trek')
  res.json(trek)
})

treks.delete('/:id', async (req, res) => {
  const active = await Booking.countDocuments({ trekId: req.params.id, status: { $in: ['Confirmed', 'Pending'] } })
  if (active > 0) {
    return res.status(409).json({ error: `Trek has ${active} active booking(s); cancel them before deleting` })
  }
  const trek = await Trek.findOneAndDelete({ id: req.params.id })
  if (!trek) return notFound(res, 'Trek')
  res.json({ message: 'Trek deleted', id: trek.id })
})

// ---------- Bookings ----------
export const bookings = express.Router()

bookings.get('/', async (req, res) => {
  const filter = {}
  if (req.query.email) filter.email = String(req.query.email).toLowerCase()
  if (req.query.status) filter.status = req.query.status
  res.json(await Booking.find(filter).sort({ createdAt: -1 }))
})

bookings.get('/:id', async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id })
  if (!booking) return notFound(res, 'Booking')
  res.json(booking)
})

bookings.post('/', async (req, res) => {
  const trek = await Trek.findOne({ id: req.body.trekId })
  if (!trek) return res.status(400).json({ error: `Unknown trek "${req.body.trekId}"` })
  // The amount is recomputed here so a client cannot book at a price it made up.
  const participants = Number(req.body.participants)
  const booking = await Booking.create({
    ...req.body,
    id: newBookingId(),
    participants,
    amount: priceBreakdown(trek.price, participants).total,
  })
  res.status(201).json(booking)
})

const allowedTransitions = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Cancelled', 'Completed'],
  Completed: [],
  Cancelled: [],
}

bookings.patch('/:id', async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id })
  if (!booking) return notFound(res, 'Booking')
  const { status } = req.body
  if (!allowedTransitions[booking.status].includes(status)) {
    return res.status(400).json({ error: `Cannot change a ${booking.status} booking to ${status}` })
  }
  booking.status = status
  res.json(await booking.save())
})

bookings.delete('/:id', async (req, res) => {
  const booking = await Booking.findOneAndDelete({ id: req.params.id })
  if (!booking) return notFound(res, 'Booking')
  res.json({ message: 'Booking deleted', id: booking.id })
})

// ---------- Users ----------
export const users = express.Router()

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64))
}

users.post('/register', async (req, res) => {
  const { password = '', ...profile } = req.body
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  if (profile.role === 'admin') return res.status(403).json({ error: 'Admin accounts cannot be self-registered' })
  const user = await User.create({ ...profile, id: `u${Date.now()}`, passwordHash: hashPassword(password) })
  res.status(201).json(user)
})

users.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase().trim() })
  if (!user || !checkPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password' })
  }
  res.json(user)
})

users.get('/', async (req, res) => {
  res.json(await User.find().sort({ createdAt: 1 }))
})

users.put('/:id', async (req, res) => {
  const { name, phone, city, bio, email } = req.body
  const user = await User.findOneAndUpdate({ id: req.params.id }, { name, phone, city, bio, email }, { ...opts, omitUndefined: true })
  if (!user) return notFound(res, 'User')
  res.json(user)
})
