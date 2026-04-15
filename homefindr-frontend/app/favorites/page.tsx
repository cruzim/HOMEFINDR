'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/features/PropertyCard';
import { properties as api, type Property } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<Property[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      api.saved().then(res => setSaved(res)).catch(() => {}).finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  function handleUnsave(id: string) {
    setSaved(s => s.filter(p => p.id !== id));
  }

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar role={user?.role === 'agent' ? 'agent' : 'buyer'} />
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const role = user?.role === 'agent' ? 'agent' : 'buyer';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role={role} />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart size={22} className="text-red-500 fill-red-500" /> Saved Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">{saved.length} {saved.length === 1 ? 'property' : 'properties'} saved</p>
          </div>

          {saved.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Heart size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-lg font-medium text-gray-600 mb-2">No saved listings yet</p>
              <p className="text-sm mb-6">Browse properties and tap the heart icon to save them here.</p>
              <Link href="/search" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {saved.map(p => (
                <PropertyCard
                  key={p.id}
                  property={{ ...p, is_saved: true }}
                  onSaveToggle={(id, isSaved) => { if (!isSaved) handleUnsave(id); }}
                />
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}
