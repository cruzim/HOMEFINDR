'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { properties as propApi, viewings as viewApi, type Property } from '@/lib/api';
import { formatFullPrice } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i + 1);
  return {
    value: d.toISOString().split('T')[0],
    label: d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
});

function timeToISO(date: string, time: string): string {
  const [h, rest] = time.split(':');
  const [m, period] = rest.split(' ');
  let hours = parseInt(h);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return new Date(`${date}T${String(hours).padStart(2, '0')}:${m}:00`).toISOString();
}

export default function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      setForm({ firstName: user.full_name.split(' ')[0] || '', lastName: user.full_name.split(' ').slice(1).join(' ') || '', email: user.email, phone: user.phone || '' });
    }
    propApi.get(id).then(setProperty).catch(() => {});
  }, [id, user, loading, router]);

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) { toast.error('Please select a date and time'); return; }
    setSubmitting(true);
    try {
      await viewApi.create({
        property_id: id,
        scheduled_at: timeToISO(selectedDate, selectedTime),
        contact_name: `${form.firstName} ${form.lastName}`.trim(),
        contact_email: form.email,
        contact_phone: form.phone || undefined,
      });
      setConfirmed(true);
      toast.success('Viewing scheduled!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule viewing');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (confirmed) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Viewing Scheduled!</h2>
          <p className="text-sm text-gray-500 mb-2">
            <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>
          </p>
          {property && (
            <p className="text-sm text-gray-500 mb-6">{property.title || property.address}, {property.city}</p>
          )}
          <p className="text-xs text-gray-400 mb-6">A confirmation will be sent to {form.email}</p>
          <div className="flex gap-3">
            <Link href="/dashboard/buyer" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Dashboard
            </Link>
            {property && (
              <Link href={`/listing/${id}`} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                Back to Listing
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Contact Info', 'Select Date', 'Confirm'];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0">
            <Link href={`/listing/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft size={15} /> Back to Listing
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Schedule Your Private Tour</h1>
            <p className="text-sm text-gray-500 mb-7">Take the first step toward your new home. Choose a time that works for you.</p>

            {/* Steps */}
            <div className="flex items-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ml-2 hidden sm:block ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${step > i + 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Contact */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Your Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'First Name', key: 'firstName', type: 'text' },
                    { label: 'Last Name', key: 'lastName', type: 'text' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                      <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => setField(f.key, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setField('email', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)}
                      placeholder="+234..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-2">
                  Next: Select Date
                </button>
              </div>
            )}

            {/* Step 2: Date/Time */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-semibold text-gray-900">Pick a Date</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {DATES.map(d => (
                    <button key={d.value} onClick={() => setSelectedDate(d.value)}
                      className={`py-3 px-2 rounded-xl border text-center text-sm font-medium transition-colors ${selectedDate === d.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>

                {selectedDate && (
                  <>
                    <h2 className="font-semibold text-gray-900">Pick a Time</h2>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMES.map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)}
                          className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${selectedTime === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} disabled={!selectedDate || !selectedTime}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl">
                    Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                  <h2 className="font-semibold text-gray-900">Confirm Your Viewing</h2>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{form.firstName} {form.lastName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{form.email}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{selectedTime}</span></div>
                    {property && <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium text-right max-w-[200px]">{property.title || property.address}</span></div>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Edit
                  </button>
                  <button onClick={handleConfirm} disabled={submitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Booking...</> : <><Calendar size={16} /> Confirm Viewing</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Property card sidebar */}
          {property && (
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                <div className="h-40 bg-gray-100 relative">
                  {property.images?.[0] && (
                    <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-lg text-gray-900">{formatFullPrice(property.price)}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">{property.title || property.address}</p>
                  <p className="text-xs text-gray-500">{property.area}, {property.city}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
                    <span>{property.beds} bds</span>
                    <span>{property.baths} ba</span>
                    <span>{property.sqft.toLocaleString()} sqft</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
