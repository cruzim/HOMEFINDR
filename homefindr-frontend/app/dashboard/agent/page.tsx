'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Eye, Heart, TrendingUp, MessageSquare, MapPin } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { properties as api, offers as offerApi, type Property, type Offer } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor, getOfferStatusColor } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AgentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [myListings, setMyListings] = useState<Property[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && user.role !== 'agent' && user.role !== 'admin') {
      router.push('/dashboard/buyer'); return;
    }
    if (user) {
      Promise.all([
        api.myListings().catch(() => []),
        offerApi.list().catch(() => []),
      ]).then(([listings, offs]) => {
        setMyListings(Array.isArray(listings) ? listings as Property[] : []);
        setOffers(Array.isArray(offs) ? offs as Offer[] : []);
      }).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const totalViews = myListings.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalSaves = myListings.reduce((sum, p) => sum + (p.save_count || 0), 0);
  const activeListings = myListings.filter(p => p.status === 'active').length;
  const pendingOffers = offers.filter(o => o.status === 'sent').length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user.full_name.split(' ')[0]}</p>
            </div>
            <Link href="/listing/create" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus size={16} /> New Listing
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: activeListings, icon: MapPin, color: 'text-blue-500 bg-blue-50' },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-purple-500 bg-purple-50' },
              { label: 'Total Saves', value: totalSaves, icon: Heart, color: 'text-red-500 bg-red-50' },
              { label: 'Pending Offers', value: pendingOffers, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{fetching ? '–' : s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* My Listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">My Listings</h2>
              <Link href="/listing/create" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={14} /> Add listing
              </Link>
            </div>

            {fetching ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : myListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={24} className="text-blue-500" />
                </div>
                <p className="font-semibold text-gray-900 mb-2">No listings yet</p>
                <p className="text-sm text-gray-500 mb-5">Create your first listing to start getting leads</p>
                <Link href="/listing/create" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700">
                  Create Listing
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Views</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myListings.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[160px]">{p.title || p.address}</p>
                              <p className="text-xs text-gray-500">{p.area}, {p.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-900">{formatPrice(p.price)}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getStatusColor(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{p.view_count || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link href={`/listing/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Offers received */}
          {offers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Offers Received</h2>
                <Link href="/offers" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {offers.slice(0, 5).map(o => (
                  <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{formatPrice(o.offer_price)}</p>
                      <p className="text-xs text-gray-500">Received {formatDate(o.created_at)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getOfferStatusColor(o.status)}`}>
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