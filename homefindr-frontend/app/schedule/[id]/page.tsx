'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, CheckCircle, Mail, Phone as PhoneIcon } from 'lucide-react';
import { PROPERTIES } from '@/data/mock';
import { formatFullPrice } from '@/lib/utils';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1);
  return { value: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) };
});

export default function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = PROPERTIES.find(p => p.id === id) ?? PROPERTIES[0];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', updates: true });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [calendarAdded, setCalendarAdded] = useState<Record<string, boolean>>({});

  function setField(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })); }

  const steps = ['Contact Info', 'Select Date', 'Confirm'];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Form */}
          <div className="flex-1 min-w-0">
            <Link href={`/listing/${property.id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft size={15} /> Back to Listing
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Schedule Your Private Tour</h1>
            <p className="text-sm text-gray-500 mb-7">Take the first step toward your new home. Choose a time that works for you.</p>

            {/* Step indicator */}
            <div className="flex items-center gap-0 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1 - Contact info */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Your Information</h2>
                <p className="text-sm text-gray-500 mb-5">We&apos;ll use this to contact you about the viewing.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: 'firstName', label: 'First Name', placeholder: 'Tunde' }, { key: 'lastName', label: 'Last Name', placeholder: 'Adeyemi' }].map(f => (
                      <div key={f.key}>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                        <input value={form[f.key as keyof typeof form] as string} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="tunde@example.com"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
                    <div className="relative">
                      <PhoneIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+234 803 000 0000"
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.updates} onChange={e => setField('updates', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                    <span className="text-sm text-gray-600">I&apos;d like to receive listing updates and market insights</span>
                  </label>
                </div>
                <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                  <Link href={`/listing/${property.id}`} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
                  <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    Next: Schedule →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 - Select date & time */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Choose a Date &amp; Time</h2>
                <p className="text-sm text-gray-500 mb-5">Select from available slots with {property.agent.name}.</p>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Available Dates</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {DATES.map(d => (
                      <button key={d.value} onClick={() => setSelectedDate(d.value)}
                        className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedDate === d.value ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">Available Times</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIMES.map(t => (
                      <button key={t} onClick={() => setSelectedTime(t)}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${selectedTime === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
                  <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                  <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl transition-colors">
                    Confirm Booking →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 - Confirmation */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-sm text-gray-500 mb-6">Your viewing has been successfully scheduled.</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={property.images[0]} alt={property.address} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{property.address}</p>
                      <p className="text-xs text-gray-500">{property.zip}, {property.city}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {selectedDate}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {selectedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm text-gray-900">{property.agent.name}</p>
                    <p className="text-xs text-gray-500">Premier Listing Agent</p>
                  </div>
                  <Link href="/messages" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                    Message
                  </Link>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Sync to your calendar</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'google', label: 'Google Calendar', icon: '📅' },
                      { key: 'apple', label: 'Apple iCal', icon: '🗓' },
                    ].map(c => (
                      <button key={c.key} onClick={() => setCalendarAdded(p => ({ ...p, [c.key]: true }))}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${calendarAdded[c.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                        {calendarAdded[c.key] ? <CheckCircle size={14} /> : c.icon} {calendarAdded[c.key] ? 'Added!' : c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Notification reminders</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Email Updates' }, { label: 'SMS Alerts' }].map(r => (
                      <button key={r.label} className="py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Link href="/dashboard/buyer" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mb-3">
                  Go to Buyer Dashboard
                </Link>
                <Link href={`/listing/${property.id}`} className="block text-sm text-gray-500 hover:text-gray-700">
                  Return to Listing
                </Link>
              </div>
            )}
          </div>

          {/* Property sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm sticky top-24">
              <div className="relative h-48">
                <Image src={property.images[0]} alt={property.address} fill className="object-cover" />
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white">Featured</span>
              </div>
              <div className="p-5">
                <p className="text-xl font-bold text-gray-900 mb-0.5">{formatFullPrice(property.price)}</p>
                <p className="text-sm text-gray-600 mb-3">{property.address}, {property.zip}, {property.city}</p>
                <div className="flex gap-4 text-sm text-gray-700 mb-4 pb-4 border-b border-gray-100">
                  <span>{property.beds} Beds</span>
                  <span>{property.baths} Baths</span>
                  <span>{property.sqft.toLocaleString()} SqFt</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{property.agent.name}</p>
                    <p className="text-xs text-gray-500">Premier Listing Agent</p>
                    <p className="text-xs text-emerald-600 font-medium">{property.agent.online ? 'Online Now' : 'Offline'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <a href={`tel:${property.agent.phone}`} className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Message
                  </a>
                  <a href={`tel:${property.agent.phone}`} className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Call
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[{ label: 'SECURE BOOKING' }, { label: 'VERIFIED AGENT' }].map(b => (
                    <div key={b.label} className="flex items-center justify-center gap-1 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle size={11} className="text-blue-500" />
                      <span className="text-[9px] font-semibold text-gray-600">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
