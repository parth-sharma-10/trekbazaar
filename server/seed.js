// Resets the database to the demo data. Usage: npm run seed
//
// Treks are real (see src/data/moreTreks.ts for sources). People, companies, bookings and reviews
// are demo records: every account uses an @example.com address, and the reviews were written for
// this seed. They still follow the app's own rules, so nothing here is something the API would refuse:
// each review sits on a completed booking by its author, and every upcoming booking is on a
// scheduled departure within the trek's season.
import mongoose from 'mongoose'
import { treks as originalTreks } from '../src/data/treks.ts'
import { moreTreks } from '../src/data/moreTreks.ts'
import { addDays, priceBreakdown, today } from '../src/lib.ts'
import { Booking, LoginFailure, Review, Trek, User } from './models.js'
import { hashPassword } from './auth.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trekbazaar'
export const DEMO_PASSWORD = 'trek1234'
// The trekker demo password is public (README). The admin's must not be on a deployed site,
// so set SEED_ADMIN_PASSWORD when seeding anything reachable from the internet.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORD

const treks = [...originalTreks, ...moreTreks]
const SEATS_PER_DEPARTURE = 12
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "May–Jun, Sep–Oct" -> {4, 5, 8, 9}; ranges may wrap the year ("Oct–Jun").
export function seasonMonths(bestMonths) {
  const months = new Set()
  for (const part of bestMonths.split(',')) {
    const [from, to = from] = part.trim().split('–').map(m => MONTHS.indexOf(m.trim()))
    if (from < 0 || to < 0) throw new Error(`Cannot read season "${bestMonths}"`)
    for (let m = from; ; m = (m + 1) % 12) {
      months.add(m)
      if (m === to) break
    }
  }
  return months
}

// The next four departures on the 5th or 20th of an in-season month.
export function seasonalDepartures(bestMonths, from = today(), count = 4) {
  const months = seasonMonths(bestMonths)
  const dates = []
  for (let day = 1; dates.length < count && day <= 730; day++) {
    const date = addDays(from, day)
    const [, month, dom] = date.split('-').map(Number)
    if ((dom === 5 || dom === 20) && months.has(month - 1)) dates.push(date)
  }
  return dates.map(date => ({ date, seats: SEATS_PER_DEPARTURE }))
}

const at = iso => new Date(`${iso}T09:00:00+05:30`)

// ---------- Accounts ----------
const operators = [
  { id: 'op1', name: 'Himalayan Treks Co.', email: 'operator@trekbazaar.in', city: 'Dehradun', joined: '2024-11-10' },
  { id: 'op2', name: 'Wildflower Expeditions', email: 'wildflower.expeditions@example.com', city: 'Joshimath', joined: '2024-12-02' },
  { id: 'op3', name: 'Mountain Spirit', email: 'mountain.spirit@example.com', city: 'Manali', joined: '2025-01-14' },
  { id: 'op4', name: 'Bengal Himalaya Co.', email: 'bengal.himalaya@example.com', city: 'Darjeeling', joined: '2025-01-28' },
  { id: 'op5', name: 'Northeast Trails', email: 'northeast.trails@example.com', city: 'Kohima', joined: '2025-02-19' },
  { id: 'op6', name: 'Summit Seekers', email: 'summit.seekers@example.com', city: 'Uttarkashi', joined: '2025-03-03' },
  { id: 'op7', name: 'Ladakh & Kashmir Trails', email: 'ladakh.kashmir.trails@example.com', city: 'Leh', joined: '2025-03-21' },
  { id: 'op8', name: 'Pabbar Valley Treks', email: 'pabbar.valley@example.com', city: 'Rohru', joined: '2025-04-09' },
].map(o => ({ ...o, role: 'operator', verified: true, bio: `Trek operator based in ${o.city}.` }))

// Signed up but not yet verified by an admin, so it has no listings.
const pendingOperator = {
  id: 'op9', name: 'Spiti Valley Hikers', email: 'spiti.hikers@example.com', city: 'Kaza', joined: '2026-10-28',
  role: 'operator', verified: false, bio: 'New operator in Spiti, waiting for verification.',
}

