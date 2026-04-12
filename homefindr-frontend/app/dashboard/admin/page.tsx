'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Home, TrendingUp, ShieldCheck, Eye, CheckCircle, XCircle, AlertCircle, BarChart2, Edit2 } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { PROPERTIES, AGENTS } from '@/data/mock';
import { formatPrice, formatDate, getStatusColor, cn } from '@/lib/utils';

const MOCK_USERS = [
  { id: 'u1', name: 'Tunde Adeyemi', email: 'tunde@example.com', role: 'buyer', joined: '2024-01-10', status: 'active', photo: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 'u2', name: 'Amaka Okonkwo', email: AGENTS[0].email, role: 'agent', joined: '2023-11-05', status: 'active', photo: AGENTS[0].photo },
  { id: 'u3', name: 'Chukwuemeka Eze', email: AGENTS[1].email, role: 'agent', joined: '2023-09-20', status: 'active', photo: AGENTS[1].photo },
  { id: 'u4', name: 'Ngozi Bello', email: 'ngozi@example.com', role: 'buyer', joined: '2024-01-14', status: 'pending', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 'u5', name: 'Fatima Al-Hassan', email: AGENTS[2].email, role: 'agent', joined: '2023-12-01', status: 'active', photo: AGENTS[2].photo },
];

const ROLE_COLOR: Record<string, string> = {
  buyer: 'bg-blue-50 text-blue-700',
  agent: 'bg-purple-50 text-purple-700',
  admin: 'bg-red-50 text-red-700',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'analytics'>('listings');
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'agent' | 'admin'>('all');

  const filteredUsers = roleFilter === 'all' ? MOCK_USERS : MOCK_USERS.filter(u => u.role === roleFilter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" user={{ name: 'Admin', email: 'admin@homefindr.ng', photo: 'https://randomuser.me/api/portraits/men/1.jpg', role: 'Administrator' }} />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Platform overview and moderation tools.</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: PROPERTIES.filter(p => p.status === 'active').length, icon: Home, color: 'text-blue-600 bg-blue-50', change: '+12 this week' },
              { label: 'Registered Users', value: '3,841', icon: Users, color: 'text-purple-600 bg-purple-50', change: '+28 today' },
              { label: 'Transactions (30d)', value: '₦4.2B', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', change: '+8.3%' },
              { label: 'Pending Reviews', value: '7', icon: ShieldCheck, color: 'text-orange-600 bg-orange-50', change: 'Needs attention' },
            ].map(({ label, value, icon: Icon, color, change }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xs text-emerald-600 font-medium mt-1">{change}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(['listings', 'users', 'analytics'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={cn('flex-1 py-3 text-sm font-semibold capitalize transition-all', activeTab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:text-gray-700')}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Listings moderation */}
              {activeTab === 'listings' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">Moderation Queue ({PROPERTIES.length})</p>
                    <div className="flex gap-2 text-xs">
                      {['all', 'active', 'pending'].map(f => (
                        <button key={f} className={cn('px-3 py-1.5 rounded-lg font-medium capitalize transition-all', f === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {PROPERTIES.map(p => (
                      <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0">
                          <Image src={p.images[0]} alt={p.address} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{p.address}, {p.city}</p>
                          <p className="text-xs text-gray-500">by {p.agent.name} · {formatPrice(p.price)} · {p.daysOnMarket}d ago</p>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${getStatusColor(p.status)}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Link href={`/listing/${p.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                            <Eye size={14} />
                          </Link>
                          <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Approve">
                            <CheckCircle size={14} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Flag">
                            <AlertCircle size={14} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Remove">
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users management */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">Users ({filteredUsers.length})</p>
                    <div className="flex gap-1 text-xs">
                      {(['all', 'buyer', 'agent', 'admin'] as const).map(f => (
                        <button key={f} onClick={() => setRoleFilter(f)}
                          className={cn('px-3 py-1.5 rounded-lg font-medium capitalize transition-all', roleFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                          <Image src={u.photo} alt={u.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email} · Joined {formatDate(u.joined)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[u.role]}`}>{u.role}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {u.status.toUpperCase()}
                        </span>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Searches Today', value: '1,234' },
                      { label: 'Listings Viewed', value: '8,901' },
                      { label: 'Offers Submitted', value: '47' },
                      { label: 'Viewings Booked', value: '128' },
                      { label: 'New Signups', value: '28' },
                      { label: 'Revenue (MRR)', value: '₦12.4M' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500" /> Activity by City (Last 30 Days)</p>
                    <div className="space-y-3">
                      {[
                        { city: 'Lagos', pct: 62 }, { city: 'Abuja', pct: 24 },
                        { city: 'Port Harcourt', pct: 9 }, { city: 'Benin City', pct: 3 }, { city: 'Jos', pct: 2 },
                      ].map(({ city, pct }) => (
                        <div key={city} className="flex items-center gap-3">
                          <p className="text-xs text-gray-600 w-28">{city}</p>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 w-8 text-right">{pct}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
