'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { PROPERTY_TYPES, AMENITIES_LIST, NIGERIAN_AREAS, cn } from '@/lib/utils';
import { properties as api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STEPS = ['Media & Photos', 'Property Details', 'Review & Publish'];

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const [details, setDetails] = useState({
    title: '',
    address: '', area: 'Ikoyi', city: 'Lagos', state: 'Lagos',
    beds: 4, baths: 4, sqft: 3500,
    lot_size: 0.5, year_built: 2022, description: '',
    property_type: 'Detached Duplex',
    price: 350000000, commission_pct: 5,
    amenities: [] as string[],
    virtual_tour_url: '', video_url: '',
  });

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && user.role !== 'agent' && user.role !== 'admin') {
      toast.error('Only agents can create listings');
      router.push('/dashboard/buyer');
    }
  }, [user, loading, router]);

  function setField(k: string, v: unknown) { setDetails(d => ({ ...d, [k]: v })); }
  function toggleAmenity(a: string) {
    setDetails(d => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter(x => x !== a) : [...d.amenities, a] }));
  }

  function addPhoto() {
    const url = photoInput.trim();
    if (!url) return;
    setPhotos(ps => [...ps, url]);
    setPhotoInput('');
  }

  async function handlePublish() {
    if (!details.title || !details.address || !details.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    setPublishing(true);
    try {
      const created = await api.create({
        ...details,
        images: photos,
        open_houses: [],
        highlights: [],
        lot_size: details.lot_size || undefined,
        year_built: details.year_built || undefined,
        virtual_tour_url: details.virtual_tour_url || undefined,
        video_url: details.video_url || undefined,
      });
      setCreatedId(created.id);
      setPublished(true);
      toast.success('Listing published!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (published) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar role="agent" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Published!</h2>
            <p className="text-sm text-gray-500 mb-8">
              <strong>{details.title || details.address}</strong> is now live on HomeFindr.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/agent" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back to Dashboard
              </Link>
              {createdId && (
                <Link href={`/listing/${createdId}`} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  View Listing
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const areas = NIGERIAN_AREAS[details.city] || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" />

      <div className="flex-1 flex flex-col">
        {/* Progress header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 max-w-3xl">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                    step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}>
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

          {/* STEP 1 — Media */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Photos</h1>
                <p className="text-sm text-gray-500 mt-0.5">Paste image URLs to showcase your property. High-quality photos sell 32% faster.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    value={photoInput}
                    onChange={e => setPhotoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addPhoto()}
                    placeholder="Paste an image URL (https://...)"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={addPhoto} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                    <Plus size={16} /> Add
                  </button>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((url, i) => (
                      <div key={i} className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=60'; }} />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">COVER</span>
                        )}
                        <button onClick={() => setPhotos(ps => ps.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                    <p className="text-sm">No photos added yet</p>
                    <p className="text-xs mt-1">Paste image URLs above to add photos</p>
                  </div>
                )}
              </div>

              <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2 — Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
                <p className="text-sm text-gray-500 mt-0.5">Fill in all the details about your listing.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Listing Title <span className="text-red-500">*</span></label>
                  <input type="text" value={details.title} onChange={e => setField('title', e.target.value)}
                    placeholder="e.g. Stunning 4-Bed Duplex in Ikoyi with Pool"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Street Address <span className="text-red-500">*</span></label>
                  <input type="text" value={details.address} onChange={e => setField('address', e.target.value)}
                    placeholder="14B Bourdillon Road"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">City</label>
                    <select value={details.city} onChange={e => { setField('city', e.target.value); setField('state', e.target.value); setField('area', NIGERIAN_AREAS[e.target.value]?.[0] || ''); }}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.keys(NIGERIAN_AREAS).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Area</label>
                    <select value={details.area} onChange={e => setField('area', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {areas.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Property Type</label>
                  <select value={details.property_type} onChange={e => setField('property_type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Bedrooms', key: 'beds', min: 0, max: 20 },
                    { label: 'Bathrooms', key: 'baths', min: 0, max: 20 },
                    { label: 'Sqft', key: 'sqft', min: 100 },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                      <input type="number" value={details[f.key as keyof typeof details] as number}
                        min={f.min} max={f.max}
                        onChange={e => setField(f.key, Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Price (₦) <span className="text-red-500">*</span></label>
                  <input type="number" value={details.price} min={0}
                    onChange={e => setField('price', Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                  <textarea value={details.description} onChange={e => setField('description', e.target.value)}
                    rows={4} placeholder="Describe the property, its features, and surroundings..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-3">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                          details.amenities.includes(a) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:border-blue-400')}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Commission (%)</label>
                  <input type="number" value={details.commission_pct} min={0} max={20} step={0.5}
                    onChange={e => setField('commission_pct', Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  Review <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review & Publish</h1>
                <p className="text-sm text-gray-500 mt-0.5">Double-check everything before going live.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Title</span><p className="font-medium text-gray-900 mt-0.5">{details.title || '—'}</p></div>
                  <div><span className="text-gray-500">Price</span><p className="font-bold text-blue-600 mt-0.5">₦{details.price.toLocaleString()}</p></div>
                  <div><span className="text-gray-500">Address</span><p className="font-medium text-gray-900 mt-0.5">{details.address || '—'}</p></div>
                  <div><span className="text-gray-500">Location</span><p className="font-medium text-gray-900 mt-0.5">{details.area}, {details.city}</p></div>
                  <div><span className="text-gray-500">Type</span><p className="font-medium text-gray-900 mt-0.5">{details.property_type}</p></div>
                  <div><span className="text-gray-500">Size</span><p className="font-medium text-gray-900 mt-0.5">{details.beds} beds · {details.baths} baths · {details.sqft.toLocaleString()} sqft</p></div>
                  <div><span className="text-gray-500">Photos</span><p className="font-medium text-gray-900 mt-0.5">{photos.length} added</p></div>
                  <div><span className="text-gray-500">Amenities</span><p className="font-medium text-gray-900 mt-0.5">{details.amenities.length || 'None'}</p></div>
                </div>

                {details.description && (
                  <div>
                    <span className="text-sm text-gray-500">Description</span>
                    <p className="text-sm text-gray-800 mt-0.5">{details.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> Edit
                </button>
                <button onClick={handlePublish} disabled={publishing}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  {publishing ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Publishing...</> : <><CheckCircle size={16} /> Publish Listing</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
