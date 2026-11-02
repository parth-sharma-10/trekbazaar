import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { User } from './models.js'

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000

// Every serverless instance must sign with the same key, so production refuses to guess one.
// Locally a random key is fine: tokens just stop working when the server restarts.
const SECRET = process.env.AUTH_SECRET ?? (process.env.VERCEL ? null : randomBytes(32).toString('hex'))
if (!SECRET) throw new Error('AUTH_SECRET is not set. Add it to the Vercel project environment.')

const sign = payload => createHmac('sha256', SECRET).update(payload).digest('base64url')

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

// Hashing a throwaway value for unknown emails keeps login timing from revealing who has an account.
const DUMMY_HASH = hashPassword(randomBytes(16).toString('hex'))

export function checkPassword(password, stored = DUMMY_HASH) {
  const [salt, hash] = stored.split(':')
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64))
}

// A minimal signed token, "<base64url payload>.<hmac>". Only the user id is trusted from it;
// the role is re-read from the database on every request so a role change applies immediately.
export function issueToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readToken(token) {
  const [payload, signature = ''] = token.split('.')
  const expected = sign(payload)
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const { sub, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
  return typeof sub === 'string' && exp > Date.now() ? sub : null
}

// Attaches req.user when a valid Bearer token is sent. No token = anonymous; a bad token = 401.
export async function authenticate(req, res, next) {
  const header = req.get('authorization') ?? ''
  if (!header) return next()
  const userId = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null
  req.user = userId ? await User.findOne({ id: userId }) : null
  if (!req.user) return res.status(401).json({ error: 'Your session has expired. Log in again.' })
  if (req.user.suspended) return res.status(403).json({ error: 'This account is suspended' })
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Log in to continue' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to do this' })
    next()
  }
}

export const requireLogin = requireRole('user', 'operator', 'admin')
