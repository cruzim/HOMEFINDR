'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Share2, Search, Edit2, Trash2, MessageSquare, BedDouble, Bath, Maximize, MapPin } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { PROPERTIES, SAVED_SEARCHES } from '@/data/mock';
import { formatPrice, formatDate } from '@/lib/utils';

export default function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'searches'>('listings');
  const [saved, setSaved] = useState(PROPERTIES.slice(0, 6));

  function removeSaved(id: string) {
    setSaved(s => s.filter(p => p.id !== id));
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your saved listings and search collections.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Share2 size={15} /> Share Collection
              </button>
              <Link href="/search" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                Browse More
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
            <button onClick={() => setActiveTab('listings')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === 'listings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Saved Listings ({saved.length})
            </button>
            <button onClick={() => setActiveTab('searches')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === 'searches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Saved Searches ({SAVED_SEARCHES.length})
            </button>
            <div className="ml-auto pb-2">
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option>Recently Saved</option>
                <option>Price: Low–High</option>
                <option>Price: High–Low</option>
              </select>
            </div>
          </div>

          {activeTab === 'listings' ? (
            saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Heart size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved listings yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">Save properties you like to compare them later and get notified of price changes.</p>
                <Link href="/search" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Browse Properties
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {saved.map(p => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="relative h-52">
                      <Image src={p.images[0]} alt={p.address} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      {p.badge === 'new' && <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white">NEW</span>}
                      {p.status === 'pending' && <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white">PENDING</span>}
                      <button onClick={() => removeSaved(p.id)} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-red-500 hover:bg-red-50 transition-colors">
                        <Heart size={15} fill="currentColor" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(p.price)}</p>
                      <p className="text-sm text-gray-700 font-medium truncate">{p.address}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin size={11} />{p.zip}, {p.city}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-4">
                        <span className="flex items-center gap-1"><BedDouble size={13} className="text-blue-500" />{p.beds} Beds</span>
                        <span className="flex items-center gap-1"><Bath size={13} className="text-blue-500" />{p.baths} Baths</span>
                        <span className="flex items-center gap-1"><Maximize size={13} className="text-blue-500" />{p.sqft.toLocaleString()} sqft</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/listing/${p.id}`} className="flex-1 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 text-center hover:bg-gray-50 transition-colors">
                          View Details
                        </Link>
                        <Link href="/messages" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold text-white text-center transition-colors">
                          Contact Agent
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3 max-w-2xl">
              {SAVED_SEARCHES.map(s => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Search size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">Last run: {formatDate(s.lastRunAt)} · {s.totalResults} results</p>
                  </div>
                  {s.newResults > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full shrink-0">
                      {s.newResults} new
                    </span>
                  )}
                  <div className="flex gap-1 shrink-0">
                    <Link href={`/search?location=${s.filters.location}`}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      View
                    </Link>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><Edit2 size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}

              {/* Collaboration card */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 mt-4">
                <div className="flex -space-x-2 shrink-0">
                  {['https://randomuser.me/api/portraits/women/44.jpg', 'https://randomuser.me/api/portraits/women/55.jpg'].map((img, i) => (
                    <div key={i} className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                      <Image src={img} alt="Collaborator" fill className="object-cover" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">+1</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Collaborating with Amina</p>
                  <p className="text-xs text-gray-500">Amina also saved 2 properties. View her comments on listings.</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 shrink-0">
                  <MessageSquare size={13} /> Message
                </button>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
