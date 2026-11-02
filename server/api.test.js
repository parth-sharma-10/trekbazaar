// Integration tests against a real MongoDB (database trekbazaar_test, wiped before the run).
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { start } from './index.js'
import { DEMO_PASSWORD, seed } from './seed.js'

let server
let base
const tokens = {}
const firstDeparture = {} // trekId -> its first scheduled departure; each trek has its own season

before(async () => {
  server = await start(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/trekbazaar_test', 0)
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
  await seed()
  tokens.user = await loginAs('rahul.kumar@example.com')
  tokens.operator = await loginAs('operator@trekbazaar.in')
  tokens.admin = await loginAs('admin@trekbazaar.in')
  const other = await call('POST', '/users/register', { name: 'Other Op', email: 'other.op@example.com', password: 'longenough', role: 'operator' })
  tokens.otherOperator = other.body.token
  for (const t of (await call('GET', '/treks')).body) firstDeparture[t.id] = t.departures[0]?.date
})

after(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  server.close()
})

async function call(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: res.status, body: await res.json() }
}

async function loginAs(email, password = DEMO_PASSWORD) {
  const res = await call('POST', '/users/login', { email, password })
  assert.equal(res.status, 200, `login ${email}`)
  return res.body.token
}


const newTrek = {
  title: 'Test Ridge Trek',
  location: 'Kullu',
  state: 'Himachal Pradesh',
  difficulty: 'Moderate',
  duration: '4 Days',
  durationDays: 4,
  price: 6000,
  maxAltitude: '3800m',
  image: 'https://example.com/a.jpg',
  description: 'A short test trek used only by the integration tests.',
}

const booking = (trekId = '1') => ({ trekId, date: firstDeparture[trekId], participants: 2, traveller: 'A B' })
// Treks the seed assigns to op1 (Himalayan Treks Co.), the operator the tests log in as.
const OP1_TREKS = ['1', '4', '12', '14', '15']

test('treks: operator creates, reads, updates and deletes their own trek', async () => {
  const created = await call('POST', '/treks', { ...newTrek, operatorId: 'someone-else', rating: 5 }, tokens.operator)
  assert.equal(created.status, 201)
  assert.equal(created.body._id, undefined, '_id must not leak')
  assert.equal(created.body.operatorId, 'op1', 'owner comes from the session, not the body')
  assert.equal(created.body.rating, 0, 'nobody can set a rating by hand')
  const { id } = created.body

  assert.equal((await call('GET', `/treks/${id}`)).body.title, 'Test Ridge Trek')
  assert.ok((await call('GET', '/treks')).body.some(t => t.id === id))

  const updated = await call('PUT', `/treks/${id}`, { price: 6500, operatorId: 'x', $unset: { title: 1 } }, tokens.operator)
  assert.equal(updated.body.price, 6500)
  assert.equal(updated.body.operatorId, 'op1')
  assert.equal(updated.body.title, 'Test Ridge Trek')

  assert.equal((await call('DELETE', `/treks/${id}`, undefined, tokens.operator)).status, 200)
  assert.equal((await call('GET', `/treks/${id}`)).status, 404)
})

test('treks: guests, trekkers and other operators cannot write', async () => {
  assert.equal((await call('POST', '/treks', newTrek)).status, 401)
  assert.equal((await call('POST', '/treks', newTrek, tokens.user)).status, 403)
  assert.equal((await call('PUT', '/treks/1', { price: 999999 })).status, 401)
  assert.equal((await call('PUT', '/treks/1', { price: 999999 }, tokens.user)).status, 403)
  assert.equal((await call('PUT', '/treks/1', { price: 999999 }, tokens.otherOperator)).status, 403)
  assert.equal((await call('DELETE', '/treks/1', undefined, tokens.otherOperator)).status, 403)
  assert.notEqual((await call('GET', '/treks/1')).body.price, 999999)
})

test('treks: admin can edit any trek, but not its rating', async () => {
  const res = await call('PUT', '/treks/2', { price: 9000, rating: 4.2, reviewCount: 99 }, tokens.admin)
  assert.equal(res.status, 200)
  assert.equal(res.body.price, 9000)
  assert.equal(res.body.rating, 0)
  assert.equal(res.body.reviewCount, 0)
})

