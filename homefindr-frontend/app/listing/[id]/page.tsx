'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Phone, MessageSquare, Calendar, MapPin, BedDouble, Bath, Maximize, ChevronLeft, ChevronRight, CheckCircle, X } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/features/PropertyCard';
import { properties as api, messages as msgApi, type Property } from '@/lib/api';
import { formatPrice, formatFullPrice, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [related, setRelated] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');

  useEffect(() => {
    api.get(id).then(p => {
      setProperty(p);
      setSaved(p.is_saved ?? false);
      // Fetch related
      api.list({ city: p.city, page_size: 5 }).then(res => {
        setRelated(res.items.filter(r => r.id !== p.id).slice(0, 4));
      }).catch(() => {});
    }).catch(() => toast.error('Property not found')).finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!user) { router.push('/auth/login'); return; }
    try {
      if (saved) { await api.unsave(id); setSaved(false); toast.success('Removed from saved'); }
      else { await api.save(id); setSaved(true); toast.success('Saved!'); }
    } catch { toast.error('Failed to update saved status'); }
  }

  async function sendContactMessage() {
    if (!user) { router.push('/auth/login'); return; }
    if (!contactMsg.trim() || !property?.agent) return;
    setSendingMsg(true);
    try {
      await msgApi.startConversation({
        agent_id: property.agent.id,
        property_id: property.id,
        first_message: contactMsg.trim(),
      });
      toast.success('Message sent to agent!');
      setShowContact(false);
      setContactMsg('');
      router.push('/messages');
    } catch { toast.error('Failed to send message'); }
    finally { setSendingMsg(false); }
  }

  async function scheduleViewing() {
    if (!user) { router.push('/auth/login'); return; }
    if (!scheduleDate) { toast.error('Please select a date'); return; }
    try {
      const { viewings } = await import('@/lib/api');
      await viewings.create({
        property_id: id,
        scheduled_at: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        contact_name: user.full_name,
        contact_email: user.email,
        contact_phone: user.phone || undefined,
      });
      toast.success('Viewing scheduled!');
      setShowSchedule(false);
    } catch { toast.error('Failed to schedule viewing'); }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center p-8">
        <div>
          <p className="text-xl font-bold text-gray-900 mb-2">Property not found</p>
          <Link href="/search" className="text-blue-600 hover:underline text-sm">Browse all listings</Link>
        </div>
      </div>
    );
  }

  const images = property.images?.length > 0 ? property.images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'];

  function prev() { setImgIndex(i => (i - 1 + images.length) % images.length); }
  function next() { setImgIndex(i => (i + 1) % images.length); }

  return (
    <div className="flex flex-col">
      {/* Gallery */}
      <section className="relative bg-black h-[420px] md:h-[560px]">
        <Image src={images[imgIndex]} alt={property.title} fill className="object-cover opacity-90" priority />

        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center z-10">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.slice(0, 6).map((img, i) => (
              <button key={i} onClick={() => setImgIndex(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-white scale-110' : 'border-white/40'}`}>
                <Image src={img} alt="" width={56} height={40} className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full z-10">
          {imgIndex + 1} / {images.length}
        </div>

        <span className={cn('absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full z-10 capitalize',
          property.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white')}>
          {property.status}
        </span>
      </section>

      {/* Sticky CTA */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3 hidden md:block shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">{formatFullPrice(property.price)}</span>
            <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 capitalize">{property.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleSave} className={cn('flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-all',
              saved ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600')}>
              <Heart size={15} fill={saved ? 'currentColor' : 'none'} /> Save
            </button>
            <button onClick={() => { navigator.share?.({ title: property.title, url: window.location.href }); }} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Share2 size={15} /> Share
            </button>
            {property.agent?.phone && (
              <a href={`tel:${property.agent.phone}`} className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100">
                <Phone size={15} /> Call Agent
              </a>
            )}
            <button onClick={() => setShowContact(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
              <MessageSquare size={15} /> Message Agent
            </button>
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition-colors">
              <Calendar size={15} /> Schedule Viewing
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1440px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
            <p className="text-gray-500 flex items-center gap-1.5">
              <MapPin size={15} className="text-blue-500" />
              {property.address}, {property.area}, {property.city}, {property.state}
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <span className="flex items-center gap-1.5 text-sm text-gray-700"><BedDouble size={16} className="text-blue-500" />{property.beds} Bedrooms</span>
              <span className="flex items-center gap-1.5 text-sm text-gray-700"><Bath size={16} className="text-blue-500" />{property.baths} Bathrooms</span>
              <span className="flex items-center gap-1.5 text-sm text-gray-700"><Maximize size={16} className="text-blue-500" />{property.sqft.toLocaleString()} sqft</span>
              {property.year_built && <span className="text-sm text-gray-500">Built {property.year_built}</span>}
              {property.lot_size && <span className="text-sm text-gray-500">{property.lot_size} acres lot</span>}
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this property</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {property.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-blue-500 shrink-0" /> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {(property.latitude && property.longitude) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Location</h2>
              <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                <MapPin size={20} className="mr-2" />
                {property.area}, {property.city} — {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Price card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatFullPrice(property.price)}</p>
            <p className="text-xs text-gray-500 mb-5">₦{Math.round(property.price / property.sqft).toLocaleString()} / sqft</p>

            <div className="space-y-2">
              <button onClick={() => setShowSchedule(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Calendar size={16} /> Schedule Viewing
              </button>
              <button onClick={() => setShowContact(true)} className="w-full py-3 border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <MessageSquare size={16} /> Message Agent
              </button>
              <button onClick={toggleSave} className={cn('w-full py-3 border rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
                saved ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>
                <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Agent card */}
          {property.agent && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Listed by</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                  {property.agent.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{property.agent.full_name}</p>
                  {property.agent.is_verified && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={11} /> Verified Agent</p>
                  )}
                </div>
              </div>
              {property.agent.phone && (
                <a href={`tel:${property.agent.phone}`} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Phone size={14} /> {property.agent.phone}
                </a>
              )}
            </div>
          )}

          {/* Details summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="font-semibold text-gray-900 mb-3">Property Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{property.property_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize">{property.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Beds</span><span className="font-medium">{property.beds}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Baths</span><span className="font-medium">{property.baths}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium">{property.sqft.toLocaleString()} sqft</span></div>
              {property.year_built && <div className="flex justify-between"><span className="text-gray-500">Year Built</span><span className="font-medium">{property.year_built}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Commission</span><span className="font-medium">{property.commission_pct}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Views</span><span className="font-medium">{property.view_count || 0}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 py-8 w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Similar Properties in {property.city}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      <Footer />

      {/* Schedule Viewing Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Schedule a Viewing</h3>
              <button onClick={() => setShowSchedule(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Time</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={scheduleViewing} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                Confirm Viewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Agent Modal */}
      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Contact Agent</h3>
              <button onClick={() => setShowContact(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                About: <strong>{property.title}</strong> · {formatPrice(property.price)}
              </p>
              <textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)}
                rows={4} placeholder="Hi, I'm interested in this property and would like more information..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <button onClick={sendContactMessage} disabled={sendingMsg || !contactMsg.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {sendingMsg ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Sending...</> : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
