import mongoose from 'mongoose'
import { MAX_PARTICIPANTS } from '../src/pricing.js'

// Documents are addressed by their own string `id` (e.g. "3", "TB-2026-389123") so the
// frontend keeps the ids it already uses in URLs. _id and __v never leave the server.
const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.passwordHash
    return ret
  },
}

const trekSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3 },
    location: { type: String, required: true, trim: true },
    state: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Difficult', 'Expert'], required: true },
    duration: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1, max: 30 },
    price: { type: Number, required: true, min: [500, 'Price must be at least ₹500'] },
    maxAltitude: { type: String, required: true },
    bestMonths: { type: String, default: '' },
    operator: { type: String, required: true },
    operatorId: { type: String, required: true },
    image: { type: String, required: true },
    imageCredit: { type: String, default: '', maxlength: 200 },
    gallery: [String],
    tags: [String],
    description: { type: String, required: true, minlength: 20 },
    highlights: [String],
    itinerary: [{ _id: false, day: Number, title: String, description: String }],
    inclusions: [String],
    exclusions: [String],
    meetingPoint: { type: String, default: '' },
    groupSize: { type: String, default: '' },
    // Scheduled departures. Seats left are worked out from bookings when the trek is read.
    departures: [{
      _id: false,
      date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'] },
      seats: { type: Number, required: true, min: [1, 'A departure needs at least 1 seat'], max: 100 },
    }],
  },
  { timestamps: true, toJSON },
)

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    trekId: { type: String, required: true, index: true },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'] },
    participants: { type: Number, required: true, min: 1, max: MAX_PARTICIPANTS },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Confirmed', 'Pending', 'Completed', 'Cancelled'], default: 'Pending' },
    traveller: { type: String, required: true, trim: true },
    // Contact and safety details for the operator; only the trekker, that operator and admins can read a booking.
    phone: { type: String, trim: true, default: '', maxlength: 20 },
    emergencyContact: { type: String, trim: true, default: '', maxlength: 120 },
    medicalInfo: { type: String, trim: true, default: '', maxlength: 500 },
    email: { type: String, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  },
  { timestamps: true, toJSON },
)

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'operator', 'admin'], default: 'user' },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 300 },
    // Operators publish only after an admin verifies them; suspended accounts cannot sign in.
    verified: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON },
)

// One document per failed login; MongoDB's TTL index deletes each after 15 minutes. Kept in the
// database rather than memory because serverless instances do not share memory.
const loginFailureSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 15 * 60 },
})

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    trekId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, validate: [Number.isInteger, 'Rating must be a whole number'] },
    comment: {
      type: String, required: [true, 'Write a few words about the trek'], trim: true,
      minlength: [10, 'Review must be at least 10 characters'], maxlength: [1000, 'Review must be at most 1000 characters'],
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  },
  { timestamps: true, toJSON },
)
reviewSchema.index({ trekId: 1, userId: 1 }, { unique: true })

export const Trek = mongoose.model('Trek', trekSchema)
export const Review = mongoose.model('Review', reviewSchema)
export const LoginFailure = mongoose.model('LoginFailure', loginFailureSchema)
export const Booking = mongoose.model('Booking', bookingSchema)
export const User = mongoose.model('User', userSchema)