test('treks: departures are owner-managed, past ones hidden, seats counted from bookings', async () => {
  const original = (await call('GET', '/treks/4')).body.departures.map(({ date, seats }) => ({ date, seats }))
  const dates = ['2020-01-01', '2099-03-01', '2099-02-01']
  const res = await call('PUT', '/treks/4', { departures: dates.map(date => ({ date, seats: 3 })) }, tokens.operator)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.departures.map(d => d.date), ['2099-02-01', '2099-03-01'], 'sorted, past dropped')
  assert.equal((await call('PUT', '/treks/4', { departures: [] }, tokens.otherOperator)).status, 403)

  const pick = { trekId: '4', date: '2099-02-01', traveller: 'A B' }
  assert.equal((await call('POST', '/bookings', { ...pick, date: '2099-02-02', participants: 1 }, tokens.user)).status, 400)
  assert.equal((await call('POST', '/bookings', { ...pick, date: '2020-01-01', participants: 1 }, tokens.user)).status, 400)
  assert.equal((await call('POST', '/bookings', { ...pick, participants: 2 }, tokens.user)).status, 201)
  assert.equal((await call('GET', '/treks/4')).body.departures[0].seatsLeft, 1)
  assert.equal((await call('POST', '/bookings', { ...pick, participants: 2 }, tokens.user)).status, 409, 'overfull')
  const shrink = [{ date: '2099-02-01', seats: 1 }, { date: '2099-03-01', seats: 3 }]
  assert.equal((await call('PUT', '/treks/4', { departures: shrink }, tokens.operator)).status, 409, 'cannot go below booked seats')
  assert.equal((await call('PUT', '/treks/4', { departures: [{ date: '2099-03-01', seats: 3 }] }, tokens.operator)).status, 409, 'cannot drop a booked date')
  await call('PUT', '/treks/4', { departures: [...original, { date: '2099-02-01', seats: 2 }] }, tokens.operator)
})

test('treks: schema validation returns 400 with the field message', async () => {
  const res = await call('POST', '/treks', { ...newTrek, price: 100 }, tokens.operator)
  assert.equal(res.status, 400)
  assert.match(res.body.error, /at least ₹500/)
})

test('treks: cannot delete a trek with active bookings', async () => {
  const res = await call('DELETE', '/treks/1', undefined, tokens.admin)
  assert.equal(res.status, 409)
  assert.equal((await call('GET', '/treks/1')).status, 200)
})

test('bookings: server recomputes the amount, owner and status', async () => {
  const res = await call('POST', '/bookings', { ...booking(), amount: 1, email: 'victim@example.com', status: 'Completed' }, tokens.user)
  assert.equal(res.status, 201)
  assert.equal(res.body.amount, 30450) // 14500 x 2 + 5% fee
  assert.equal(res.body.email, 'rahul.kumar@example.com')
  assert.equal(res.body.status, 'Pending', 'a booking is a request until the operator confirms')
  assert.match(res.body.id, /^TB-\d{4}-\d{6}$/)

  assert.equal((await call('POST', '/bookings', booking('nope'), tokens.user)).status, 400)
  assert.equal((await call('POST', '/bookings', { ...booking(), trekId: { $ne: null } }, tokens.user)).status, 400)
  assert.equal((await call('POST', '/bookings', { ...booking(), participants: 40 }, tokens.user)).status, 400)
})

test('bookings: guests and staff cannot book', async () => {
  assert.equal((await call('POST', '/bookings', booking())).status, 401)
  assert.equal((await call('POST', '/bookings', booking(), tokens.operator)).status, 403)
  assert.equal((await call('GET', '/bookings')).status, 401)
})

test('bookings: each role sees only its own scope', async () => {
  const stranger = await call('POST', '/users/register', { name: 'Stranger', email: 'stranger@example.com', password: 'longenough' })
  const mine = await call('POST', '/bookings', booking('4'), stranger.body.token)

  const seenByUser = (await call('GET', '/bookings', undefined, tokens.user)).body
  assert.ok(seenByUser.length > 0)
  assert.ok(seenByUser.every(b => b.email === 'rahul.kumar@example.com'))
  const widened = (await call('GET', '/bookings?email=stranger@example.com', undefined, tokens.user)).body
  assert.ok(widened.every(b => b.email === 'rahul.kumar@example.com'), 'a query parameter cannot widen the scope')
  assert.equal((await call('GET', `/bookings/${mine.body.id}`, undefined, tokens.user)).status, 404)

  const seenByOperator = (await call('GET', '/bookings', undefined, tokens.operator)).body
  assert.ok(seenByOperator.some(b => b.id === mine.body.id), 'trek 4 belongs to op1')
  assert.ok(seenByOperator.every(b => OP1_TREKS.includes(b.trekId)), 'op1 sees only bookings on its treks')
  assert.equal((await call('GET', '/bookings', undefined, tokens.otherOperator)).body.length, 0)

  assert.ok((await call('GET', '/bookings', undefined, tokens.admin)).body.length >= seenByOperator.length)
})

