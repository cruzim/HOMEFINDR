'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Eye, Heart, Edit2, Trash2, ChevronRight, TrendingUp, Users, Home, Calendar, Phone, MessageSquare, BarChart2 } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { PROPERTIES, AGENTS } from '@/data/mock';
import { formatPrice, formatDate, getStatusColor, cn } from '@/lib/utils';

const AGENT = AGENTS[0];

const AGENT_LISTINGS = PROPERTIES.filter(p => p.agent.id === 'agent-1');

const LEADS = [
  { id: 'l1', name: 'Chidi Okeke', phone: '+234 803 112 3344', email: 'chidi@example.com', propertyId: 'prop-1', property: PROPERTIES[0], date: '2024-01-17', status: 'hot' },
  { id: 'l2', name: 'Ngozi Adeyemi', phone: '+234 807 556 7788', email: 'ngozi@example.com', propertyId: 'prop-4', property: PROPERTIES[3], date: '2024-01-16', status: 'warm' },
  { id: 'l3', name: 'Femi Balogun', phone: '+234 812 990 1122', email: 'femi@example.com', propertyId: 'prop-6', property: PROPERTIES[5], date: '2024-01-15', status: 'cold' },
];

const STATUS_COLOR: Record<string, string> = {
  hot: 'bg-red-50 text-red-700 border-red-200',
  warm: 'bg-orange-50 text-orange-700 border-orange-200',
  cold: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState<'listings' | 'leads' | 'analytics'>('listings');

  const totalViews = AGENT_LISTINGS.reduce((s, p) => s + p.views, 0);
  const totalSaves = AGENT_LISTINGS.reduce((s, p) => s + p.saves, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" user={{ name: AGENT.name, email: AGENT.email, photo: AGENT.photo, role: 'Agent' }} />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {AGENT.name.split(' ')[0]}. Here&apos;s what&apos;s happening.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/listing/create" className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <Plus size={16} /> Create Listing
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: AGENT_LISTINGS.filter(p => p.status === 'active').length, icon: Home, color: 'text-blue-600 bg-blue-50' },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Saves', value: totalSaves, icon: Heart, color: 'text-red-500 bg-red-50' },
              { label: 'Active Leads', value: LEADS.length, icon: Users, color: 'text-orange-600 bg-orange-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Create Listing', href: '/listing/create', icon: Plus, color: 'bg-blue-600 text-white' },
              { label: 'View Leads', href: '#leads', icon: Users, color: 'bg-white text-gray-700 border border-gray-200' },
              { label: 'Calendar Sync', href: '/profile', icon: Calendar, color: 'bg-white text-gray-700 border border-gray-200' },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={label} href={href}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold transition-all hover:shadow-sm ${color}`}>
                <Icon size={20} />
                <span className="text-xs">{label}</span>
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(['listings', 'leads', 'analytics'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={cn('flex-1 py-3 text-sm font-semibold capitalize transition-all', activeTab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700')}>
                  {t === 'listings' ? `My Listings (${AGENT_LISTINGS.length})` : t === 'leads' ? `Leads (${LEADS.length})` : 'Analytics'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Listings tab */}
              {activeTab === 'listings' && (
                <div className="space-y-3">
                  {AGENT_LISTINGS.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image src={p.images[0]} alt={p.address} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-gray-900 truncate">{p.address}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getStatusColor(p.status)}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{p.zip}, {p.city} · {formatPrice(p.price)}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Eye size={11} /> {p.views.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart size={11} /> {p.saves}</span>
                          <span>{p.daysOnMarket}d on market</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Link href={`/listing/${p.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={15} />
                        </Link>
                        <Link href={`/listing/create?edit=${p.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Link href="/listing/create" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all">
                    <Plus size={16} /> Add New Listing
                  </Link>
                </div>
              )}

              {/* Leads tab */}
              {activeTab === 'leads' && (
                <div className="space-y-3">
                  {LEADS.map(lead => (
                    <div key={lead.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-gray-900">{lead.name}</p>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', STATUS_COLOR[lead.status])}>
                            {lead.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">Enquired: {lead.property.address} · {formatDate(lead.date)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <a href={`tel:${lead.phone}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Phone size={15} />
                        </a>
                        <Link href="/messages" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <MessageSquare size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analytics tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Total Profile Views', value: '2,841', change: '+18%', positive: true },
                      { label: 'Contact Rate', value: '12.4%', change: '+2.1%', positive: true },
                      { label: 'Avg. Days to Offer', value: '34 days', change: '-5 days', positive: true },
                      { label: 'Listings Sold (90d)', value: '3', change: '+1', positive: true },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${s.positive ? 'text-emerald-600' : 'text-red-600'}`}>{s.change} vs last period</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500" /> Listing Performance</p>
                    <div className="space-y-3">
                      {AGENT_LISTINGS.map(p => (
                        <div key={p.id} className="flex items-center gap-3">
                          <p className="text-xs text-gray-600 w-40 truncate">{p.address.split(' ').slice(0, 3).join(' ')}</p>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (p.views / 3500) * 100)}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 w-12 text-right">{p.views.toLocaleString()}</p>
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
