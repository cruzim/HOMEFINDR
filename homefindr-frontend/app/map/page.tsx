'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, List, X, ChevronDown, Heart, BedDouble, Bath, Maximize, MapPin } from 'lucide-react';
import { PROPERTIES } from '@/data/mock';
import { formatPrice, cn } from '@/lib/utils';
import type { Property } from '@/types';

export default function MapPage() {
  const [selected, setSelected] = useState<Property | null>(null);
  const [showList, setShowList] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  function toggleSave(id: string) { setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left list panel */}
      <div className={cn('w-80 shrink-0 bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm', !showList && 'hidden md:flex')}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900">Austin, TX</h2>
            <div className="flex gap-1">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M5 7h4M7 5v4" strokeWidth="1.5" stroke="currentColor" /></svg>
              </button>
              <button onClick={() => setShowList(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                <X size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">{PROPERTIES.length} homes found in this area</p>

          {/* Filter chips */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {['Price', 'Beds/Baths', 'Home Type', 'More'].map(f => (
              <button key={f} className="shrink-0 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                {f} <ChevronDown size={11} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {PROPERTIES.map(p => (
            <button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={cn('w-full flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left', selected?.id === p.id && 'bg-blue-50 hover:bg-blue-50')}>
              <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0">
                <Image src={p.images[0]} alt={p.address} fill className="object-cover" />
                <button onClick={e => { e.stopPropagation(); toggleSave(p.id); }}
                  className={cn('absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center', saved.includes(p.id) ? 'bg-white text-red-500' : 'bg-white/80 text-gray-500')}>
                  <Heart size={11} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="font-bold text-sm text-gray-900">{formatPrice(p.price)}</p>
                  {p.badge === 'new' && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded-full shrink-0">NEW</span>}
                </div>
                <p className="text-xs text-gray-700 truncate font-medium">{p.address}</p>
                <p className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin size={10} />{p.zip}, {p.city}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.beds} bds · {p.baths} ba · {p.sqft.toLocaleString()} sqft</p>
              </div>
            </button>
          ))}

          <div className="p-6 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin size={18} className="text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Keep exploring</p>
            <p className="text-xs text-gray-500 mb-3">Zoom out or move the map to discover more listings in surrounding neighbourhoods.</p>
            <Link href="/search" className="text-xs font-semibold text-blue-600 hover:underline">Switch to list view</Link>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Realistic aerial map image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80"
            alt="City aerial map"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-blue-900/10" />
        </div>

        {/* Map overlays - price pins */}
        <div className="absolute inset-0">
          {PROPERTIES.map((p, i) => {
            const positions = [
              { top: '35%', left: '42%' }, { top: '22%', left: '60%' }, { top: '48%', left: '55%' },
              { top: '60%', left: '35%' }, { top: '30%', left: '28%' }, { top: '55%', left: '68%' },
              { top: '70%', left: '48%' }, { top: '42%', left: '75%' }, { top: '25%', left: '80%' },
            ];
            const pos = positions[i % positions.length];
            const isSelected = selected?.id === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(s => s?.id === p.id ? null : p)}
                style={{ top: pos.top, left: pos.left }}
                className={cn('absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all',
                  isSelected ? 'z-20 scale-110' : 'hover:z-20 hover:scale-105')}>
                <span className={cn('block px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap',
                  isSelected ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 hover:bg-blue-600 hover:text-white')}>
                  {formatPrice(p.price)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top map controls */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <div className="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="m11 11 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <input placeholder="Search neighbourhood, school, or city..." className="text-sm text-gray-700 outline-none w-56" />
          </div>
          <button className="flex items-center gap-1.5 bg-white rounded-xl shadow-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* Right map controls */}
        <div className="absolute right-4 top-16 z-20 flex flex-col gap-2">
          {['+', '−'].map(c => (
            <button key={c} className="w-9 h-9 bg-white rounded-xl shadow-lg text-gray-700 font-bold text-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              {c}
            </button>
          ))}
          <button className="w-9 h-9 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="#374151" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Selected property popup */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-80 animate-slide-up">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="relative h-40">
                <Image src={selected.images[0]} alt={selected.address} fill className="object-cover" />
                {selected.badge === 'new' && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full">Just Listed</span>}
                <button onClick={() => setSelected(null)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700">
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(selected.price)}</p>
                    <p className="text-xs text-gray-500">{selected.address}, {selected.city}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-xs">★</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                  <span className="flex items-center gap-1"><BedDouble size={12} className="text-blue-500" />{selected.beds} bds</span>
                  <span className="flex items-center gap-1"><Bath size={12} className="text-blue-500" />{selected.baths} ba</span>
                  <span className="flex items-center gap-1"><Maximize size={12} className="text-blue-500" />{selected.sqft.toLocaleString()} sqft</span>
                </div>
                <Link href={`/listing/${selected.id}`} className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm text-center rounded-xl transition-colors">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile toggle */}
        <button onClick={() => setShowList(s => !s)} className="absolute bottom-4 right-4 md:hidden z-20 flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-full shadow-xl text-sm font-semibold">
          <List size={15} /> {showList ? 'Hide' : 'Show'} List
        </button>

        {/* Map attribution */}
        <p className="absolute bottom-1 left-1 text-[9px] text-white/60 z-10">Map data © 2024 HomeFindr · Terms of Use</p>
        <p className="absolute bottom-1 right-1 text-[9px] text-white/80 z-10 font-semibold">LIVE MARKET DATA ACTIVE</p>
      </div>
    </div>
  );
}
