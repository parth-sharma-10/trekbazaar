import { useState } from 'react'
import Navbar from '../components/Navbar'
import { destinations, type Trek } from '../data/treks'
import { useStore } from '../store'
import { addDays, formatDate, today } from '../lib'
import type { NavigateFn, UserRole } from '../types'

interface AddEditTrekProps {
  navigate: NavigateFn
  userRole: UserRole
  setUserRole: (r: UserRole) => void
  editTrekId?: string | null
}

// The demo operator account. A real app would take this from the signed-in operator.
const OPERATOR = { name: 'Himalayan Treks Co.', id: 'op1' }
const STATES = ['Uttarakhand', 'Himachal Pradesh', 'Ladakh', 'West Bengal', 'Nagaland', 'Sikkim', 'Manipur', 'Arunachal Pradesh']
const DIFFICULTIES = ['Easy', 'Moderate', 'Difficult', 'Expert'] as const
const DESCRIPTION_LIMIT = 500

type Form = Record<'title' | 'description' | 'state' | 'location' | 'difficulty' | 'duration' | 'maxAltitude' | 'groupSizeMin' | 'groupSizeMax' | 'price' | 'meetingPoint' | 'bestMonths', string>
type Section = 'basic' | 'details' | 'pricing' | 'media'

function formFromTrek(trek: Trek | undefined): Form {
  const [, min = '', max = ''] = trek?.groupSize.match(/(\d+)\D+(\d+)/) ?? []
  return {
    title: trek?.title ?? '',
    description: trek?.description ?? '',
    state: trek?.state ?? '',
    location: trek?.location ?? '',
    difficulty: trek?.difficulty ?? '',
    duration: trek ? String(trek.durationDays) : '',
    maxAltitude: trek?.maxAltitude.replace(/\D/g, '') ?? '',
    groupSizeMin: min,
    groupSizeMax: max,
    price: trek ? String(trek.price) : '',
    meetingPoint: trek?.meetingPoint ?? '',
    bestMonths: trek?.bestMonths ?? '',
  }
}

// Returns field -> message, plus the section that holds each field so we can jump to it.
function validate(form: Form): { errors: Partial<Record<keyof Form, string>>; section?: Section } {
  const errors: Partial<Record<keyof Form, string>> = {}
  if (form.title.trim().length < 3) errors.title = 'Add a title (at least 3 characters)'
  if (form.description.trim().length < 20) errors.description = 'Describe the trek in at least 20 characters'
  if (form.description.length > DESCRIPTION_LIMIT) errors.description = `Keep it under ${DESCRIPTION_LIMIT} characters`
  if (!form.state) errors.state = 'Select a state'
  if (!form.location.trim()) errors.location = 'Add the district or area'
  if (!form.meetingPoint.trim()) errors.meetingPoint = 'Add a meeting point'
  if (!form.difficulty) errors.difficulty = 'Select a difficulty'
  if (!(Number(form.duration) >= 1)) errors.duration = 'At least 1 day'
  if (form.groupSizeMin && form.groupSizeMax && Number(form.groupSizeMin) > Number(form.groupSizeMax)) errors.groupSizeMax = 'Must be at least the minimum'
  if (!(Number(form.price) > 0)) errors.price = 'Enter a price per person'

  const basic: (keyof Form)[] = ['title', 'description', 'state', 'location', 'meetingPoint']
  const details: (keyof Form)[] = ['difficulty', 'duration', 'groupSizeMax']
  const first = Object.keys(errors)[0] as keyof Form | undefined
  const section: Section | undefined = !first ? undefined : basic.includes(first) ? 'basic' : details.includes(first) ? 'details' : 'pricing'
  return { errors, section }
}

function buildTrek(form: Form, id: string, existing: Trek | undefined): Trek {
  const days = Number(form.duration)
  const image = existing?.image ?? destinations.find(d => d.name === form.state)?.image ?? destinations[0].image
  const min = form.groupSizeMin || '1'
  const max = form.groupSizeMax || '12'
  return {
    rating: 0,
    reviewCount: 0,
    gallery: [image],
    tags: [form.difficulty],
    highlights: [],
    itinerary: Array.from({ length: days }, (_, i) => ({ day: i + 1, title: `Day ${i + 1}`, description: 'Detailed itinerary to be shared by the operator.' })),
    inclusions: ['Experienced trek leader', 'Camping equipment', 'Meals during trek', 'First aid kit'],
    exclusions: ['Travel to the meeting point', 'Personal trekking gear', 'Travel insurance'],
    ...existing,
    id,
    title: form.title.trim(),
    description: form.description.trim(),
    state: form.state,
    location: form.location.trim(),
    difficulty: form.difficulty as Trek['difficulty'],
    duration: `${days} Day${days === 1 ? '' : 's'}`,
    durationDays: days,
    price: Number(form.price),
    maxAltitude: form.maxAltitude ? `${form.maxAltitude}m` : '—',
    bestMonths: form.bestMonths.trim() || 'Year-round',
    meetingPoint: form.meetingPoint.trim(),
    groupSize: `${min}–${max} people`,
    operator: existing?.operator ?? OPERATOR.name,
    operatorId: existing?.operatorId ?? OPERATOR.id,
    image,
  }
}

