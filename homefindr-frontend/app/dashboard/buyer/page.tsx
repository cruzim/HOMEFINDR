'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Search, MessageSquare, Calendar, TrendingUp, ChevronRight, Star, MapPin, BedDouble } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { PROPERTIES, SAVED_SEARCHES, CONVERSATIONS } from '@/data/mock';
import { formatPrice, formatDate, getOfferStatusColor } from '@/lib/utils';

const MOCK_OFFERS = [
  { id: 'offer-1', propertyId: 'prop-1', property: PROPERTIES[0], offerPrice: 720000000, status: 'reviewed' as const, submittedAt: '2024-01-15', updatedAt: '2024-01-16' },
  { id: 'offer-2', propertyId: 'prop-3', property: PROPERTIES[2], offerPrice: 400000000, status: 'sent' as const, submittedAt: '2024-01-14', updatedAt: '2024-01-14' },
];

const UPCOMING_VIEWINGS = [
  { id: 1, property: PROPERTIES[0], date: '2024-01-20', time: '11:00 AM', agent: PROPERTIES[0].agent },
  { id: 2, property: PROPERTIES[2], date: '2024-01-22', time: '2:00 PM', agent: PROPERTIES[2].agent },
];

export default function BuyerDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-8">
          {/* Greeting */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-1">Good morning, Tunde! 👋</h1>
            <p className="text-blue-100 text-sm mb-5">You have 2 active offers and 7 new properties matching your saved searches.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Saved Listings', value: '6', icon: Heart },
                { label: 'Active Offers', value: '2', icon: TrendingUp },
                { label: 'Saved Searches', value: '3', icon: Search },
                { label: 'Messages', value: '2', icon: MessageSquare },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/15 rounded-xl p-3 text-center">
                  <Icon size={18} className="mx-auto mb-1.5 text-blue-200" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-blue-200">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Offers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Active Offers</h2>
              <Link href="/offers" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_OFFERS.map(offer => (
                <div key={offer.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={offer.property.images[0]} alt={offer.property.address} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{offer.property.address}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} />{offer.property.zip}, {offer.property.city}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Your offer: <span className="font-semibold text-gray-900">{formatPrice(offer.offerPrice)}</span> · Listed: {formatPrice(offer.property.price)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getOfferStatusColor(offer.status)}`}>
                      {offer.status.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(offer.updatedAt)}</p>
                  </div>
                  <Link href={`/offers?id=${offer.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saved searches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Saved Searches</h2>
                <Link href="/favorites" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
              </div>
              <div className="space-y-3">
                {SAVED_SEARCHES.map(s => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Search size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.totalResults} total · Last run {formatDate(s.lastRunAt)}</p>
                    </div>
                    {s.newResults > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full shrink-0">{s.newResults} new</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming viewings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Upcoming Viewings</h2>
                <Link href="/schedule" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">View all <ChevronRight size={14} /></Link>
              </div>
              <div className="space-y-3">
                {UPCOMING_VIEWINGS.map(v => (
                  <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{v.property.address}</p>
                      <p className="text-xs text-gray-500">{formatDate(v.date)} · {v.time}</p>
                      <p className="text-xs text-gray-400">with {v.agent.name}</p>
                    </div>
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image src={v.agent.photo} alt={v.agent.name} fill className="object-cover" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent messages */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Messages</h2>
              <Link href="/messages" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">Open inbox <ChevronRight size={14} /></Link>
            </div>
            <div className="space-y-2">
              {CONVERSATIONS.map(c => {
                const other = c.participants.find(p => p.id !== 'user-1')!;
                return (
                  <Link key={c.id} href="/messages" className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow block">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <Image src={other.photo} alt={other.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{other.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{c.lastMessageTime}</p>
                      {c.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full mt-1">{c.unreadCount}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
