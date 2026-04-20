'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, ArrowRight, Plus, X, Upload, Video, Play } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { PROPERTY_TYPES, AMENITIES_LIST, NIGERIAN_AREAS, cn } from '@/lib/utils';
import { properties as api, uploadImages } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STEPS = ['Media & Photos', 'Property Details', 'Review & Publish'];

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
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
    virtual_tour_url: '',
  });

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && user.role !== 'agent' && user.role !== 'admin') {
      toast.error('Only agents can create listings');
      router.push('/dashboard/buyer');
    }
  }, [user, loading, router]);

  useEffect(() => {
    return () => { previews.forEach(p => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); }); };
  }, [previews]);

  function setField(k: string, v: unknown) { setDetails(d => ({ ...d, [k]: v })); }
  function toggleAmenity(a: string) {
    setDetails(d => ({ ...d, amenities: d.amenities.includes(a) ? d.amenities.filter(x => x !== a) : [...d.amenities, a] }));
  }

  // ── Photo upload ──────────────────────────────────────────────────
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 20) { toast.error('Maximum 20 photos per listing'); return; }

    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
    setUploadingPhotos(true);
    try {
      const urls = await uploadImages(files);
      setPhotos(prev => [...prev, ...urls]);
      setPreviews(prev => {
        const replaced = [...prev];
        const startIdx = replaced.length - newPreviews.length;
        urls.forEach((url, i) => { replaced[startIdx + i] = url; });
        return replaced;
      });
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Photo upload failed');
      setPreviews(prev => prev.filter(p => !newPreviews.includes(p)));
      newPreviews.forEach(URL.revokeObjectURL);
    } finally {
      setUploadingPhotos(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const p = prev[index];
      if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
      return prev.filter((_, i) => i !== index);
    });
  }

  // ── Video upload ──────────────────────────────────────────────────
  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_VIDEO_MB = 200;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
      return;
    }

    // Local preview immediately
    const blobUrl = URL.createObjectURL(file);
    setVideoPreview(blobUrl);
    setUploadingVideo(true);
    try {
      const urls = await uploadImages([file]); // backend handles video too
      if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
      setVideoUrl(urls[0]);
      setVideoPreview(urls[0]);
      toast.success('Video uploaded');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Video upload failed');
      URL.revokeObjectURL(blobUrl);
      setVideoPreview('');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  }

  function removeVideo() {
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
    setVideoUrl('');
    setVideoPreview('');
  }

  // ── Publish ───────────────────────────────────────────────────────
  async function handlePublish() {
    if (!details.title || !details.address || !details.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }
    setPublishing(true);
    try {
      const created = await api.create({
        ...details,
        images: photos,
        video_url: videoUrl || undefined,
        open_houses: [],
        highlights: [],
        lot_size: details.lot_size || undefined,
        year_built: details.year_built || undefined,
        virtual_tour_url: details.virtual_tour_url || undefined,
      });
      setCreatedId(created.id);
      setPublished(true);
      toast.success('Listing submitted for review!');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Submitted!</h2>
            <p className="text-sm text-gray-500 mb-8">
              <strong>{details.title || details.address}</strong> has been submitted for admin review. It will go live once approved.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/agent" className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Back to Dashboard
              </Link>
              {createdId && (
                <Link href={`/listing/${createdId}`} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  Preview Listing
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const areas = NIGERIAN_AREAS[details.city] || [];
  const uploading = uploadingPhotos || uploadingVideo;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" />

      <div className="flex-1 flex flex-col">
        {/* Progress */}
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

          {/* ── STEP 1 — Media ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Media</h1>
                <p className="text-sm text-gray-500 mt-0.5">Add photos and an optional video tour. High-quality media sells 32% faster.</p>
              </div>

              {/* Hidden inputs */}
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoSelect} />
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={handleVideoSelect} />

              {/* ── Photos ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Photos <span className="text-red-500">*</span></h2>
                  <span className="text-xs text-gray-400">{previews.length} / 20</span>
                </div>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhotos}
                  className={cn(
                    'w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                    uploadingPhotos ? 'border-blue-300 bg-blue-50 cursor-wait' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  )}>
                  {uploadingPhotos ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-blue-600 font-medium">Uploading photos…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Tap to upload photos</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG or WebP · up to 10 MB each</p>
                      </div>
                      <span className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                        Choose from Gallery / Camera
                      </span>
                    </div>
                  )}
                </button>

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden group">
                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">COVER</span>}
                        {src.startsWith('blob:') && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {previews.length < 20 && (
                      <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhotos}
                        className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50">
                        <Plus size={20} />
                        <span className="text-[10px] mt-1">Add more</span>
                      </button>
                    )}
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setPhotos([]); setPreviews([]); }}
                      className="text-xs text-red-400 hover:text-red-600">
                      Remove all photos
                    </button>
                  </div>
                )}
              </div>

              {/* ── Video Tour ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Video size={16} className="text-purple-500" /> Video Tour
                      <span className="text-xs font-normal text-gray-400 ml-1">Optional</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">MP4, MOV or WebM · up to 200 MB</p>
                  </div>
                  {videoPreview && (
                    <button type="button" onClick={removeVideo}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>

                {videoPreview ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    {uploadingVideo ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-purple-300 font-medium">Uploading video…</p>
                      </div>
                    ) : (
                      <video src={videoPreview} controls className="w-full h-full object-contain" />
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl p-8 text-center transition-colors cursor-pointer disabled:opacity-50">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Play size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Upload a video walkthrough</p>
                        <p className="text-xs text-gray-400 mt-0.5">Listings with video get 4× more enquiries</p>
                      </div>
                      <span className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg">
                        Choose Video
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <button onClick={() => setStep(2)} disabled={uploading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── STEP 2 — Details ── */}
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

          {/* ── STEP 3 — Review ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review & Publish</h1>
                <p className="text-sm text-gray-500 mt-0.5">Double-check everything before going live.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                {previews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {previews.slice(0, 5).map((src, i) => (
                      <img key={i} src={src} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0" />
                    ))}
                    {previews.length > 5 && (
                      <div className="w-20 h-14 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{previews.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Title</span><p className="font-medium text-gray-900 mt-0.5">{details.title || '—'}</p></div>
                  <div><span className="text-gray-500">Price</span><p className="font-bold text-blue-600 mt-0.5">₦{details.price.toLocaleString()}</p></div>
                  <div><span className="text-gray-500">Address</span><p className="font-medium text-gray-900 mt-0.5">{details.address || '—'}</p></div>
                  <div><span className="text-gray-500">Location</span><p className="font-medium text-gray-900 mt-0.5">{details.area}, {details.city}</p></div>
                  <div><span className="text-gray-500">Type</span><p className="font-medium text-gray-900 mt-0.5">{details.property_type}</p></div>
                  <div><span className="text-gray-500">Size</span><p className="font-medium text-gray-900 mt-0.5">{details.beds} beds · {details.baths} baths · {details.sqft.toLocaleString()} sqft</p></div>
                  <div><span className="text-gray-500">Photos</span><p className="font-medium text-gray-900 mt-0.5">{photos.length} uploaded</p></div>
                  <div><span className="text-gray-500">Video</span><p className="font-medium text-gray-900 mt-0.5">{videoUrl ? '✓ Included' : 'None'}</p></div>
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