test('bookings: trekkers may only cancel; operators confirm; only admins delete', async () => {
  const { body } = await call('POST', '/bookings', booking('4'), tokens.user)
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Completed' }, tokens.user)).status, 403)
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Cancelled' }, tokens.otherOperator)).status, 404)
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Cancelled' }, tokens.user)).body.status, 'Cancelled')
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Confirmed' }, tokens.operator)).status, 400)

  assert.equal((await call('DELETE', `/bookings/${body.id}`, undefined, tokens.user)).status, 403)
  assert.equal((await call('DELETE', `/bookings/${body.id}`, undefined, tokens.operator)).status, 403)
  assert.equal((await call('DELETE', `/bookings/${body.id}`, undefined, tokens.admin)).status, 200)
  assert.equal((await call('GET', `/bookings/${body.id}`, undefined, tokens.admin)).status, 404)
})

test('users: register, duplicate email, login, wrong password, profile update', async () => {
  const reg = await call('POST', '/users/register', { name: 'New User', email: 'New@Example.com', password: 'longenough', passwordHash: 'x', id: 'admin1' })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.user.passwordHash, undefined, 'hash must not leak')
  assert.equal(reg.body.user.email, 'new@example.com')
  assert.notEqual(reg.body.user.id, 'admin1')
  assert.ok(reg.body.token)

  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'new@example.com', password: 'longenough' })).status, 409)
  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'x@example.com', password: 'short' })).status, 400)
  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'y@example.com', password: 'longenough', role: 'admin' })).status, 403)

  assert.equal((await call('POST', '/users/login', { email: 'rahul.kumar@example.com', password: DEMO_PASSWORD })).body.user.role, 'user')
  assert.equal((await call('POST', '/users/login', { email: 'rahul.kumar@example.com', password: 'wrong-pass' })).status, 401)
  assert.equal((await call('POST', '/users/login', { email: 'nobody@example.com', password: 'wrong-pass' })).status, 401)

  const put = await call('PUT', `/users/${reg.body.user.id}`, { city: 'Pune' }, reg.body.token)
  assert.equal(put.body.city, 'Pune')
  assert.equal(put.body.name, 'New User')
})

test('users: profiles and roles are protected', async () => {
  assert.equal((await call('GET', '/users')).status, 401)
  assert.equal((await call('GET', '/users', undefined, tokens.user)).status, 403)
  assert.equal((await call('GET', '/users', undefined, tokens.operator)).status, 403)
  assert.equal((await call('GET', '/users', undefined, tokens.admin)).status, 200)

  assert.equal((await call('PUT', '/users/u1', { role: 'admin' }, tokens.user)).status, 403, 'no self-promotion')
  assert.equal((await call('PUT', '/users/op1', { city: 'X' }, tokens.user)).status, 403)
  assert.equal((await call('PUT', '/users/u1', { city: 'X' })).status, 401)
  assert.equal((await call('PUT', '/users/admin1', { role: 'user' }, tokens.admin)).status, 403, 'admin cannot demote self')

  const reg = await call('POST', '/users/register', { name: 'Promote Me', email: 'promote@example.com', password: 'longenough' })
  const promoted = await call('PUT', `/users/${reg.body.user.id}`, { role: 'operator', verified: true }, tokens.admin)
  assert.equal(promoted.body.role, 'operator')
  // The role is read from the database per request, so the old token already has the new rights.
  assert.equal((await call('POST', '/treks', newTrek, reg.body.token)).status, 201)
})

test('users: change password needs the current one and replaces the old', async () => {
  const reg = await call('POST', '/users/register', { name: 'Pw', email: 'pw@example.com', password: 'first-pass' })
  const { token } = reg.body
  assert.equal((await call('POST', '/users/me/password', { currentPassword: 'x', newPassword: 'second-pass' })).status, 401)
  assert.equal((await call('POST', '/users/me/password', { currentPassword: 'wrong-pass', newPassword: 'second-pass' }, token)).status, 400)
  assert.equal((await call('POST', '/users/me/password', { currentPassword: 'first-pass', newPassword: 'short' }, token)).status, 400)
  assert.equal((await call('POST', '/users/me/password', { currentPassword: 'first-pass', newPassword: 'second-pass' }, token)).status, 200)
  assert.equal((await call('POST', '/users/login', { email: 'pw@example.com', password: 'first-pass' })).status, 401)
  assert.equal((await call('POST', '/users/login', { email: 'pw@example.com', password: 'second-pass' })).status, 200)
})