const inputClass = (invalid: boolean) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest placeholder-slate-400 text-slate-700 ${invalid ? 'border-red-300 bg-red-50/40' : 'border-slate-200'}`

export default function AddEditTrek({ navigate, userRole, setUserRole, editTrekId }: AddEditTrekProps) {
  const { findTrek, saveTrek, notify } = useStore()
  const existing = findTrek(editTrekId ?? undefined)
  const isEdit = !!existing
  const [activeSection, setActiveSection] = useState<Section>('basic')
  const [form, setForm] = useState<Form>(() => formFromTrek(existing))
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [batches, setBatches] = useState(() => [21, 42, 63].map(d => addDays(today(), d)))
  const [newBatch, setNewBatch] = useState('')
  const [photos, setPhotos] = useState<string[]>(existing?.gallery ?? [])

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value
    setForm(f => ({ ...f, [key]: value }))
    setErrors(er => ({ ...er, [key]: undefined }))
  }

  const field = (key: keyof Form) => ({
    id: `trek-${key}`,
    value: form[key],
    onChange: set(key),
    'aria-invalid': !!errors[key],
    className: inputClass(!!errors[key]),
  })

  const label = (key: keyof Form, text: string) => (
    <label htmlFor={`trek-${key}`} className="block text-sm font-medium text-slate-700 mb-1.5">{text}</label>
  )

  const error = (key: keyof Form) => errors[key] && <p className="text-xs text-red-600 mt-1" role="alert">{errors[key]}</p>

  const handlePublish = () => {
    const result = validate(form)
    setErrors(result.errors)
    if (result.section) {
      setActiveSection(result.section)
      notify('Fix the highlighted fields before publishing')
      return
    }
    const id = existing?.id ?? `c${Date.now()}`
    saveTrek(buildTrek(form, id, existing))
    notify(isEdit ? 'Trek updated' : 'Trek published. It is now live on Explore.')
    navigate('trek-details', { trek: id })
  }

  const addBatch = () => {
    if (!newBatch || newBatch < today()) return notify('Pick a future date for the new batch')
    if (batches.includes(newBatch)) return notify('That date already has a batch')
    setBatches(b => [...b, newBatch].sort())
    setNewBatch('')
  }

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'details', label: 'Trek Details', icon: '🏔️' },
    { id: 'pricing', label: 'Pricing & Dates', icon: '💰' },
    { id: 'media', label: 'Photos', icon: '📸' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navigate={navigate} currentScreen="add-trek" userRole={userRole} setUserRole={setUserRole} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <button onClick={() => navigate('operator-dashboard')} className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back to Dashboard
            </button>
            <h1 className="font-display text-3xl text-slate-900">{isEdit ? 'Edit Trek' : 'Add New Trek'}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => notify('Draft saved on this device (demo)')} className="border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors">Save Draft</button>
            <button onClick={handlePublish} className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all bg-forest hover:bg-forest-dark text-white">
              {isEdit ? 'Update Trek' : 'Publish Trek'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Nav */}
          <div className="flex md:flex-col gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0" role="tablist">
            {sections.map(s => (
              <button
                key={s.id}
                role="tab"
                aria-selected={activeSection === s.id}
                onClick={() => setActiveSection(s.id)}
                className={`shrink-0 md:w-full text-left whitespace-nowrap flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeSection === s.id ? 'bg-forest text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
              >
                <span aria-hidden="true">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-3 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 space-y-5">
            {activeSection === 'basic' && (
              <>
                <h2 className="font-semibold text-slate-900 text-lg">Basic Information</h2>
                <div>
                  {label('title', 'Trek Title *')}
                  <input {...field('title')} placeholder="e.g. Roopkund Trek via Ali Bugyal" />
                  {error('title')}
                </div>
                <div>
                  {label('description', 'Description *')}
                  <textarea {...field('description')} className={`${inputClass(!!errors.description)} resize-none`} rows={4} maxLength={DESCRIPTION_LIMIT} placeholder="Describe the trek experience, landscape, and what makes it special..." />
                  <p className="text-xs text-slate-400 mt-1">{form.description.length}/{DESCRIPTION_LIMIT} characters</p>
                  {error('description')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {label('state', 'State *')}
                    <select {...field('state')} className={`${inputClass(!!errors.state)} bg-white`}>
                      <option value="">Select state</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    {error('state')}
                  </div>
                  <div>
                    {label('location', 'Location / District *')}
                    <input {...field('location')} placeholder="e.g. Chamoli District" />
                    {error('location')}
                  </div>
                </div>
                <div>
                  {label('meetingPoint', 'Meeting Point *')}
                  <input {...field('meetingPoint')} placeholder="e.g. Rishikesh Bus Stand" />
                  {error('meetingPoint')}
                </div>
              </>
            )}

            {activeSection === 'details' && (
              <>
                <h2 className="font-semibold text-slate-900 text-lg">Trek Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    {label('difficulty', 'Difficulty *')}
                    <select {...field('difficulty')} className={`${inputClass(!!errors.difficulty)} bg-white`}>
                      <option value="">Select difficulty</option>
                      {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                    </select>
                    {error('difficulty')}
                  </div>
                  <div>
                    {label('duration', 'Duration (days) *')}
                    <input {...field('duration')} type="number" min={1} max={30} placeholder="8" />
                    {error('duration')}
                  </div>
                  <div>
                    {label('maxAltitude', 'Max Altitude (m)')}
                    <input {...field('maxAltitude')} type="number" min={0} placeholder="5029" />
                  </div>
                  <div>
                    {label('bestMonths', 'Best Months')}
                    <input {...field('bestMonths')} placeholder="May–Jun, Sep–Oct" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    {label('groupSizeMin', 'Min Group Size')}
                    <input {...field('groupSizeMin')} type="number" min={1} placeholder="6" />
                  </div>
                  <div>
                    {label('groupSizeMax', 'Max Group Size')}
                    <input {...field('groupSizeMax')} type="number" min={1} placeholder="16" />
                    {error('groupSizeMax')}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'pricing' && (
              <>
                <h2 className="font-semibold text-slate-900 text-lg">Pricing & Batch Dates</h2>
                <div>
                  {label('price', 'Price per Person (₹) *')}
                  <input {...field('price')} type="number" min={0} step={100} placeholder="14500" />
                  {error('price')}
                </div>
                <div>
                  <div className="flex items-end justify-between gap-3 mb-3 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">Departure Dates</span>
                    <div className="flex gap-2">
                      <input type="date" min={today()} value={newBatch} onChange={e => setNewBatch(e.target.value)} aria-label="New batch date" className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-forest" />
                      <button onClick={addBatch} className="text-xs text-forest hover:text-forest-dark font-medium whitespace-nowrap">+ Add Batch</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batches.length === 0 && <p className="text-sm text-slate-400">No departures scheduled.</p>}
                    {batches.map(date => (
                      <div key={date} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                        <div className="text-sm font-medium text-slate-800">{formatDate(date)}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">{form.groupSizeMax || 12} spots</span>
                          <button onClick={() => setBatches(b => b.filter(x => x !== date))} aria-label={`Remove ${formatDate(date)} batch`} className="text-slate-400 hover:text-red-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'media' && (
              <>
                <h2 className="font-semibold text-slate-900 text-lg">Trek Photos</h2>
                <label className="block border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-forest transition-colors cursor-pointer focus-within:border-forest">
                  <div className="text-4xl mb-3" aria-hidden="true">📸</div>
                  <p className="font-medium text-slate-700 mb-1">Click to upload photos</p>
                  <p className="text-xs text-slate-400">JPG or PNG, up to 5MB each. Previews stay on this device in the demo.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    className="sr-only"
                    onChange={e => {
                      const files = [...(e.target.files ?? [])]
                      const tooBig = files.filter(f => f.size > 5 * 1024 * 1024)
                      if (tooBig.length) notify(`${tooBig.length} photo(s) over 5MB were skipped`)
                      setPhotos(p => [...p, ...files.filter(f => f.size <= 5 * 1024 * 1024).map(f => URL.createObjectURL(f))])
                      e.target.value = ''
                    }}
                  />
                </label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map(src => (
                      <div key={src} className="aspect-video rounded-xl overflow-hidden relative group bg-slate-200">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setPhotos(p => p.filter(x => x !== src))} className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
