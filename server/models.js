import mongoose from 'mongoose'
import { MAX_PARTICIPANTS } from '../src/lib.ts'

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
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    maxAltitude: { type: String, required: true },
    bestMonths: { type: String, default: '' },
    operator: { type: String, required: true },
    operatorId: { type: String, required: true },
    image: { type: String, required: true },
    gallery: [String],
    tags: [String],
    description: { type: String, required: true, minlength: 20 },
    highlights: [String],
    itinerary: [{ _id: false, day: Number, title: String, description: String }],
    inclusions: [String],
    exclusions: [String],
    meetingPoint: { type: String, default: '' },
    groupSize: { type: String, default: '' },
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
    status: { type: String, enum: ['Confirmed', 'Pending', 'Completed', 'Cancelled'], default: 'Confirmed' },
    traveller: { type: String, required: true, trim: true },
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
  },
  { timestamps: true, toJSON },
)

export const Trek = mongoose.model('Trek', trekSchema)
export const Booking = mongoose.model('Booking', bookingSchema)
export const User = mongoose.model('User', userSchema)