test('users: only an admin deletes accounts, and never their own', async () => {
  const reg = await call('POST', '/users/register', { name: 'Gone', email: 'gone@example.com', password: 'longenough' })
  const { id } = reg.body.user
  assert.equal((await call('DELETE', `/users/${id}`)).status, 401)
  assert.equal((await call('DELETE', `/users/${id}`, undefined, tokens.user)).status, 403)
  assert.equal((await call('DELETE', `/users/${id}`, undefined, tokens.operator)).status, 403)
  assert.equal((await call('DELETE', '/users/admin1', undefined, tokens.admin)).status, 403)
  assert.equal((await call('DELETE', `/users/${id}`, undefined, tokens.admin)).status, 200)
  assert.equal((await call('POST', '/users/login', { email: 'gone@example.com', password: 'longenough' })).status, 401)
  assert.equal((await call('DELETE', `/users/${id}`, undefined, tokens.admin)).status, 404)
})

test('operators: unverified ones cannot publish until an admin verifies them', async () => {
  const reg = await call('POST', '/users/register', { name: 'New Op', email: 'newop@example.com', password: 'longenough', role: 'operator' })
  const { token, user } = reg.body
  assert.equal(user.verified, false)
  assert.equal((await call('POST', '/treks', newTrek, token)).status, 403)
  assert.equal((await call('PUT', `/users/${user.id}`, { verified: true }, token)).status, 403, 'no self-verification')
  assert.equal((await call('PUT', `/users/${user.id}`, { verified: true }, tokens.operator)).status, 403)
  assert.equal((await call('PUT', `/users/${user.id}`, { verified: true }, tokens.admin)).body.verified, true)
  assert.equal((await call('POST', '/treks', newTrek, token)).status, 201)
})

test('users: /me returns the current account and needs a session', async () => {
  assert.equal((await call('GET', '/users/me')).status, 401)
  const me = await call('GET', '/users/me', undefined, tokens.operator)
  assert.equal(me.body.id, 'op1')
  assert.equal(me.body.verified, true)
  assert.equal(me.body.passwordHash, undefined)
})

test('users: suspended accounts cannot log in or use old tokens', async () => {
  const reg = await call('POST', '/users/register', { name: 'Sus', email: 'sus@example.com', password: 'longenough' })
  const { token, user } = reg.body
  assert.equal((await call('PUT', `/users/${user.id}`, { suspended: false }, token)).status, 403)
  assert.equal((await call('PUT', `/users/${user.id}`, { suspended: true }, tokens.admin)).body.suspended, true)
  assert.equal((await call('GET', '/bookings', undefined, token)).status, 403)
  assert.equal((await call('POST', '/users/login', { email: 'sus@example.com', password: 'longenough' })).status, 403)
  assert.equal((await call('POST', '/users/login', { email: 'sus@example.com', password: 'wrong-pass' })).status, 401, 'no leak without the password')
  assert.equal((await call('PUT', '/users/admin1', { suspended: true }, tokens.admin)).status, 403, 'admin cannot suspend self')
  await call('PUT', `/users/${user.id}`, { suspended: false }, tokens.admin)
  assert.equal((await call('POST', '/users/login', { email: 'sus@example.com', password: 'longenough' })).status, 200)
})

