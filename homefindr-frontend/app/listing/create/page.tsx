'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, X, CheckCircle, ArrowLeft, ArrowRight, Eye, Plus } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { AGENTS } from '@/data/mock';
import { PROPERTY_TYPES, AMENITIES_LIST, NIGERIAN_AREAS, cn } from '@/lib/utils';

const AGENT = AGENTS[0];
const STEPS = ['Media & Photos', 'Property Details', 'Review & Publish'];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&q=80',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80',
  'https://images.unsplash.com/photo-1585129777188-94600bc7b4b3?w=400&q=80',
];

export default function CreateListingPage() {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState(SAMPLE_PHOTOS.slice(0, 4));
  const [coverIdx, setCoverIdx] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [tourUrl, setTourUrl] = useState('');
  const [published, setPublished] = useState(false);

  const [details, setDetails] = useState({
    address: '', area: 'Ikoyi', city: 'Lagos', beds: 4, baths: 4, sqft: 3500,
    lotSize: 0.5, yearBuilt: 2022, description: '', propertyType: 'Detached Duplex',
    price: 350000000, commission: 5, status: 'active',
    amenities: [] as string[], openHouseDate: '', openHouseStart: '10:00 AM', openHouseEnd: '1:00 PM',
  });

  function setField(k: string, v: unknown) { setDetails(d => ({ ...d, [k]: v })); }
  function toggleAmenity(a: string) {
    setDetails(d => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter(x => x !== a) : [...d.amenities, a] }));
  }

  function removePhoto(i: number) { setPhotos(ps => ps.filter((_, idx) => idx !== i)); }
  function addSamplePhoto() { setPhotos(ps => [...ps, SAMPLE_PHOTOS[ps.length % SAMPLE_PHOTOS.length]]); }

  if (published) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar role="agent" user={{ name: AGENT.name, email: AGENT.email, photo: AGENT.photo, role: 'Agent' }} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Published!</h2>
            <p className="text-sm text-gray-500 mb-8">Your property at <strong>{details.address || '14B Sample Road'}</strong> is now live on HomeFindr and visible to thousands of buyers.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/agent" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back to Dashboard
              </Link>
              <Link href="/search" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                View Live Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" user={{ name: AGENT.name, email: AGENT.email, photo: AGENT.photo, role: 'Agent' }} />

      <div className="flex-1 flex flex-col">
        {/* Progress header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 max-w-3xl">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}>
                    {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={cn('text-xs font-medium hidden sm:block', step === i + 1 ? 'text-blue-600' : 'text-gray-400')}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-2', step > i + 1 ? 'bg-blue-500' : 'bg-gray-200')} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-3xl">
          {/* STEP 1 - Media */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Media</h1>
                <p className="text-sm text-gray-500 mt-0.5">Upload photos and videos to showcase your property. High-quality media sells 32% faster.</p>
              </div>

              {/* Upload zone */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    📷 Property Photos
                  </h2>
                  <span className="text-xs text-gray-500">{photos.length} photos uploaded</span>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400">PNG, JPG, or WEBP (max. 10MB per file)</p>
                  <button onClick={addSamplePhoto} className="mt-3 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Select Files
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((img, i) => (
                    <div key={i} className={cn('relative aspect-square rounded-xl overflow-hidden group cursor-pointer', i === coverIdx && 'ring-2 ring-blue-500')}>
                      <Image src={img} alt={`Photo ${i + 1}`} fill className="object-cover" />
                      {i === coverIdx && (
                        <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Cover</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button onClick={() => setCoverIdx(i)} className="p-1 bg-white/90 rounded-lg text-xs font-bold text-blue-600">Cover</button>
                        <button onClick={() => removePhoto(i)} className="p-1 bg-white/90 rounded-lg text-red-500"><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addSamplePhoto} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <div className="text-center">
                      <Plus size={20} className="mx-auto text-gray-400" />
                      <p className="text-xs text-gray-400 mt-1">Add More</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Video & Tour */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">🎥 Virtual Tours &amp; Video</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Video Tour URL</label>
                    <p className="text-xs text-gray-400 mb-2">Link a YouTube or Vimeo walkthrough</p>
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Matterport / 3D Tour</label>
                    <p className="text-xs text-gray-400 mb-2">Interactive 3D model link</p>
                    <input value={tourUrl} onChange={e => setTourUrl(e.target.value)} placeholder="https://my.matterport.com/show/..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 Pro Tip for Agents</p>
                  <p className="text-xs text-blue-600">Homes with 3D virtual tours get 87% more views. If you don&apos;t have one, consider hiring a pro photographer through our partner network.</p>
                  <button className="text-xs font-semibold text-blue-700 hover:underline mt-1">Find a Photographer →</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 - Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
                <p className="text-sm text-gray-500 mt-0.5">Tell buyers everything they need to know.</p>
              </div>

              {/* Location */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Location</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Street Address</label>
                    <input value={details.address} onChange={e => setField('address', e.target.value)} placeholder="e.g. 14B Bourdillon Road"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">City</label>
                    <select value={details.city} onChange={e => setField('city', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Lagos', 'Abuja', 'Port Harcourt', 'Benin City', 'Jos'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Area / Neighbourhood</label>
                    <select value={details.area} onChange={e => setField('area', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {(NIGERIAN_AREAS[details.city] ?? []).map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Property specs */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Property Specs</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'beds', label: 'Bedrooms', type: 'number' },
                    { key: 'baths', label: 'Bathrooms', type: 'number' },
                    { key: 'sqft', label: 'Size (sqft)', type: 'number' },
                    { key: 'lotSize', label: 'Lot Size (acres)', type: 'number' },
                    { key: 'yearBuilt', label: 'Year Built', type: 'number' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                      <input type={f.type} value={details[f.key as keyof typeof details] as number} onChange={e => setField(f.key, Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Property Type</label>
                    <select value={details.propertyType} onChange={e => setField('propertyType', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                  <textarea rows={4} value={details.description} onChange={e => setField('description', e.target.value)} placeholder="Describe the property, its features, and neighbourhood highlights..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Pricing &amp; Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Asking Price (₦)</label>
                    <input type="number" value={details.price} onChange={e => setField('price', Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Commission (%)</label>
                    <input type="number" value={details.commission} onChange={e => setField('commission', Number(e.target.value))} min={1} max={10}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Amenities &amp; Features</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITIES_LIST.map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input type="checkbox" checked={details.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="w-4 h-4 accent-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{a}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Open house */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900">Open House Schedule (optional)</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
                    <input type="date" value={details.openHouseDate} onChange={e => setField('openHouseDate', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Time</label>
                    <input type="time" value={details.openHouseStart} onChange={e => setField('openHouseStart', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">End Time</label>
                    <input type="time" value={details.openHouseEnd} onChange={e => setField('openHouseEnd', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - Review & Publish */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review &amp; Publish</h1>
                <p className="text-sm text-gray-500 mt-0.5">Check everything looks right before going live.</p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Cover image */}
                <div className="relative h-56">
                  <Image src={photos[coverIdx] ?? SAMPLE_PHOTOS[0]} alt="Cover" fill className="object-cover" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    {photos.slice(0, 4).map((img, i) => (
                      <div key={i} className="relative w-12 h-9 rounded-lg overflow-hidden border-2 border-white">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">₦{details.price.toLocaleString('en-NG')}</p>
                    <p className="text-gray-600">{details.address || '— Address not set —'}, {details.area}, {details.city}</p>
                    <div className="flex gap-4 text-sm text-gray-600 mt-2">
                      <span>{details.beds} Beds</span>
                      <span>{details.baths} Baths</span>
                      <span>{details.sqft.toLocaleString()} sqft</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">{details.description || 'No description added yet.'}</p>
                  </div>
                  {details.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {details.amenities.map(a => (
                        <span key={a} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 text-sm">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image src={AGENT.photo} alt={AGENT.name} fill className="object-cover" />
                    </div>
                    <span className="text-gray-600">Listed by <strong>{AGENT.name}</strong> · Commission: {details.commission}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">Your listing is ready to publish. It will be reviewed and go live within 2 hours.</p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div className="flex gap-2">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <Link href="/dashboard/agent" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel &amp; Exit
              </Link>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Eye size={15} /> Save as Draft
              </button>
              {step < STEPS.length ? (
                <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                  Continue to Details <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={() => setPublished(true)} className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
                  <CheckCircle size={15} /> Publish Listing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