const trekkers = [
  { id: 'u1', name: 'Rahul Kumar', email: 'rahul.kumar@example.com', phone: '+91 98765 43210', city: 'Delhi', joined: '2025-03-01', bio: 'Passionate trekker exploring the Himalayas one trail at a time.' },
  { id: 'u2', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 98450 11234', city: 'Bengaluru', joined: '2025-09-12' },
  { id: 'u3', name: 'Vikram Rawat', email: 'vikram.rawat@example.com', phone: '+91 94120 55871', city: 'Dehradun', joined: '2025-10-03' },
  { id: 'u4', name: 'Meera Nair', email: 'meera.nair@example.com', phone: '+91 94470 23019', city: 'Kochi', joined: '2026-01-22' },
  { id: 'u5', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '+91 98220 64410', city: 'Pune', joined: '2026-02-08' },
  { id: 'u6', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@example.com', phone: '+91 99200 31877', city: 'Mumbai', joined: '2026-02-26' },
  { id: 'u7', name: 'Rohan Das', email: 'rohan.das@example.com', phone: '+91 98300 72156', city: 'Kolkata', joined: '2026-03-15' },
  { id: 'u8', name: 'Kavya Reddy', email: 'kavya.reddy@example.com', phone: '+91 98490 18823', city: 'Hyderabad', joined: '2025-11-30' },
  { id: 'u9', name: 'Aditya Sharma', email: 'aditya.sharma@example.com', phone: '+91 94140 66392', city: 'Jaipur', joined: '2025-11-18' },
  { id: 'u10', name: 'Priya Menon', email: 'priya.menon@example.com', phone: '+91 98410 50627', city: 'Chennai', joined: '2026-02-02' },
  { id: 'u11', name: 'Karan Malhotra', email: 'karan.malhotra@example.com', phone: '+91 98110 43385', city: 'Delhi', joined: '2026-04-11' },
  { id: 'u12', name: 'Ishita Bose', email: 'ishita.bose@example.com', phone: '+91 98310 29940', city: 'Kolkata', joined: '2026-02-20' },
  // Suspended by an admin; kept to show the state in User Management.
  { id: 'u13', name: 'Farhan Qureshi', email: 'farhan.qureshi@example.com', phone: '+91 94150 87213', city: 'Lucknow', joined: '2026-06-01', suspended: true },
].map(u => ({ ...u, role: 'user', bio: u.bio ?? '' }))

// ---------- Bookings ----------
// [id, user, trek, date, participants, status, requested on]
const pastTrips = [
  ['TB-2025-178923', 'u1', '5', '2026-02-15', 3, 'Completed', '2025-12-20'],
  ['TB-2025-093421', 'u1', '8', '2025-11-07', 2, 'Completed', '2025-10-12'],
  ['TB-2025-052341', 'u1', '3', '2025-09-20', 1, 'Cancelled', '2025-08-30'],
  ['TB-2025-310442', 'u2', '13', '2025-12-20', 2, 'Completed', '2025-11-21'],
  ['TB-2025-318870', 'u9', '11', '2025-12-27', 3, 'Completed', '2025-12-01'],
  ['TB-2026-104215', 'u8', '9', '2026-01-18', 2, 'Completed', '2025-12-14'],
  ['TB-2026-112830', 'u8', '10', '2026-02-08', 2, 'Completed', '2026-01-10'],
  ['TB-2026-120547', 'u10', '20', '2026-03-14', 2, 'Completed', '2026-02-16'],
  ['TB-2026-131906', 'u3', '16', '2026-04-04', 1, 'Completed', '2026-03-06'],
  ['TB-2026-140118', 'u12', '28', '2026-04-12', 1, 'Completed', '2026-03-09'],
  ['TB-2026-148230', 'u9', '21', '2026-04-25', 4, 'Completed', '2026-04-02'],
  ['TB-2026-156674', 'u2', '12', '2026-05-10', 2, 'Completed', '2026-04-08'],
  ['TB-2026-163095', 'u11', '18', '2026-05-30', 2, 'Completed', '2026-04-27'],
  ['TB-2026-171352', 'u3', '14', '2026-06-05', 1, 'Completed', '2026-05-02'],
  ['TB-2026-179480', 'u6', '17', '2026-06-20', 3, 'Completed', '2026-05-24'],
  ['TB-2026-186027', 'u5', '24', '2026-07-14', 1, 'Completed', '2026-06-10'],
  ['TB-2026-192784', 'u4', '25', '2026-08-02', 2, 'Completed', '2026-06-28'],
  ['TB-2026-201365', 'u13', '26', '2026-08-16', 2, 'Completed', '2026-07-12'],
  ['TB-2026-208941', 'u6', '22', '2026-09-06', 2, 'Completed', '2026-08-14'],
  ['TB-2026-215503', 'u5', '19', '2026-09-12', 1, 'Completed', '2026-08-10'],
  ['TB-2026-222168', 'u7', '27', '2026-10-05', 1, 'Completed', '2026-08-29'],
]

// Upcoming bookings point at a trek's nth departure, which moves with the date the seed runs.
// [id, user, trek, departure index, participants, status, days ago requested]
const upcomingTrips = [
  ['TB-2026-389123', 'u1', '1', 1, 2, 'Confirmed', 20],
  ['TB-2026-245678', 'u1', '2', 0, 1, 'Pending', 3],
  ['TB-2026-301877', 'u10', '15', 0, 2, 'Confirmed', 9],
  ['TB-2026-305512', 'u11', '23', 0, 2, 'Pending', 1],
]

// ---------- Reviews ----------
// One per completed booking above: [user, trek, rating, status, comment]. Each is dated two days
// after that trip ended.
const reviews = [
  ['u1', '5', 5, 'Approved', 'The summit push started at 4am in deep snow and the sunrise over Swargarohini made every step worth it. Juda ka Talab camp was frozen solid.'],
  ['u1', '8', 4, 'Approved', 'Short and steep but well marked. Clear evening views of the Dhauladhar from the top. Weekend crowds at Triund itself, so expect company.'],
  ['u2', '13', 5, 'Approved', 'Chopta to Chandrashila in one morning. Tungnath temple was closed for winter but the summit view of Chaukhamba and Nanda Devi was perfectly clear.'],
  ['u9', '11', 4, 'Pending', 'Huge meadow, easy gradients, good for our group of three first-timers. Raithal homestay food was excellent. Cold wind on the top in late December.'],
  ['u8', '9', 5, 'Approved', 'Proper winter trek. Bekaltal was frozen and the ridge above Brahmatal gave us Trishul glowing at sunset. Trek leader kept a careful pace on the icy patches.'],
  ['u8', '10', 4, 'Approved', 'Gentle climb through forest with snow from Khullara onwards. The pass view of Dronagiri and Nanda Devi was the highlight. Long drive from Rishikesh.'],
  ['u10', '20', 4, 'Approved', 'Easy walk up from Baggi and the temple by the lake is beautiful. Snow still lying on the north slopes in March. Good first overnight trek.'],
  ['u3', '16', 5, 'Approved', 'Summit day was eleven hours in soft snow. Hard work but the guides fixed a rope on the last slope. Worth it for the view across to Nanda Devi.'],
  ['u12', '28', 4, 'Approved', 'Tshoka climb is steep. Rhododendrons were in full bloom in April and Dzongri top at sunrise showed Kangchenjunga and Kabru clearly.'],
  ['u9', '21', 3, 'Approved', 'The hot spring at the top is lovely but the trail and campsite were crowded and noisy. Fine for a quick weekend, not for solitude.'],
  ['u2', '12', 5, 'Approved', 'Osla village and its wooden temple were a highlight. The valley at the end opens up beautifully under Swargarohini. Relaxed pace suited us.'],
  ['u11', '18', 2, 'Rejected', 'Use code KARAN10 for discounts on gear at my online store! Trek was ok.'],
  ['u3', '14', 5, 'Approved', 'The Spider Wall is exposed but the team handled it well. Kedartal under Thalay Sagar was unreal. Only for people with prior high-altitude experience.'],
  ['u6', '17', 4, 'Approved', 'Steep first day from Gulaba. Lake still partly frozen in June. We had three people and one needed an extra rest at Rola Kholi; the leader was patient.'],
  ['u5', '24', 5, 'Approved', 'Villages, river crossings and then Kongmaru La. Two acclimatisation days in Leh made a big difference. Nimaling camp under Kang Yatse was the best night.'],
  ['u4', '25', 5, 'Approved', 'Every day a new lake. Gadsar was the most beautiful and Gangabal under Harmukh the most dramatic. Rain on two afternoons but nothing serious.'],
  ['u13', '26', 4, 'Pending', 'Quieter than the Great Lakes trek and just as pretty. Tarsar at first sight is something I will remember. Sundarsar camp was cold.'],
  ['u6', '22', 4, 'Pending', 'Short and scenic. Bakarthach meadow camp had Hanuman Tibba right in front. Moraine walk to the Kund is rocky, wear proper shoes.'],
  ['u5', '19', 5, 'Approved', 'The waterfall section is the most varied day of trekking I have done. Jakha village hanging on the cliff was amazing. Steep snow on the pass in September.'],
  ['u7', '27', 5, 'Approved', 'Eleven days and worth every one. Kangchenjunga turning pink at the Goechala viewpoint at dawn. The long day from Dzongri to Thansing is tough.'],
]

const priceOf = id => treks.find(t => t.id === id).price
const trekker = id => trekkers.find(u => u.id === id)

export async function seed() {
  await Promise.all([Trek.deleteMany({}), Booking.deleteMany({}), User.deleteMany({}), LoginFailure.deleteMany({}), Review.deleteMany({})])

  const scheduled = treks.map(t => ({ ...t, departures: seasonalDepartures(t.bestMonths) }))
  await Trek.insertMany(scheduled)

  const passwordHash = hashPassword(DEMO_PASSWORD)
  const people = [...trekkers, ...operators, pendingOperator].map(({ joined, ...u }) => ({
    ...u, passwordHash, createdAt: at(joined), updatedAt: at(joined),
  }))
  people.push({
    id: 'admin1', name: 'TrekBazaar Admin', email: 'admin@trekbazaar.in', role: 'admin', city: 'Mumbai',
    passwordHash: hashPassword(ADMIN_PASSWORD), createdAt: at('2024-10-01'), updatedAt: at('2024-10-01'),
  })
  await User.insertMany(people, { timestamps: false })

  const booking = (id, userId, trekId, date, participants, status, requested) => {
    const u = trekker(userId)
    return {
      id, trekId, date, participants, status,
      amount: priceBreakdown(priceOf(trekId), participants).total,
      traveller: u.name, email: u.email, phone: u.phone,
      createdAt: requested, updatedAt: requested,
    }
  }
  const departureOf = (trekId, n) => scheduled.find(t => t.id === trekId).departures[n].date
  await Booking.insertMany([
    ...pastTrips.map(([id, u, t, date, p, status, requested]) => booking(id, u, t, date, p, status, at(requested))),
    ...upcomingTrips.map(([id, u, t, n, p, status, daysAgo]) => booking(id, u, t, departureOf(t, n), p, status, at(addDays(today(), -daysAgo)))),
  ], { timestamps: false })

  const tripEnd = (userId, trekId) => {
    const trip = pastTrips.find(([, u, t, , , status]) => u === userId && t === trekId && status === 'Completed')
    if (!trip) throw new Error(`Review by ${userId} on trek ${trekId} has no completed booking`)
    return addDays(trip[3], treks.find(t => t.id === trekId).durationDays)
  }
  await Review.insertMany(reviews.map(([userId, trekId, rating, status, comment], i) => {
    const written = at(addDays(tripEnd(userId, trekId), 2))
    return {
      id: `r${String(i + 1).padStart(3, '0')}`, trekId, userId, userName: trekker(userId).name,
      rating, status, comment, createdAt: written, updatedAt: written,
    }
  }), { timestamps: false })

  return { treks: scheduled.length, users: people.length, bookings: pastTrips.length + upcomingTrips.length, reviews: reviews.length }
}

if (process.argv[1]?.endsWith('seed.js')) {
  await mongoose.connect(MONGO_URI)
  console.log('Seeded', mongoose.connection.name, await seed())
  await mongoose.disconnect()
}