test('reviews: only after a completed trek, moderated, and they drive the rating', async () => {
  // Rahul's seeded trips: treks 5 and 8 completed and already reviewed, trek 1 confirmed.
  const review = { trekId: '15', rating: 4, comment: 'Clear skies on the summit day, well run.' }
  assert.equal((await call('POST', '/reviews', review)).status, 401)
  assert.equal((await call('POST', '/reviews', review, tokens.operator)).status, 403)
  assert.equal((await call('POST', '/reviews', { ...review, trekId: '1' }, tokens.user)).status, 403, 'trek 1 not completed')
  assert.equal((await call('POST', '/reviews', review, tokens.user)).status, 403, 'trek 15 not booked yet')
  assert.equal((await call('POST', '/reviews', { ...review, trekId: '5' }, tokens.user)).status, 409, 'one review per trek')

  const trip = (await call('POST', '/bookings', booking('15'), tokens.user)).body
  assert.equal((await call('POST', '/reviews', review, tokens.user)).status, 403, 'a pending booking is not a completed trek')
  assert.equal((await call('PATCH', `/bookings/${trip.id}`, { status: 'Confirmed' }, tokens.operator)).status, 200)
  assert.equal((await call('PATCH', `/bookings/${trip.id}`, { status: 'Completed' }, tokens.operator)).status, 200)

  assert.equal((await call('POST', '/reviews', { ...review, comment: 'short' }, tokens.user)).status, 400)
  assert.equal((await call('POST', '/reviews', { ...review, rating: 6 }, tokens.user)).status, 400)

  const created = await call('POST', '/reviews', review, tokens.user)
  assert.equal(created.status, 201)
  assert.equal(created.body.status, 'Pending')
  assert.equal(created.body.userName, 'Rahul Kumar')
  assert.equal((await call('POST', '/reviews', review, tokens.user)).status, 409, 'one review per trek')

  assert.equal((await call('GET', '/reviews?trekId=15')).body.length, 0, 'pending reviews are not public')
  const mine = (await call('GET', '/reviews?mine=1', undefined, tokens.user)).body
  assert.deepEqual(mine.map(r => r.trekId).sort(), ['15', '5', '8'], 'two seeded reviews plus the new one')
  assert.equal((await call('PATCH', `/reviews/${created.body.id}`, { status: 'Approved' }, tokens.user)).status, 403)
  assert.equal((await call('PATCH', `/reviews/${created.body.id}`, { status: 'Approved' }, tokens.operator)).status, 403)
  assert.equal((await call('PATCH', `/reviews/${created.body.id}`, { status: 'Approved' }, tokens.admin)).status, 200)

  assert.equal((await call('GET', '/reviews?trekId=15')).body.length, 1)
  const trek = (await call('GET', '/treks/15')).body
  assert.equal(trek.rating, 4)
  assert.equal(trek.reviewCount, 1)

  await call('PATCH', `/reviews/${created.body.id}`, { status: 'Rejected' }, tokens.admin)
  assert.equal((await call('GET', '/treks/15')).body.reviewCount, 0)
})

test('reviews: seeded approved reviews drive the rating, pending and rejected ones do not', async () => {
  // Trek 5 has Rahul's approved 5-star review; trek 18 only Karan's rejected one; trek 11 a pending one.
  const kedarkantha = (await call('GET', '/treks/5')).body
  assert.equal(kedarkantha.rating, 5)
  assert.equal(kedarkantha.reviewCount, 1)
  assert.equal((await call('GET', '/treks/18')).body.reviewCount, 0)
  assert.equal((await call('GET', '/treks/11')).body.reviewCount, 0)
  assert.equal((await call('GET', '/reviews?trekId=18')).body.length, 0, 'rejected reviews are not public')
})

test('auth: forged, tampered and expired tokens are rejected', async () => {
  const [payload, sig] = tokens.user.split('.')
  const forged = Buffer.from(JSON.stringify({ sub: 'admin1', exp: Date.now() + 1e6 })).toString('base64url')
  assert.equal((await call('GET', '/users', undefined, `${forged}.${sig}`)).status, 401)
  assert.equal((await call('GET', '/bookings', undefined, `${payload}.x`)).status, 401)
  assert.equal((await call('GET', '/bookings', undefined, 'garbage')).status, 401)
  const expired = Buffer.from(JSON.stringify({ sub: 'u1', exp: 1 })).toString('base64url')
  assert.equal((await call('GET', '/bookings', undefined, `${expired}.${sig}`)).status, 401)
})

test('auth: repeated failed logins are locked out', async () => {
  await call('POST', '/users/register', { name: 'Lock', email: 'lock@example.com', password: 'longenough' })
  for (let i = 0; i < 5; i++) {
    assert.equal((await call('POST', '/users/login', { email: 'lock@example.com', password: 'wrong-pass' })).status, 401)
  }
  assert.equal((await call('POST', '/users/login', { email: 'lock@example.com', password: 'longenough' })).status, 429)
})

test('unknown route and malformed JSON return JSON errors', async () => {
  assert.equal((await call('GET', '/nothing')).status, 404)
  const res = await fetch(`${base}/treks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
  assert.equal(res.status, 400)
})
