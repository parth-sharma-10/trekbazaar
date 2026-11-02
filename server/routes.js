import express from 'express'
import { MAX_PARTICIPANTS, newBookingId, priceBreakdown, today } from '../src/pricing.js'
import { checkPassword, hashPassword, issueToken, requireLogin, requireRole } from './auth.js'
import { Booking, LoginFailure, Review, Trek, User } from './models.js'

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

const ACTIVE = ['Pending', 'Confirmed']

// Rating and review count come from approved reviews, and each future departure gets its seats
// left from active bookings, so neither can drift from the data or be set by hand.
async function present(trekDocs) {
  const ids = trekDocs.map(t => t.id)
  const [ratings, booked] = await Promise.all([
    Review.aggregate([
      { $match: { trekId: { $in: ids }, status: 'Approved' } },
      { $group: { _id: '$trekId', rating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { trekId: { $in: ids }, status: { $in: ACTIVE } } },
      { $group: { _id: { trekId: '$trekId', date: '$date' }, participants: { $sum: '$participants' } } },
    ]),
  ])
  const ratingOf = new Map(ratings.map(r => [r._id, r]))
  const bookedOn = new Map(booked.map(b => [`${b._id.trekId}|${b._id.date}`, b.participants]))
  const from = today()
  return trekDocs.map(doc => {
    const trek = doc.toJSON()
    const r = ratingOf.get(trek.id)
    trek.rating = r ? Math.round(r.rating * 10) / 10 : 0
    trek.reviewCount = r?.count ?? 0
    trek.departures = (trek.departures ?? [])
      .filter(d => d.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, seatsLeft: Math.max(0, d.seats - (bookedOn.get(`${trek.id}|${d.date}`) ?? 0)) }))
    return trek
  })
}

treks.get('/', async (req, res) => {
  const filter = {}
  if (req.query.state) filter.state = String(req.query.state)
  if (req.query.difficulty) filter.difficulty = String(req.query.difficulty)
  if (req.query.operatorId) filter.operatorId = String(req.query.operatorId)
  res.json(await present(await Trek.find(filter).sort({ createdAt: 1 })))
})

treks.get('/:id', async (req, res) => {
  const trek = await Trek.findOne({ id: req.params.id })
  if (!trek) return notFound(res, 'Trek')
  res.json((await present([trek]))[0])
})

const trekFields = [
  'title', 'location', 'state', 'difficulty', 'duration', 'durationDays', 'price', 'maxAltitude',
  'bestMonths', 'image', 'gallery', 'tags', 'description', 'highlights', 'itinerary', 'inclusions',
  'exclusions', 'meetingPoint', 'groupSize', 'departures',
]
// Only an admin may reassign a trek to another operator.
const adminTrekFields = [...trekFields, 'operator', 'operatorId']

const trekFieldsFor = user => (user.role === 'admin' ? adminTrekFields : trekFields)
const ownsTrek = (user, trek) => user.role === 'admin' || trek.operatorId === user.id

treks.post('/', requireRole('operator', 'admin'), async (req, res) => {
  if (req.user.role === 'operator' && !req.user.verified) {
    return res.status(403).json({ error: 'Your operator account is awaiting verification by an admin' })
  }
  const fields = pick(req.body, trekFieldsFor(req.user))
  const owner = req.user.role === 'operator' ? { operator: req.user.name, operatorId: req.user.id } : {}
  const trek = await Trek.create({ ...fields, ...owner, id: `c${Date.now()}` })
  res.status(201).json((await present([trek]))[0])
})

treks.put('/:id', requireRole('operator', 'admin'), async (req, res) => {
  const existing = await Trek.findOne({ id: req.params.id })
  if (!existing) return notFound(res, 'Trek')
  if (!ownsTrek(req.user, existing)) return forbidden(res)
  if (Array.isArray(req.body.departures)) {
    const [current] = await present([existing])
    for (const d of current.departures) {
      const booked = d.seats - d.seatsLeft
      const next = req.body.departures.find(n => n?.date === d.date)
      if (booked > 0 && !(Number(next?.seats) >= booked)) {
        return res.status(409).json({ error: `${d.date} already has ${booked} seat(s) booked; it needs at least that many seats` })
      }
    }
  }
  const trek = await Trek.findOneAndUpdate({ id: req.params.id }, pick(req.body, trekFieldsFor(req.user)), opts)
  res.json((await present([trek]))[0])
})

