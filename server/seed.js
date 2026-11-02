// Resets the database to the demo data. Usage: npm run seed
import mongoose from 'mongoose'
import { treks } from '../src/data/treks.ts'
import { addDays, priceBreakdown, today } from '../src/lib.ts'
import { Booking, Trek, User } from './models.js'
import { hashPassword } from './routes.js'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trekbazaar'
export const DEMO_PASSWORD = 'trek1234'

function booking(id, trekId, offsetDays, participants, status) {
  const trek = treks.find(t => t.id === trekId)
  return {
    id,
    trekId,
    date: addDays(today(), offsetDays),
    participants,
    amount: priceBreakdown(trek.price, participants).total,
    status,
    traveller: 'Rahul Kumar',
    email: 'rahul.kumar@example.com',
  }
}

export async function seed() {
  const year = new Date().getFullYear()
  await Promise.all([Trek.deleteMany({}), Booking.deleteMany({}), User.deleteMany({})])
  await Trek.insertMany(treks)
  await Booking.insertMany([
    booking(`TB-${year}-389123`, '1', 47, 2, 'Confirmed'),
    booking(`TB-${year}-245678`, '2', 12, 1, 'Pending'),
    booking(`TB-${year - 1}-178923`, '5', -260, 3, 'Completed'),
    booking(`TB-${year - 1}-093421`, '8', -360, 2, 'Completed'),
    booking(`TB-${year - 1}-052341`, '3', -420, 1, 'Cancelled'),
  ])
  const passwordHash = hashPassword(DEMO_PASSWORD)
  await User.insertMany([
    { id: 'u1', name: 'Rahul Kumar', email: 'rahul.kumar@example.com', role: 'user', phone: '+91 98765 43210', city: 'Delhi', bio: 'Passionate trekker exploring the Himalayas one trail at a time.', passwordHash },
    { id: 'op1', name: 'Himalayan Treks Co.', email: 'operator@trekbazaar.in', role: 'operator', city: 'Dehradun', passwordHash },
    { id: 'admin1', name: 'TrekBazaar Admin', email: 'admin@trekbazaar.in', role: 'admin', city: 'Mumbai', passwordHash },
  ])
  return { treks: treks.length, bookings: 5, users: 3 }
}

if (process.argv[1]?.endsWith('seed.js')) {
  await mongoose.connect(MONGO_URI)
  console.log('Seeded', mongoose.connection.name, await seed())
  await mongoose.disconnect()
}
