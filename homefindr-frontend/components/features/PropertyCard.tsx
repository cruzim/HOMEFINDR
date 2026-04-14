'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, BedDouble, Bath, Maximize, MapPin } from 'lucide-react';
import { useState } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import { properties, type Property } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  property: Property;
  onSaveToggle?: (id: string, saved: boolean) => void;
}

export default function PropertyCard({ property: p, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(p.is_saved ?? false);
  const [savingToggle, setSavingToggle] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (savingToggle) return;
    setSavingToggle(true);
    try {
      if (saved) {
        await properties.unsave(p.id);
        setSaved(false);
        toast.success('Removed from saved');
      } else {
        await properties.save(p.id);
        setSaved(true);
        toast.success('Saved!');
      }
      onSaveToggle?.(p.id, !saved);
    } catch {
      // If not logged in, redirect to login
      toast.error('Sign in to save listings');
    } finally {
      setSavingToggle(false);
    }
  }

  const image = p.images?.[0];
  const badge = p.status === 'active' && isNew(p.created_at) ? 'new' : p.status;

  return (
    <Link href={`/listing/${p.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image src={image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-blue-400 text-sm">No photo</span>
          </div>
        )}

        {/* Badge */}
        {badge === 'new' && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full">NEW</span>
        )}
        {p.virtual_tour_url && (
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-purple-600 text-white rounded-full">VIRTUAL TOUR</span>
        )}

        {/* Save button */}
        <button
          onClick={toggleSave}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm',
            saved ? 'bg-white text-red-500' : 'bg-white/80 text-gray-500 hover:text-red-400',
          )}
        >
          <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-gray-900 text-base">{formatPrice(p.price)}</p>
          {p.status !== 'active' && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0',
              p.status === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600')}>
              {p.status}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-gray-800 truncate">{p.title || p.address}</p>
        <p className="text-xs text-gray-500 flex items-center gap-0.5 mt-0.5 truncate">
          <MapPin size={10} className="shrink-0" />{p.area}, {p.city}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
          <span className="flex items-center gap-1"><BedDouble size={12} className="text-blue-500" />{p.beds} bds</span>
          <span className="flex items-center gap-1"><Bath size={12} className="text-blue-500" />{p.baths} ba</span>
          <span className="flex items-center gap-1"><Maximize size={12} className="text-blue-500" />{p.sqft.toLocaleString()} sqft</span>
        </div>

        {p.agent && (
          <p className="text-xs text-gray-400 mt-2 truncate">Listed by {p.agent.full_name}</p>
        )}
      </div>
    </Link>
  );
}

function isNew(dateStr: string): boolean {
  const created = new Date(dateStr);
  const diff = Date.now() - created.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
}
