'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Home, TrendingUp, ShieldCheck, Eye, CheckCircle, XCircle, Star, Clock } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { properties as propApi, admin as adminApi, type Property } from '@/lib/api';
import { formatPrice, formatDate, getStatusColor, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeListings, setActiveListings] = useState<Property[]>([]);
  const [pendingListings, setPendingListings] = useState<Property[]>([]);
  const [stats, setStats] = useState<{ users: { total: number; buyers: number; agents: number }; listings: { active: number; pending_review: number }; activity: { total_offers: number; total_viewings: number }; revenue_naira: number } | null>(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'analytics'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setFetching(true);
    try {
      const [pending, active, statsData] = await Promise.all([
        adminApi.pendingListings().catch(() => [] as Property[]),
        propApi.list({ page_size: 100 }).then(r => r.items).catch(() => [] as Property[]),
        adminApi.stats().catch(() => null),
      ]);
      setPendingListings(pending);
      setActiveListings(active);
      setStats(statsData);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (!loading && user && user.role !== 'admin') {
      router.push('/dashboard/buyer'); return;
    }
    if (user) loadData();
  }, [user, loading, router, loadData]);

  async function handleApprove(id: string, title: string) {
    setActionLoading(id + '-approve');
    try {
      await adminApi.approveListing(id);
      toast.success(`"${title}" is now live`);
      // Move from pending to active locally
      const approved = pendingListings.find(p => p.id === id);
      if (approved) {
        setPendingListings(ps => ps.filter(p => p.id !== id));
        setActiveListings(as => [{ ...approved, status: 'active' }, ...as]);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string, title: string) {
    setActionLoading(id + '-reject');
    try {
      await adminApi.rejectListing(id);
      toast.success(`"${title}" rejected`);
      setPendingListings(ps => ps.filter(p => p.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleFeature(id: string) {
    setActionLoading(id + '-feature');
    try {
      await adminApi.featureListing(id);
      toast.success('Featured status toggled');
      setActiveListings(as => as.map(p => p.id === id ? { ...p, is_featured: !p.is_featured } : p));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle featured');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const totalViews = activeListings.reduce((sum, p) => sum + (p.view_count || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform overview and listing moderation.</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: stats?.listings.active ?? activeListings.length, icon: Home, color: 'text-blue-600 bg-blue-50' },
              { label: 'Awaiting Approval', value: pendingListings.length, icon: Clock, color: pendingListings.length > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50' },
              { label: 'Total Users', value: stats?.users.total ?? '–', icon: Users, color: 'text-purple-600 bg-purple-50' },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-600 bg-emerald-50' },
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
            {([
              { key: 'pending', label: `Pending Review${pendingListings.length > 0 ? ` (${pendingListings.length})` : ''}` },
              { key: 'all', label: 'Live Listings' },
              { key: 'analytics', label: 'Analytics' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                  t.key === 'pending' && pendingListings.length > 0 && activeTab !== 'pending' ? 'text-orange-600' : '')}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Pending Review Tab */}
          {activeTab === 'pending' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Listings Awaiting Approval</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Review and approve or reject agent submissions</p>
                </div>
                <span className="text-xs text-gray-500">{pendingListings.length} pending</span>
              </div>

              {fetching ? (
                <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : pendingListings.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <CheckCircle size={36} className="mx-auto mb-3 text-emerald-300" />
                  <p className="text-sm font-medium text-gray-600">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No listings are waiting for review.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {pendingListings.map(p => (
                    <div key={p.id} className="px-4 py-4 flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Home size={16} className="text-gray-300" /></div>
                        }
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{p.title || p.address}</p>
                        <p className="text-xs text-gray-500">{p.area}, {p.city} · {p.beds} beds · {p.baths} baths</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-bold text-blue-600">{formatPrice(p.price)}</span>
                          <span className="text-xs text-gray-400">Submitted {formatDate(p.created_at)}</span>
                          {p.agent && (
                            <span className="text-xs text-gray-400">by {p.agent.full_name}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/listing/${p.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          Preview
                        </Link>
                        <button
                          onClick={() => handleReject(p.id, p.title || p.address)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1">
                          {actionLoading === p.id + '-reject'
                            ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <XCircle size={12} />}
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(p.id, p.title || p.address)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                          {actionLoading === p.id + '-approve'
                            ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                            : <CheckCircle size={12} />}
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Listings Tab */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Live Listings</h2>
                <span className="text-xs text-gray-500">{activeListings.length} active</span>
              </div>

              {fetching ? (
                <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : activeListings.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Home size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">No active listings yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Property</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Price</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Views</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Listed</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activeListings.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-gray-900 truncate max-w-[150px]">{p.title || p.address}</p>
                                  {p.is_featured && <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-500">{p.area}, {p.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell font-semibold text-gray-900">{formatPrice(p.price)}</td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{p.view_count || 0}</td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link href={`/listing/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                              <button
                                onClick={() => handleFeature(p.id)}
                                disabled={actionLoading !== null}
                                className={cn('text-xs font-medium px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50',
                                  p.is_featured
                                    ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                    : 'text-gray-500 border-gray-200 hover:bg-gray-50')}>
                                {p.is_featured ? '★ Unfeature' : '☆ Feature'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-blue-500" /> Platform Summary</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'Total Users', value: stats?.users.total ?? '–' },
                    { label: 'Buyers', value: stats?.users.buyers ?? '–' },
                    { label: 'Agents', value: stats?.users.agents ?? '–' },
                    { label: 'Active Listings', value: stats?.listings.active ?? activeListings.length },
                    { label: 'Total Offers', value: stats?.activity.total_offers ?? '–' },
                    { label: 'Total Viewings', value: stats?.activity.total_viewings ?? '–' },
                    { label: 'Revenue (₦)', value: stats ? formatPrice(stats.revenue_naira) : '–' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900">{fetching ? '–' : value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Home size={16} className="text-blue-500" /> Top Cities</h3>
                <div className="space-y-2">
                  {Object.entries(
                    activeListings.reduce((acc: Record<string, number>, p) => { acc[p.city] = (acc[p.city] || 0) + 1; return acc; }, {})
                  ).sort(([, a], [, b]) => b - a).slice(0, 6).map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-700">{city}</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs">{count}</span>
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