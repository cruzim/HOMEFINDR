'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Map, List, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import PropertyCard from '@/components/features/PropertyCard';
import Footer from '@/components/layout/Footer';
import { PROPERTIES } from '@/data/mock';
import { cn, formatPrice, PROPERTY_TYPES, AMENITIES_LIST } from '@/lib/utils';
import type { Property, SearchFilters } from '@/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-match', label: 'Best Match' },
];

const BED_OPTIONS = ['Any', '1+', '2+', '3+', '4+'];
const BATH_OPTIONS = ['Any', '1+', '2+', '3+', '4+'];

function FilterSidebar({ filters, onChange }: { filters: SearchFilters; onChange: (f: SearchFilters) => void }) {
  const [priceOpen, setPriceOpen] = useState(true);
  const [bedsOpen, setBedsOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

  function set(key: keyof SearchFilters, val: unknown) {
    onChange({ ...filters, [key]: val });
  }

  return (
    <div className="w-full space-y-4">
      {/* Price Range */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setPriceOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
          Price Range {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {priceOpen && (
          <div className="px-4 pb-4 space-y-3">
            <input type="range" min={0} max={2000000000} step={10000000} value={filters.maxPrice ?? 2000000000}
              onChange={e => set('maxPrice', Number(e.target.value))}
              className="w-full h-1.5 bg-blue-100 rounded-full accent-blue-600 cursor-pointer price-slider" />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Min</label>
                <input type="text" value={`₦${(filters.minPrice ?? 0).toLocaleString('en-NG')}`}
                  onChange={e => set('minPrice', Number(e.target.value.replace(/[^0-9]/g, '')))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Max</label>
                <input type="text" value={`₦${(filters.maxPrice ?? 2000000000).toLocaleString('en-NG')}`}
                  onChange={e => set('maxPrice', Number(e.target.value.replace(/[^0-9]/g, '')))}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Beds & Baths */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setBedsOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
          Beds &amp; Baths {bedsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {bedsOpen && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Bedrooms</p>
              <div className="flex gap-1.5 flex-wrap">
                {BED_OPTIONS.map(b => (
                  <button key={b} onClick={() => set('beds', b === 'Any' ? undefined : parseInt(b))}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', (filters.beds === undefined && b === 'Any') || (filters.beds && `${filters.beds}+` === b) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Bathrooms</p>
              <div className="flex gap-1.5 flex-wrap">
                {BATH_OPTIONS.map(b => (
                  <button key={b} onClick={() => set('baths', b === 'Any' ? undefined : parseInt(b))}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all', (filters.baths === undefined && b === 'Any') ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Type */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setTypeOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
          Property Type {typeOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {typeOpen && (
          <div className="px-4 pb-4 space-y-2">
            {PROPERTY_TYPES.map(t => {
              const selected = filters.propertyTypes?.includes(t);
              return (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!selected}
                    onChange={() => {
                      const cur = filters.propertyTypes ?? [];
                      set('propertyTypes', selected ? cur.filter(x => x !== t) : [...cur, t]);
                    }}
                    className="w-3.5 h-3.5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Must Haves */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <button onClick={() => setMoreOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900">
          Must Haves {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {moreOpen && (
          <div className="px-4 pb-4 space-y-2">
            {AMENITIES_LIST.slice(0, 6).map(a => {
              const selected = filters.amenities?.includes(a);
              return (
                <label key={a} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!selected}
                    onChange={() => {
                      const cur = filters.amenities ?? [];
                      set('amenities', selected ? cur.filter(x => x !== a) : [...cur, a]);
                    }}
                    className="w-3.5 h-3.5 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">{a}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors">
        Update Results
      </button>
    </div>
  );
}

function applyFilters(properties: Property[], filters: SearchFilters, query: string): Property[] {
  return properties.filter(p => {
    if (query && !`${p.address} ${p.city} ${p.state} ${p.zip}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (filters.minPrice && p.price < filters.minPrice) return false;
    if (filters.maxPrice && p.price > filters.maxPrice) return false;
    if (filters.beds && p.beds < filters.beds) return false;
    if (filters.baths && p.baths < filters.baths) return false;
    if (filters.propertyTypes?.length && !filters.propertyTypes.includes(p.propertyType)) return false;
    if (filters.amenities?.length && !filters.amenities.every(a => p.amenities.includes(a))) return false;
    return true;
  });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get('location') ?? '';

  const [filters, setFilters] = useState<SearchFilters>({ sortBy: 'newest' });
  const [sort, setSort] = useState('newest');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = applyFilters(PROPERTIES, filters, location);
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    return b.daysOnMarket - a.daysOnMarket;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-[1440px] mx-auto w-full px-4 py-6 flex-1">
        {/* Breadcrumb */}
        <p className="text-sm text-gray-500 mb-2">
          Home / Nigeria {location && `/ ${location}`}
        </p>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {filtered.length.toLocaleString()} Homes for Sale{location ? ` in ${location}` : ' in Nigeria'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Sorted by Newest Listings First</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/map" className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Map size={15} /> Map
            </Link>
            <button onClick={() => setLayout('list')} className={cn('p-2 rounded-lg border transition-colors', layout === 'list' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
              <List size={16} />
            </button>
            <button onClick={() => setLayout('grid')} className={cn('p-2 rounded-lg border transition-colors', layout === 'grid' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="0" y="0" width="7" height="7" rx="1" /><rect x="9" y="0" width="7" height="7" rx="1" />
                <rect x="0" y="9" width="7" height="7" rx="1" /><rect x="9" y="9" width="7" height="7" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-sm font-medium text-gray-700">{filtered.length} shown</span>
          {location && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
              {location} <button onClick={() => {}}><X size={12} /></button>
            </span>
          )}
          {filters.minPrice && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
              From {formatPrice(filters.minPrice)} <button onClick={() => setFilters(f => ({ ...f, minPrice: undefined }))}><X size={12} /></button>
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters – desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={setFilters} />
          </div>

          {/* Mobile filter button */}
          <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
            <button onClick={() => setShowFiltersDrawer(true)} className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-full shadow-xl text-sm font-semibold">
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search size={40} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No properties found</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">Try expanding your search area or removing some filters to see more results.</p>
                <button onClick={() => setFilters({})} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Reset all filters
                </button>
              </div>
            ) : (
              <>
                <div className={cn(layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4')}>
                  {sorted.map(p => <PropertyCard key={p.id} property={p} layout={layout} />)}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 mt-10">
                  {[1, 2, 3, '...', 12].map((p, i) => (
                    <button key={i} onClick={() => typeof p === 'number' && setPage(p)}
                      className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-all', p === page ? 'bg-blue-600 text-white' : p === '...' ? 'text-gray-400 cursor-default' : 'border border-gray-200 text-gray-700 hover:bg-gray-50')}>
                      {p}
                    </button>
                  ))}
                  <button className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center">
                    <ChevronDown size={16} className="-rotate-90" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Market stats bar */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'MEDIAN LIST PRICE', value: '₦180M', sub: '↑ 12.5% from last month' },
              { label: 'AVG. DAYS ON MARKET', value: '45 Days', sub: 'Active inventory' },
              { label: 'LIST TO SOLD RATIO', value: '97.2%', sub: 'Competitive market' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-blue-400">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFiltersDrawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFiltersDrawer(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-50 rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setShowFiltersDrawer(false)}><X size={20} /></button>
            </div>
            <FilterSidebar filters={filters} onChange={f => { setFilters(f); setShowFiltersDrawer(false); }} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
