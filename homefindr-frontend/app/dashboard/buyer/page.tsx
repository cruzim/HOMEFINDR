'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Heart, Calendar, MessageSquare, TrendingUp, MapPin } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { properties as api, viewings as viewApi, offers as offerApi, type Property, type Viewing, type Offer } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function BuyerDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [saved, setSaved] = useState<Property[]>([]);
  const [upcoming, setUpcoming] = useState<Viewing[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      Promise.all([
        api.saved().catch(() => [] as Property[]),
        viewApi.list().catch(() => [] as Viewing[]),
        offerApi.list().catch(() => [] as Offer[]),
      ]).then(([savedRes, viewRes, offerRes]) => {
        setSaved((savedRes as Property[]).slice(0, 3));
        // 'scheduled' is the correct initial status — not 'pending'
        setUpcoming(
          (viewRes as Viewing[])
            .filter(v => v.status === 'scheduled' || v.status === 'confirmed')
            .slice(0, 3)
        );
        setMyOffers((offerRes as Offer[]).slice(0, 3));
      }).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const firstName = user.full_name.split(' ')[0];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-1">Here&apos;s your home search activity</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Saved Listings', value: saved.length, icon: Heart, color: 'text-red-500 bg-red-50', href: '/favorites' },
              { label: 'Upcoming Viewings', value: upcoming.length, icon: Calendar, color: 'text-blue-500 bg-blue-50', href: '/schedule' },
              { label: 'Active Offers', value: myOffers.filter(o => o.status === 'sent').length, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50', href: '/offers' },
              { label: 'Messages', value: 0, icon: MessageSquare, color: 'text-purple-500 bg-purple-50', href: '/messages' },
            ].map(s => (
              <Link key={s.label} href={s.href} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{fetching ? '–' : s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Quick search */}
          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-1">Continue your search</h2>
            <p className="text-blue-100 text-sm mb-4">Find your perfect home across Nigeria</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="City, area, or address..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
                  onKeyDown={e => e.key === 'Enter' && router.push(`/search?location=${encodeURIComponent((e.target as HTMLInputElement).value)}`)} />
              </div>
              <Link href="/search" className="px-4 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors">
                Search
              </Link>
            </div>
          </div>

          {/* Saved listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Saved Listings</h2>
              <Link href="/favorites" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {fetching ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : saved.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                <Heart size={32} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">No saved listings yet</p>
                <Link href="/search" className="text-xs text-blue-600 hover:underline mt-1 block">Browse properties</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {saved.map(p => (
                  <Link key={p.id} href={`/listing/${p.id}`} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.title || p.address}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin size={10} />{p.area}, {p.city}</p>
                    </div>
                    <p className="font-bold text-blue-600 text-sm shrink-0">{formatPrice(p.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming viewings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Upcoming Viewings</h2>
              <Link href="/schedule" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {fetching ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400">
                <Calendar size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No upcoming viewings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(v => (
                  <div key={v.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Property Viewing</p>
                      <p className="text-xs text-gray-500">{formatDate(v.scheduled_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      v.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Offers */}
          {myOffers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">My Offers</h2>
                <Link href="/offers" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {myOffers.map(o => (
                  <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(o.offer_price)}</p>
                      <p className="text-xs text-gray-500">Submitted {formatDate(o.created_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      o.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                      o.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}