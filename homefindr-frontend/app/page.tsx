'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, TrendingUp, TrendingDown, ArrowRight, Star, CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/features/PropertyCard';
import { PROPERTIES, AGENTS, MARKET_DATA, NEIGHBORHOODS } from '@/data/mock';
import { formatPrice } from '@/lib/utils';

const LIFESTYLE_FILTERS = ['Gated Estate', 'Waterfront', 'Smart Home', 'Near School', 'City Centre', 'Quiet Neighborhood'];

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'buy' | 'rent' | 'sell'>('buy');
  const [location, setLocation] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?location=${encodeURIComponent(location || 'Lagos')}&type=${tab}`);
  }

  return (
    <div className="flex flex-col">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative h-[600px] md:h-[680px] flex items-center justify-center overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=85" alt="Luxury Nigerian home" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 text-balance">
            Discover a Place<br />You&apos;ll Love to Live
          </h1>
          <p className="text-white/80 text-base md:text-lg mb-8 max-w-md mx-auto">
            Join the most trusted community of homeowners and real estate professionals in Nigeria.
          </p>

          {/* Search card */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-xl mx-auto">
            {/* Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-3">
              {(['buy', 'rent', 'sell'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Enter city, neighbourhood, or zip..."
                  className="w-full pl-9 pr-3 py-3 text-sm text-gray-800 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button type="submit" className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shrink-0">
                <Search size={16} /> Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── HANDPICKED COLLECTIONS ──────────────────────────────── */}
      <section className="py-14 px-4 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Curated Selection</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Handpicked Collections</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            See all collections <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {NEIGHBORHOODS.map(n => (
            <Link key={n.name} href={`/search?location=${encodeURIComponent(n.name + ', ' + n.city)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] block">
              <Image src={n.image} alt={n.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-bold text-base">{n.name}</p>
                <p className="text-white/80 text-xs">{n.listings} listings</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ─────────────────────────────────── */}
      <section className="py-10 px-4 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Just Listed</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Properties</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {PROPERTIES.slice(0, 4).map(p => <PropertyCard key={p.id} property={p} />)}
        </div>
      </section>

      {/* ── MARKET PULSE ─────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Market Pulse</h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">Stay informed with the latest real estate trends and pricing data across major Nigerian cities.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {MARKET_DATA.map(m => (
              <div key={m.city} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">{m.city}</p>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${m.priceChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {m.priceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {Math.abs(m.priceChange)}%
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatPrice(m.medianPrice)}</p>
                <p className="text-xs text-gray-500">Median List Price</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Want professional insights?</p>
              <p className="text-sm text-gray-500">Get a detailed market analysis report for your neighbourhood.</p>
            </div>
            <button className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </section>

      {/* ── SEARCH BY LIFESTYLE ──────────────────────────────────── */}
      <section className="py-14 px-4 max-w-[1440px] mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Search by Lifestyle</h2>
        <div className="flex flex-wrap gap-3">
          {LIFESTYLE_FILTERS.map(f => (
            <Link key={f} href={`/search?amenity=${encodeURIComponent(f)}`}
              className="px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
              {f}
            </Link>
          ))}
        </div>
      </section>

      {/* ── TOP RATED PROFESSIONALS ──────────────────────────────── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Rated Professionals</h2>
              <p className="text-gray-500 text-sm mt-1">Work with the best in the industry to find your dream home.</p>
            </div>
            <Link href="/search" className="text-sm font-semibold text-blue-600 hover:underline hidden sm:flex items-center gap-1">
              View All Agents <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AGENTS.slice(0, 4).map(a => (
              <div key={a.id} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
                  <Image src={a.photo} alt={a.name} fill className="object-cover" />
                  {a.online && <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{a.name}</p>
                <p className="text-xs text-gray-500 mb-2">{a.title}</p>
                <div className="flex justify-center items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < Math.floor(a.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({a.reviews})</span>
                </div>
                <button className="w-full py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  Contact
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENT CTA ────────────────────────────────────────────── */}
      <section className="py-14 bg-blue-600">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Are you a real estate agent?</h2>
              <p className="text-blue-100 mb-6 max-w-md text-sm leading-relaxed">
                Join 50,000+ top-producing agents on HomeFindr and get more leads, streamline your workflow, and grow your business with our AI-powered tools.
              </p>
              <ul className="space-y-2 mb-8">
                {['Exclusive high-intent lead generation', 'Automated listing management system', 'Advanced client CRM & analytics dashboard', 'Verified professional profile badge'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-blue-50">
                    <CheckCircle size={16} className="text-blue-200 shrink-0" /> {i}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="inline-block px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Get Started Today
              </Link>
            </div>
            <div className="relative w-full max-w-sm h-64 lg:h-80 rounded-2xl overflow-hidden shrink-0">
              <Image src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80" alt="Real estate agent" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
