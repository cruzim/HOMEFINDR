'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Search, X, ChevronDown } from 'lucide-react';
import PropertyCard from '@/components/features/PropertyCard';
import Footer from '@/components/layout/Footer';
import { properties as api, type Property, type PropertyFilters } from '@/lib/api';
import { formatPrice, NIGERIAN_CITIES, PROPERTY_TYPES } from '@/lib/utils';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [results, setResults] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<PropertyFilters>({
    city: searchParams.get('location') || '',
    min_price: undefined,
    max_price: undefined,
    beds: undefined,
    baths: undefined,
    property_type: '',
    sort_by: 'newest',
    page: 1,
    page_size: 20,
  });

  const fetchResults = useCallback(async (f: PropertyFilters) => {
    setLoading(true);
    try {
      const res = await api.list(f);
      setResults(res.items);
      setTotal(res.total);
      setPages(res.total_pages);
      setPage(res.page);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const location = searchParams.get('location') || '';
    const newFilters = { ...filters, city: location, page: 1 };
    setFilters(newFilters);
    fetchResults(newFilters);
  }, [searchParams]);

  function applyFilters() {
    const f = { ...filters, page: 1 };
    fetchResults(f);
    setShowFilters(false);
  }

  function clearFilters() {
    const f: PropertyFilters = { city: '', sort_by: 'newest', page: 1, page_size: 20 };
    setFilters(f);
    fetchResults(f);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-[1440px] mx-auto flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.city || ''}
              onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Search by city or area..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={() => setShowFilters(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={16} /> Filters
          </button>
          <button onClick={applyFilters}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 px-4 py-5">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">City</label>
                <select value={filters.city || ''} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any city</option>
                  {NIGERIAN_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Property Type</label>
                <select value={filters.property_type || ''} onChange={e => setFilters(f => ({ ...f, property_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Min Price (₦M)</label>
                <input type="number" placeholder="e.g. 50"
                  value={filters.min_price ? filters.min_price / 1_000_000 : ''}
                  onChange={e => setFilters(f => ({ ...f, min_price: e.target.value ? Number(e.target.value) * 1_000_000 : undefined }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Max Price (₦M)</label>
                <input type="number" placeholder="e.g. 500"
                  value={filters.max_price ? filters.max_price / 1_000_000 : ''}
                  onChange={e => setFilters(f => ({ ...f, max_price: e.target.value ? Number(e.target.value) * 1_000_000 : undefined }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Min Beds</label>
                <select value={filters.beds || ''} onChange={e => setFilters(f => ({ ...f, beds: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Sort by</label>
                <select value={filters.sort_by} onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={applyFilters} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Apply Filters</button>
              <button onClick={clearFilters} className="px-5 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1">
                <X size={14} /> Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {loading ? 'Searching...' : `${total.toLocaleString()} ${total === 1 ? 'property' : 'properties'} found`}
            </h1>
            {filters.city && <p className="text-sm text-gray-500">in {filters.city}</p>}
          </div>
        </div>

        {/* Results grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-gray-700 mb-2">No properties found</p>
            <p className="text-sm text-gray-500 mb-5">Try adjusting your filters or searching a different area.</p>
            <button onClick={clearFilters} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button disabled={page === 1} onClick={() => { const f = { ...filters, page: page - 1 }; setFilters(f); fetchResults(f); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => { const f = { ...filters, page: page + 1 }; setFilters(f); fetchResults(f); }}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}