'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, List, X, ChevronDown, Heart, BedDouble, Bath, Maximize, MapPin, Search } from 'lucide-react';
import { properties as api, type Property } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState<Property | null>(null);
  const [showList, setShowList] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.list({ page_size: 50 }).then(res => {
      setAllProperties(res.items);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Init Mapbox after properties load
  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapRef.current || mapInstanceRef.current) return;
    if (allProperties.length === 0 && !loading) return;

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [3.3792, 6.5244], // Lagos
        zoom: 11,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'right');
      mapInstanceRef.current = map;

      map.on('load', () => {
        // Add markers for each property
        allProperties.forEach(p => {
          if (!p.latitude || !p.longitude) return;

          const el = document.createElement('div');
          el.className = 'mapbox-price-pin';
          el.style.cssText = `
            background: white; color: #111827; padding: 5px 10px;
            border-radius: 20px; font-size: 11px; font-weight: 700;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;
            white-space: nowrap; border: 2px solid transparent;
            transition: all 0.15s;
          `;
          el.textContent = formatPrice(p.price);

          el.addEventListener('click', () => {
            setSelected(prev => prev?.id === p.id ? null : p);
            el.style.background = '#2563eb';
            el.style.color = 'white';
          });

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([p.longitude, p.latitude])
            .addTo(map as never);

          markersRef.current.push(marker);
        });
      });
    }).catch(() => {
      // Mapbox not available
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [allProperties, loading]);

  function toggleSave(id: string) {
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  const filtered = search
    ? allProperties.filter(p =>
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.area.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
      )
    : allProperties;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left list panel */}
      <div className={cn('w-80 shrink-0 bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm', !showList && 'hidden md:flex')}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900">
              {loading ? 'Loading...' : `${filtered.length} homes found`}
            </h2>
            <button onClick={() => setShowList(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Active listings across Nigeria</p>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by city or area..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
            {['Price', 'Beds/Baths', 'Home Type'].map(f => (
              <button key={f} className="shrink-0 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors">
                {f} <ChevronDown size={11} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MapPin size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No listings found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          ) : (
            filtered.map(p => (
              <button key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                className={cn('w-full flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left', selected?.id === p.id && 'bg-blue-50 hover:bg-blue-50')}>
                <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {p.images?.[0] && (
                    <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                  )}
                  <button onClick={e => { e.stopPropagation(); toggleSave(p.id); }}
                    className={cn('absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center', saved.includes(p.id) ? 'bg-white text-red-500' : 'bg-white/80 text-gray-500')}>
                    <Heart size={11} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="font-bold text-sm text-gray-900">{formatPrice(p.price)}</p>
                    {p.status !== 'active' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">{p.status}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 truncate font-medium">{p.title || p.address}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin size={10} />{p.area}, {p.city}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.beds} bds · {p.baths} ba · {p.sqft.toLocaleString()} sqft</p>
                </div>
              </button>
            ))
          )}

          <div className="p-6 text-center">
            <Link href="/search" className="text-xs font-semibold text-blue-600 hover:underline">Switch to list view</Link>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative overflow-hidden">
        {MAPBOX_TOKEN ? (
          <div ref={mapRef} className="absolute inset-0" />
        ) : (
          /* Fallback image when no Mapbox token */
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80"
              alt="City aerial map"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-blue-900/10" />
            {/* Fake price pins */}
            <div className="absolute inset-0">
              {filtered.slice(0, 12).map((p, i) => {
                const positions = [
                  { top: '35%', left: '42%' }, { top: '22%', left: '60%' }, { top: '48%', left: '55%' },
                  { top: '60%', left: '35%' }, { top: '30%', left: '28%' }, { top: '55%', left: '68%' },
                  { top: '70%', left: '48%' }, { top: '42%', left: '75%' }, { top: '25%', left: '80%' },
                  { top: '15%', left: '45%' }, { top: '65%', left: '20%' }, { top: '80%', left: '62%' },
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800 font-medium">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the interactive map
            </div>
          </div>
        )}

        {/* Map controls overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${filtered.length} listings`}
            </span>
          </div>
        </div>

        {/* Selected property popup */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-80">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="relative h-40 bg-gray-100">
                {selected.images?.[0] && (
                  <Image src={selected.images[0]} alt={selected.title} fill className="object-cover" />
                )}
                <button onClick={() => setSelected(null)} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-lg font-bold text-gray-900">{formatPrice(selected.price)}</p>
                <p className="text-xs text-gray-500 mb-2">{selected.address}, {selected.city}</p>
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

        <button onClick={() => setShowList(s => !s)} className="absolute bottom-4 right-4 md:hidden z-20 flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 text-white rounded-full shadow-xl text-sm font-semibold">
          <List size={15} /> {showList ? 'Hide' : 'Show'} List
        </button>
      </div>
    </div>
  );
}
