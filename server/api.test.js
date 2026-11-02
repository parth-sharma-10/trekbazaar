// Integration tests against a real MongoDB (database trekbazaar_test, wiped before the run).
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { start } from './index.js'
import { DEMO_PASSWORD, seed } from './seed.js'

let server
let base

before(async () => {
  server = await start(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/trekbazaar_test', 0)
  await new Promise(resolve => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
  await seed()
})

after(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  server.close()
})

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
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
  operator: 'Himalayan Treks Co.',
  operatorId: 'op1',
  image: 'https://example.com/a.jpg',
  description: 'A short test trek used only by the integration tests.',
}

test('treks: create, read, update, delete', async () => {
  const created = await call('POST', '/treks', newTrek)
  assert.equal(created.status, 201)
  assert.equal(created.body._id, undefined, '_id must not leak')
  const { id } = created.body

  assert.equal((await call('GET', `/treks/${id}`)).body.title, 'Test Ridge Trek')
  assert.ok((await call('GET', '/treks')).body.some(t => t.id === id))

  const updated = await call('PUT', `/treks/${id}`, { price: 6500 })
  assert.equal(updated.body.price, 6500)

  assert.equal((await call('DELETE', `/treks/${id}`)).status, 200)
  assert.equal((await call('GET', `/treks/${id}`)).status, 404)
})

test('treks: schema validation returns 400 with the field message', async () => {
  const res = await call('POST', '/treks', { ...newTrek, price: 100 })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /at least ₹500/)
})

test('treks: cannot delete a trek with active bookings', async () => {
  const res = await call('DELETE', '/treks/1')
  assert.equal(res.status, 409)
  assert.equal((await call('GET', '/treks/1')).status, 200)
})

test('bookings: server recomputes the amount and validates the trek', async () => {
  const res = await call('POST', '/bookings', { trekId: '1', date: '2027-05-01', participants: 2, amount: 1, traveller: 'A B', email: 'a@b.co' })
  assert.equal(res.status, 201)
  assert.equal(res.body.amount, 30450) // 14500 x 2 + 5% fee
  assert.match(res.body.id, /^TB-\d{4}-\d{6}$/)

  const bad = await call('POST', '/bookings', { trekId: 'nope', date: '2027-05-01', participants: 1, traveller: 'A B' })
  assert.equal(bad.status, 400)

  const tooMany = await call('POST', '/bookings', { trekId: '1', date: '2027-05-01', participants: 40, traveller: 'A B' })
  assert.equal(tooMany.status, 400)
})

test('bookings: status transitions are enforced', async () => {
  const { body } = await call('POST', '/bookings', { trekId: '2', date: '2027-06-01', participants: 1, traveller: 'C D' })
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Cancelled' })).body.status, 'Cancelled')
  assert.equal((await call('PATCH', `/bookings/${body.id}`, { status: 'Confirmed' })).status, 400)
  assert.equal((await call('DELETE', `/bookings/${body.id}`)).status, 200)
  assert.equal((await call('GET', `/bookings/${body.id}`)).status, 404)
})

test('users: register, duplicate email, login, wrong password, profile update', async () => {
  const reg = await call('POST', '/users/register', { name: 'New User', email: 'New@Example.com', password: 'longenough' })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.passwordHash, undefined, 'hash must not leak')
  assert.equal(reg.body.email, 'new@example.com')

  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'new@example.com', password: 'longenough' })).status, 409)
  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'x@example.com', password: 'short' })).status, 400)
  assert.equal((await call('POST', '/users/register', { name: 'X', email: 'y@example.com', password: 'longenough', role: 'admin' })).status, 403)

  assert.equal((await call('POST', '/users/login', { email: 'rahul.kumar@example.com', password: DEMO_PASSWORD })).body.role, 'user')
  assert.equal((await call('POST', '/users/login', { email: 'rahul.kumar@example.com', password: 'wrong-pass' })).status, 401)

  const put = await call('PUT', `/users/${reg.body.id}`, { city: 'Pune' })
  assert.equal(put.body.city, 'Pune')
  assert.equal(put.body.name, 'New User')
})

test('unknown route and malformed JSON return JSON errors', async () => {
  assert.equal((await call('GET', '/nothing')).status, 404)
  const res = await fetch(`${base}/treks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
  assert.equal(res.status, 400)
})
