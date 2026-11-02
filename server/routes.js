import express from 'express'
import { newBookingId, priceBreakdown } from '../src/pricing.js'
import { checkPassword, hashPassword, issueToken, requireLogin, requireRole } from './auth.js'
import { Booking, LoginFailure, Trek, User } from './models.js'

const opts = { returnDocument: 'after', runValidators: true }

function notFound(res, what) {
  return res.status(404).json({ error: `${what} not found` })
}

// Request bodies are copied field by field so a client cannot set ids, owners, ratings or
// Mongo update operators ($set, $unset) it was never meant to control.
function pick(body, fields) {
  return Object.fromEntries(fields.filter(f => body[f] !== undefined).map(f => [f, body[f]]))
}

const forbidden = res => res.status(403).json({ error: 'You do not have permission to do this' })

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

const trekFields = [
  'title', 'location', 'state', 'difficulty', 'duration', 'durationDays', 'price', 'maxAltitude',
  'bestMonths', 'image', 'gallery', 'tags', 'description', 'highlights', 'itinerary', 'inclusions',
  'exclusions', 'meetingPoint', 'groupSize',
]
// Only an admin may reassign a trek to another operator or correct its rating.
const adminTrekFields = [...trekFields, 'operator', 'operatorId', 'rating', 'reviewCount']

const trekFieldsFor = user => (user.role === 'admin' ? adminTrekFields : trekFields)
const ownsTrek = (user, trek) => user.role === 'admin' || trek.operatorId === user.id

treks.post('/', requireRole('operator', 'admin'), async (req, res) => {
  const fields = pick(req.body, trekFieldsFor(req.user))
  const owner = req.user.role === 'operator' ? { operator: req.user.name, operatorId: req.user.id } : {}
  const trek = await Trek.create({ ...fields, ...owner, id: `c${Date.now()}` })
  res.status(201).json(trek)
})

treks.put('/:id', requireRole('operator', 'admin'), async (req, res) => {
  const existing = await Trek.findOne({ id: req.params.id })
  if (!existing) return notFound(res, 'Trek')
  if (!ownsTrek(req.user, existing)) return forbidden(res)
  const trek = await Trek.findOneAndUpdate({ id: req.params.id }, pick(req.body, trekFieldsFor(req.user)), opts)
  res.json(trek)
})

treks.delete('/:id', requireRole('operator', 'admin'), async (req, res) => {
  const existing = await Trek.findOne({ id: req.params.id })
  if (!existing) return notFound(res, 'Trek')
  if (!ownsTrek(req.user, existing)) return forbidden(res)
  const active = await Booking.countDocuments({ trekId: req.params.id, status: { $in: ['Confirmed', 'Pending'] } })
  if (active > 0) {
    return res.status(409).json({ error: `Trek has ${active} active booking(s); cancel them before deleting` })
  }
  await existing.deleteOne()
  res.json({ message: 'Trek deleted', id: existing.id })
})

// ---------- Bookings ----------
export const bookings = express.Router()

bookings.use(requireLogin)

// The bookings each role may see: a trekker their own, an operator those on their treks, an admin all.
async function visibleBookings(user) {
  if (user.role === 'admin') return {}
  if (user.role === 'operator') return { trekId: { $in: await Trek.distinct('id', { operatorId: user.id }) } }
  return { email: user.email }
}

bookings.get('/', async (req, res) => {
  const filter = {}
  if (req.query.email) filter.email = String(req.query.email).toLowerCase()
  if (req.query.status) filter.status = String(req.query.status)
  // The scope is spread last so a query parameter cannot widen it.
  res.json(await Booking.find({ ...filter, ...(await visibleBookings(req.user)) }).sort({ createdAt: -1 }))
})

// Out-of-scope bookings answer 404, not 403, so ids belonging to others cannot be probed.
bookings.get('/:id', async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id, ...(await visibleBookings(req.user)) })
  if (!booking) return notFound(res, 'Booking')
  res.json(booking)
})

