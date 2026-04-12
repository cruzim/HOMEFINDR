'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Phone, MessageSquare, Calendar, MapPin, BedDouble, Bath, Maximize, Star, ChevronLeft, ChevronRight, CheckCircle, School, Coffee, X } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/features/PropertyCard';
import { PROPERTIES } from '@/data/mock';
import { formatPrice, formatFullPrice, formatDate, getBadgeColor, getBadgeLabel, getStatusColor } from '@/lib/utils';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const property = PROPERTIES.find(p => p.id === id) ?? PROPERTIES[0];
  const related = PROPERTIES.filter(p => p.id !== id && p.city === property.city).slice(0, 4);

  const [imgIndex, setImgIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  function prev() { setImgIndex(i => (i - 1 + property.images.length) % property.images.length); }
  function next() { setImgIndex(i => (i + 1) % property.images.length); }

  return (
    <div className="flex flex-col">
      {/* ── IMAGE GALLERY ─────────────────────────────────────── */}
      <section className="relative bg-black h-[420px] md:h-[560px]">
        <Image src={property.images[imgIndex]} alt={property.address} fill className="object-cover opacity-90" priority />

        {/* Nav arrows */}
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-10">
          <ChevronLeft size={20} />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-10">
          <ChevronRight size={20} />
        </button>

        {/* Badge */}
        {property.badge && (
          <span className={`absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full z-10 ${getBadgeColor(property.badge)}`}>
            {getBadgeLabel(property.badge)}
          </span>
        )}

        {/* Thumbnails */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {property.images.map((img, i) => (
            <button key={i} onClick={() => setImgIndex(i)}
              className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-white scale-110' : 'border-white/40'}`}>
              <Image src={img} alt="" width={56} height={40} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>

        {/* Photo count */}
        <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full z-10">
          {imgIndex + 1} / {property.images.length}
        </div>
      </section>

      {/* ── STICKY CTA STRIP ────────────────────────────────── */}
      <div className="sticky-cta px-4 py-3 hidden md:block">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">{formatFullPrice(property.price)}</span>
            {property.originalPrice && <span className="ml-3 text-sm text-gray-400 line-through">{formatFullPrice(property.originalPrice)}</span>}
            <span className={`ml-3 text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(property.status)}`}>
              {property.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSaved(s => !s)} className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${saved ? 'border-red-300 text-red-600 bg-red-50' : 'border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'}`}>
              <Heart size={15} fill={saved ? 'currentColor' : 'none'} /> Save
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Share2 size={15} /> Share
            </button>
            <a href={`tel:${property.agent.phone}`} className="flex items-center gap-1.5 px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100">
              <Phone size={15} /> Call Agent
            </a>
            <button onClick={() => setShowSchedule(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold text-white transition-colors">
              <Calendar size={15} /> Schedule Visit
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto w-full px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Headline */}
            <div>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">{property.address}, {property.zip}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${getStatusColor(property.status)}`}>
                  {property.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                <MapPin size={14} /> {property.city}, {property.state}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1.5 font-medium"><BedDouble size={16} className="text-blue-500" />{property.beds} Bedrooms</span>
                <span className="flex items-center gap-1.5 font-medium"><Bath size={16} className="text-blue-500" />{property.baths} Bathrooms</span>
                <span className="flex items-center gap-1.5 font-medium"><Maximize size={16} className="text-blue-500" />{property.sqft.toLocaleString()} sqft</span>
                {property.lotSize && <span className="flex items-center gap-1.5 font-medium">🏡 {property.lotSize} acres lot</span>}
                {property.yearBuilt && <span className="flex items-center gap-1.5 font-medium">📅 Built {property.yearBuilt}</span>}
              </div>
            </div>

            {/* Price history */}
            {property.priceHistory.length > 1 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Price History</h2>
                <div className="space-y-2">
                  {property.priceHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="text-gray-500">{formatDate(h.date)}</span>
                      <span className="text-gray-600">{h.event}</span>
                      <span className="font-semibold text-gray-900">{formatFullPrice(h.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this Property</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {property.highlights.map(h => (
                  <span key={h} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                    <CheckCircle size={11} /> {h}
                  </span>
                ))}
              </div>
              <p className={`text-sm text-gray-600 leading-relaxed ${!descExpanded ? 'line-clamp-3' : ''}`}>
                {property.description}
              </p>
              <button onClick={() => setDescExpanded(d => !d)} className="text-sm font-semibold text-blue-600 hover:underline mt-2">
                {descExpanded ? 'Show less' : 'Read more'}
              </button>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Features &amp; Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {property.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-blue-500 shrink-0" /> {a}
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
              <div className="rounded-xl overflow-hidden h-64 bg-gray-100 relative border border-gray-200">
                <Image src={`https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=800&height=400&center=lonlat:${property.lng},${property.lat}&zoom=14&marker=lonlat:${property.lng},${property.lat};color:%232563eb;size:large&apiKey=YOUR_KEY`}
                  alt="Map location"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=800&q=70';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 flex items-end p-3">
                  <p className="text-xs text-white bg-black/50 px-2 py-1 rounded">{property.address}, {property.city}</p>
                </div>
              </div>
            </div>

            {/* Schools */}
            {property.schools && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Nearby Schools</h2>
                <div className="space-y-2">
                  {property.schools.map(s => (
                    <div key={s.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <School size={16} className="text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.type} · {s.distance}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-700">{s.rating}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby amenities */}
            {property.nearbyAmenities && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Nearby Amenities</h2>
                <div className="grid grid-cols-2 gap-2">
                  {property.nearbyAmenities.map(a => (
                    <div key={a.name} className="flex items-center gap-2 p-3 border border-gray-100 rounded-xl">
                      <Coffee size={15} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.type} · {a.distance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sticky column */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4">
            {/* Price card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card sticky top-24">
              <p className="text-2xl font-bold text-gray-900 mb-0.5">{formatFullPrice(property.price)}</p>
              {property.originalPrice && <p className="text-sm text-gray-400 line-through mb-1">{formatFullPrice(property.originalPrice)}</p>}
              <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><MapPin size={11} /> {property.zip}, {property.city}, {property.state}</p>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 mb-4 text-center">
                <div><p className="text-base font-bold text-gray-900">{property.beds}</p><p className="text-xs text-gray-500">Beds</p></div>
                <div><p className="text-base font-bold text-gray-900">{property.baths}</p><p className="text-xs text-gray-500">Baths</p></div>
                <div><p className="text-base font-bold text-gray-900">{(property.sqft / 1000).toFixed(1)}k</p><p className="text-xs text-gray-500">sqft</p></div>
              </div>

              <button onClick={() => setShowSchedule(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mb-3 transition-colors">
                Schedule a Viewing
              </button>
              <Link href={`/offers?propertyId=${property.id}`} className="block w-full py-3 border border-blue-200 text-blue-700 font-semibold rounded-xl text-center hover:bg-blue-50 transition-colors mb-3 text-sm">
                Make an Offer
              </Link>
              <div className="flex gap-2">
                <a href={`tel:${property.agent.phone}`} className="flex-1 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl text-center text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                  <Phone size={13} /> Call
                </a>
                <Link href="/messages" className="flex-1 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl text-center text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
                  <MessageSquare size={13} /> Message
                </Link>
              </div>

              {/* Agent card */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                    <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
                    {property.agent.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{property.agent.name}</p>
                    <p className="text-xs text-gray-500">{property.agent.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-700">{property.agent.rating}</span>
                      <span className="text-xs text-gray-400">({property.agent.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[{ label: 'SECURE BOOKING' }, { label: 'VERIFIED AGENT' }].map(b => (
                  <div key={b.label} className="flex items-center justify-center gap-1.5 p-2 border border-gray-100 rounded-lg">
                    <CheckCircle size={13} className="text-blue-500" />
                    <span className="text-[10px] font-semibold text-gray-600">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── OPEN HOUSES ─────────────────────────────────────── */}
      {property.openHouses && property.openHouses.length > 0 && (
        <section className="bg-blue-50 py-8">
          <div className="max-w-[1440px] mx-auto px-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Open Houses</h2>
            <div className="flex flex-wrap gap-3">
              {property.openHouses.map((oh, i) => (
                <div key={i} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <Calendar size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(oh.date)}</p>
                    <p className="text-xs text-gray-500">{oh.startTime} – {oh.endTime}</p>
                  </div>
                  <button onClick={() => setShowSchedule(true)} className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SIMILAR LISTINGS ─────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-14">
          <div className="max-w-[1440px] mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Properties in {property.city}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* ── SCHEDULE MODAL ────────────────────────────────── */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSchedule(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <button onClick={() => setShowSchedule(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Schedule a Viewing</h2>
            <p className="text-sm text-gray-500 mb-5">Choose a convenient time to view {property.address}.</p>
            <Link href={`/schedule/${property.id}`} className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center transition-colors">
              Continue to Booking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
