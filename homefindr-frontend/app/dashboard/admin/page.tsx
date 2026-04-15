'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Home, TrendingUp, ShieldCheck, Eye, CheckCircle, XCircle } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { properties as propApi, type Property } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allListings, setAllListings] = useState<Property[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics'>('listings');

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard/buyer'); return;
    }
    if (user) {
      propApi.list({ page_size: 50 }).then(res => setAllListings(res.items)).catch(() => {}).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const active = allListings.filter(p => p.status === 'active').length;
  const pending = allListings.filter(p => p.status === 'pending').length;
  const sold = allListings.filter(p => p.status === 'sold').length;
  const totalViews = allListings.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform overview and management tools.</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: active, icon: Home, color: 'text-blue-600 bg-blue-50' },
              { label: 'Pending Review', value: pending, icon: ShieldCheck, color: 'text-orange-600 bg-orange-50' },
              { label: 'Sold Properties', value: sold, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600 bg-purple-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{fetching ? '–' : value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['listings', 'analytics'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
                  activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">All Listings</h2>
                <span className="text-xs text-gray-500">{allListings.length} total</span>
              </div>

              {fetching ? (
                <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : allListings.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Home size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">No listings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Property</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Price</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Views</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Listed</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allListings.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[150px]">{p.title || p.address}</p>
                                <p className="text-xs text-gray-500">{p.area}, {p.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-900">{formatPrice(p.price)}</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', getStatusColor(p.status))}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{p.view_count || 0}</td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/listing/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> Listing Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Active', count: active, color: 'bg-emerald-500' },
                    { label: 'Pending', count: pending, color: 'bg-orange-500' },
                    { label: 'Sold', count: sold, color: 'bg-gray-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{s.label}</span>
                        <span className="font-semibold text-gray-900">{s.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`}
                          style={{ width: `${allListings.length ? (s.count / allListings.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Home size={16} className="text-blue-500" /> Top Cities</h3>
                <div className="space-y-2">
                  {Object.entries(
                    allListings.reduce((acc: Record<string, number>, p) => { acc[p.city] = (acc[p.city] || 0) + 1; return acc; }, {})
                  ).sort(([, a], [, b]) => b - a).slice(0, 5).map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{city}</span>
                      <span className="font-semibold text-gray-900 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}