bookings.post('/', requireRole('user'), async (req, res) => {
  const trekId = String(req.body.trekId)
  const trek = await Trek.findOne({ id: trekId })
  if (!trek) return res.status(400).json({ error: `Unknown trek "${trekId}"` })
  // The amount is recomputed here so a client cannot book at a price it made up.
  const participants = Number(req.body.participants)
  const booking = await Booking.create({
    ...pick(req.body, ['date', 'traveller']),
    trekId,
    email: req.user.email,
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

// A trekker may only cancel; confirming or completing a trip is the operator's (or an admin's) call.
const statusesFor = { user: ['Cancelled'], operator: ['Confirmed', 'Cancelled', 'Completed'], admin: ['Confirmed', 'Cancelled', 'Completed'] }

bookings.patch('/:id', async (req, res) => {
  const booking = await Booking.findOne({ id: req.params.id, ...(await visibleBookings(req.user)) })
  if (!booking) return notFound(res, 'Booking')
  const { status } = req.body
  if (!statusesFor[req.user.role].includes(status)) return forbidden(res)
  if (!allowedTransitions[booking.status].includes(status)) {
    return res.status(400).json({ error: `Cannot change a ${booking.status} booking to ${status}` })
  }
  booking.status = status
  res.json(await booking.save())
})

bookings.delete('/:id', requireRole('admin'), async (req, res) => {
  const booking = await Booking.findOneAndDelete({ id: req.params.id })
  if (!booking) return notFound(res, 'Booking')
  res.json({ message: 'Booking deleted', id: booking.id })
})

// ---------- Users ----------
export const users = express.Router()

const profileFields = ['name', 'email', 'phone', 'city', 'bio']
const MAX_LOGIN_FAILURES = 5

const session = user => ({ user, token: issueToken(user) })

function passwordProblem(password) {
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 128) return 'Password must be at most 128 characters'
  return null
}

users.post('/register', async (req, res) => {
  const password = String(req.body.password ?? '')
  const problem = passwordProblem(password)
  if (problem) return res.status(400).json({ error: problem })
  if (req.body.role === 'admin') return res.status(403).json({ error: 'Admin accounts cannot be self-registered' })
  const role = req.body.role === 'operator' ? 'operator' : 'user'
  const user = await User.create({ ...pick(req.body, profileFields), role, id: `u${Date.now()}`, passwordHash: hashPassword(password) })
  res.status(201).json(session(user))
})

users.post('/login', async (req, res) => {
  const email = String(req.body.email ?? '').toLowerCase().trim()
  const password = String(req.body.password ?? '').slice(0, 128)
  if (await LoginFailure.countDocuments({ email }) >= MAX_LOGIN_FAILURES) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' })
  }
  const user = await User.findOne({ email })
  if (!checkPassword(password, user?.passwordHash) || !user) {
    await LoginFailure.create({ email })
    return res.status(401).json({ error: 'Incorrect email or password' })
  }
  await LoginFailure.deleteMany({ email })
  res.json(session(user))
})

// A wrong current password answers 400, not 401: the session itself is still valid. Failures count
// toward the same lockout as login so a stolen token cannot be used to guess the password.
users.post('/me/password', requireLogin, async (req, res) => {
  const { email } = req.user
  if (await LoginFailure.countDocuments({ email }) >= MAX_LOGIN_FAILURES) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' })
  }
  if (!checkPassword(String(req.body.currentPassword ?? '').slice(0, 128), req.user.passwordHash)) {
    await LoginFailure.create({ email })
    return res.status(400).json({ error: 'Current password is incorrect' })
  }
  const next = String(req.body.newPassword ?? '')
  const problem = passwordProblem(next)
  if (problem) return res.status(400).json({ error: problem })
  req.user.passwordHash = hashPassword(next)
  await req.user.save()
  await LoginFailure.deleteMany({ email })
  res.json({ message: 'Password updated' })
})

users.get('/', requireRole('admin'), async (req, res) => {
  res.json(await User.find().sort({ createdAt: 1 }))
})

// Anyone may edit their own profile; only an admin may edit someone else's or change a role,
// and never their own role, so the last admin cannot lock everyone out by accident.
users.put('/:id', requireLogin, async (req, res) => {
  const isSelf = req.params.id === req.user.id
  if (!isSelf && req.user.role !== 'admin') return forbidden(res)
  const patch = pick(req.body, profileFields)
  if (req.body.role !== undefined) {
    if (isSelf) return res.status(403).json({ error: 'You cannot change your own role' })
    patch.role = req.body.role
  }
  const user = await User.findOneAndUpdate({ id: req.params.id }, patch, opts)
  if (!user) return notFound(res, 'User')
  res.json(user)
})
