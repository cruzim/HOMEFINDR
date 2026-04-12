'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, BedDouble, Bath, Maximize, MapPin, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { Property } from '@/types';
import { cn, formatPrice, getBadgeColor, getBadgeLabel } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  layout?: 'grid' | 'list';
  className?: string;
}

export default function PropertyCard({ property, layout = 'grid', className }: PropertyCardProps) {
  const [saved, setSaved] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  function prev(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i - 1 + property.images.length) % property.images.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i + 1) % property.images.length);
  }
  function toggleSave(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setSaved(s => !s);
  }

  if (layout === 'list') {
    return (
      <Link href={`/listing/${property.id}`} className={cn('flex gap-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow p-3 group', className)}>
        <div className="relative w-48 h-36 rounded-lg overflow-hidden shrink-0">
          <Image src={property.images[0]} alt={property.address} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          {property.badge && (
            <span className={cn('absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full', getBadgeColor(property.badge))}>
              {getBadgeLabel(property.badge)}
            </span>
          )}
          {property.status === 'pending' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm bg-orange-500 px-3 py-1 rounded-full">PENDING</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xl font-bold text-gray-900">{formatPrice(property.price)}</p>
              {property.originalPrice && (
                <p className="text-xs text-gray-400 line-through">{formatPrice(property.originalPrice)}</p>
              )}
            </div>
            <button onClick={toggleSave} className={cn('p-1.5 rounded-full transition-colors shrink-0', saved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50')}>
              <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{property.address}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {property.zip}, {property.city}, {property.state}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1"><BedDouble size={13} className="text-blue-500" />{property.beds} Beds</span>
            <span className="flex items-center gap-1"><Bath size={13} className="text-blue-500" />{property.baths} Baths</span>
            <span className="flex items-center gap-1"><Maximize size={13} className="text-blue-500" />{property.sqft.toLocaleString()} sqft</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
              <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
            </div>
            <span className="text-xs text-gray-500">{property.agent.name}</span>
            <div className="flex items-center gap-0.5 ml-auto text-xs text-gray-500">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {property.agent.rating} ({property.agent.reviews})
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/listing/${property.id}`} className={cn('block bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 group', className)}>
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <Image src={property.images[imgIndex]} alt={property.address} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />

        {/* Badge */}
        {property.badge && (
          <span className={cn('absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide', getBadgeColor(property.badge))}>
            {getBadgeLabel(property.badge)}
          </span>
        )}

        {/* Pending overlay */}
        {property.status === 'pending' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold bg-orange-500 px-4 py-1.5 rounded-full">UNDER OFFER</span>
          </div>
        )}

        {/* Save button */}
        <button onClick={toggleSave} className={cn('absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all', saved ? 'bg-white text-red-500' : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500')}>
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {/* Carousel controls */}
        {property.images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft size={14} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {property.images.map((_, i) => (
                <span key={i} className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIndex ? 'bg-white' : 'bg-white/50')} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="text-lg font-bold text-gray-900 leading-tight">{formatPrice(property.price)}</p>
            {property.originalPrice && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(property.originalPrice)}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {property.agent.rating}
            <span className="text-gray-400">({property.agent.reviews})</span>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-800 truncate">{property.address}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 mb-3">
          <MapPin size={11} /> {property.zip}, {property.city}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-600 border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1"><BedDouble size={13} className="text-blue-500" />{property.beds} Beds</span>
          <span className="flex items-center gap-1"><Bath size={13} className="text-blue-500" />{property.baths} Baths</span>
          <span className="flex items-center gap-1"><Maximize size={13} className="text-blue-500" />{property.sqft.toLocaleString()} sqft</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
            <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
          </div>
          <span className="text-xs text-gray-500 truncate">{property.agent.name}</span>
          <Link href={`/listing/${property.id}`} className="ml-auto text-xs font-semibold text-blue-600 hover:underline shrink-0" onClick={e => e.stopPropagation()}>
            View Details
          </Link>
        </div>
      </div>
    </Link>
  );
}
