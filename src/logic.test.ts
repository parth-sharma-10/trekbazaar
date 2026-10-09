// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseHash, toHash } from './router.ts'
import {
  addDays, daysUntil, getBatches, isCardNumber, isEmail, isExpiry, isPhone, isUpiId, priceBreakdown,
} from './lib.ts'

test('hash routes round-trip and unknown paths fall back to landing', () => {
  assert.deepEqual(parseHash(toHash('trek-details', { trek: '3' })), { screen: 'trek-details', query: { trek: '3' } })
  assert.equal(toHash('landing'), '#/')
  assert.equal(toHash('explore', { q: 'snow lake', state: '' }), '#/explore?q=snow+lake')
  assert.deepEqual(parseHash('#/explore?q=snow+lake').query, { q: 'snow lake' })
  assert.equal(parseHash('#/nope').screen, 'landing')
  assert.equal(parseHash('').screen, 'landing')
})

test('price breakdown adds a rounded 5% service fee', () => {
  assert.deepEqual(priceBreakdown(14500, 2), { subtotal: 29000, serviceFee: 1450, total: 30450 })
  assert.deepEqual(priceBreakdown(3333, 1), { subtotal: 3333, serviceFee: 167, total: 3500 })
})

test('batches are in the future, three weeks apart, and stable per trek', () => {
  const batches = getBatches('1', '2026-10-09')
  assert.equal(batches.length, 5)
  assert.equal(batches[0].date, '2026-10-23')
  assert.equal(batches[1].date, '2026-11-13')
  assert.deepEqual(getBatches('1', '2026-10-09'), batches)
  assert.ok(batches.every(b => b.spots >= 1 && b.spots <= 12))
})

test('date helpers cross month and year boundaries', () => {
  assert.equal(addDays('2026-12-25', 10), '2027-01-04')
  assert.equal(daysUntil('2026-11-01', '2026-10-09'), 23)
  assert.equal(daysUntil('2026-10-01', '2026-10-09'), -8)
})

test('form validators accept good input and reject bad input', () => {
  assert.ok(isEmail('rahul@example.com'))
  assert.ok(!isEmail('rahul@'))
  assert.ok(isPhone('+91 98765 43210'))
  assert.ok(isPhone('9876543210'))
  assert.ok(!isPhone('12345'))
  assert.ok(!isPhone('5876543210'))
  assert.ok(isCardNumber('4242 4242 4242 4242'))
  assert.ok(!isCardNumber('4242 4242'))
  const now = new Date(2026, 9, 9)
  assert.ok(isExpiry('10/26', now))
  assert.ok(!isExpiry('09/26', now))
  assert.ok(!isExpiry('13/30', now))
  assert.ok(isUpiId('rahul@okhdfc'))
  assert.ok(!isUpiId('rahul'))
})