treks.delete('/:id', requireRole('operator', 'admin'), async (req, res) => {
  const existing = await Trek.findOne({ id: req.params.id })
  if (!existing) return notFound(res, 'Trek')
  if (!ownsTrek(req.user, existing)) return forbidden(res)
  const active = await Booking.countDocuments({ trekId: req.params.id, status: { $in: ACTIVE } })
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

// No payment is taken: a booking is a request that starts Pending until the operator confirms it.
bookings.post('/', requireRole('user'), async (req, res) => {
  const trekId = String(req.body.trekId)
  const trekDoc = await Trek.findOne({ id: trekId })
  if (!trekDoc) return res.status(400).json({ error: `Unknown trek "${trekId}"` })
  const [trek] = await present([trekDoc])
  const participants = Number(req.body.participants)
  if (!Number.isInteger(participants) || participants < 1 || participants > MAX_PARTICIPANTS) {
    return res.status(400).json({ error: `Participants must be between 1 and ${MAX_PARTICIPANTS}` })
  }
  const date = String(req.body.date)
  const departure = trek.departures.find(d => d.date === date)
  if (!departure) return res.status(400).json({ error: 'Pick one of the scheduled departure dates' })
  // ponytail: check-then-insert, so two simultaneous requests can overfill a departure by one booking.
  // Move to a per-departure counter with $inc if traffic ever makes that likely.
  if (participants > departure.seatsLeft) {
    return res.status(409).json({ error: `Only ${departure.seatsLeft} seat(s) left on ${date}` })
  }
  // The amount is recomputed here so a client cannot book at a price it made up.
  const booking = await Booking.create({
    ...pick(req.body, ['traveller', 'phone', 'emergencyContact', 'medicalInfo']),
    date,
    trekId,
    email: req.user.email,
    id: newBookingId(),
    participants,
    amount: priceBreakdown(trek.price, participants).total,
    status: 'Pending',
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

// Email is not editable: bookings are tied to the account by it.
const profileFields = ['name', 'phone', 'city', 'bio']
const registerFields = [...profileFields, 'email']
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
  const user = await User.create({ ...pick(req.body, registerFields), role, id: `u${Date.now()}`, passwordHash: hashPassword(password) })
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
  if (user.suspended) return res.status(403).json({ error: 'This account is suspended' })
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

// The signed-in account as stored now, so a role, verification or suspension change shows without re-login.
users.get('/me', requireLogin, (req, res) => res.json(req.user))

users.get('/', requireRole('admin'), async (req, res) => {
  res.json(await User.find().sort({ createdAt: 1 }))
})

// Anyone may edit their own profile. Only an admin may edit someone else's, or change a role,
// verification or suspension, and never on their own account, so an admin cannot lock themselves out.
const adminOnlyFields = ['role', 'verified', 'suspended']

users.put('/:id', requireLogin, async (req, res) => {
  const isSelf = req.params.id === req.user.id
  if (!isSelf && req.user.role !== 'admin') return forbidden(res)
  const patch = pick(req.body, profileFields)
  const adminPatch = pick(req.body, adminOnlyFields)
  if (Object.keys(adminPatch).length) {
    if (isSelf || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You cannot change your own role, verification or suspension' })
    }
    Object.assign(patch, adminPatch)
  }
  const user = await User.findOneAndUpdate({ id: req.params.id }, patch, opts)
  if (!user) return notFound(res, 'User')
  res.json(user)
})

// Admins only, and never themselves. The user's bookings stay as a record of what was sold.
users.delete('/:id', requireRole('admin'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(403).json({ error: 'You cannot delete your own account' })
  const user = await User.findOneAndDelete({ id: req.params.id })
  if (!user) return notFound(res, 'User')
  await LoginFailure.deleteMany({ email: user.email })
  res.json({ message: 'User deleted', id: user.id })
})

// ---------- Reviews ----------
export const reviews = express.Router()

// Everyone sees approved reviews. An admin sees every review; `?mine=1` returns the caller's own.
reviews.get('/', async (req, res) => {
  const filter = {}
  if (req.query.trekId) filter.trekId = String(req.query.trekId)
  if (req.user?.role === 'admin') {
    if (req.query.status) filter.status = String(req.query.status)
  } else if (req.query.mine && req.user) {
    filter.userId = req.user.id
  } else {
    filter.status = 'Approved'
  }
  res.json(await Review.find(filter).sort({ createdAt: -1 }))
})

// Only someone who completed the trek may review it, once.
reviews.post('/', requireRole('user'), async (req, res) => {
  const trekId = String(req.body.trekId)
  const completed = await Booking.exists({ trekId, email: req.user.email, status: 'Completed' })
  if (!completed) return res.status(403).json({ error: 'You can review a trek after completing it' })
  const review = await Review.create({
    id: `r${Date.now()}`,
    trekId,
    userId: req.user.id,
    userName: req.user.name,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  })
  res.status(201).json(review)
})

reviews.patch('/:id', requireRole('admin'), async (req, res) => {
  const { status } = req.body
  if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Status must be Approved or Rejected' })
  const review = await Review.findOneAndUpdate({ id: req.params.id }, { status }, opts)
  if (!review) return notFound(res, 'Review')
  res.json(review)
})
