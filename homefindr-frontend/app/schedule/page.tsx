'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { viewings as viewApi, type Viewing } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  completed: { label: 'Completed', color: 'text-gray-600 bg-gray-100 border-gray-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function SchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [viewingsList, setViewingsList] = useState<Viewing[]>([]);
  const [fetching, setFetching] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      viewApi.list()
        .then(setViewingsList)
        .catch(() => setViewingsList([]))
        .finally(() => setFetching(false));
    }
  }, [user, loading, router]);

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      await viewApi.cancel(id);
      setViewingsList(vs => vs.map(v => v.id === id ? { ...v, status: 'cancelled' as const } : v));
      toast.success('Viewing cancelled');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const upcoming = viewingsList.filter(v => v.status === 'scheduled' || v.status === 'confirmed');
  const past = viewingsList.filter(v => v.status === 'completed' || v.status === 'cancelled');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/buyer" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Viewings</h1>
              <p className="text-sm text-gray-500">Track and manage your property tours</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Upcoming', value: upcoming.length, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completed', value: viewingsList.filter(v => v.status === 'completed').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Cancelled', value: viewingsList.filter(v => v.status === 'cancelled').length, color: 'text-gray-500', bg: 'bg-gray-100' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{fetching ? '–' : s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {fetching ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : viewingsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No viewings yet</h3>
              <p className="text-sm text-gray-500 mb-5">Browse properties and schedule tours to see them here</p>
              <Link href="/search" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                Browse Properties
              </Link>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> Upcoming Viewings
                  </h2>
                  <div className="space-y-3">
                    {upcoming.map(v => (
                      <ViewingCard
                        key={v.id}
                        viewing={v}
                        cancelling={cancelling === v.id}
                        onCancel={() => handleCancel(v.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-gray-400" /> Past Viewings
                  </h2>
                  <div className="space-y-3">
                    {past.map(v => (
                      <ViewingCard key={v.id} viewing={v} cancelling={false} onCancel={() => {}} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

function ViewingCard({ viewing: v, cancelling, onCancel }: {
  viewing: Viewing;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.scheduled;
  const isActive = v.status === 'scheduled' || v.status === 'confirmed';
  const date = new Date(v.scheduled_at);

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4', !isActive && 'opacity-70')}>
      {/* Date block */}
      <div className="shrink-0 w-14 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-700">
        <span className="text-xs font-semibold uppercase">{date.toLocaleDateString('en-NG', { month: 'short' })}</span>
        <span className="text-xl font-bold leading-none">{date.getDate()}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Property Viewing</p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              {date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {formatDate(v.scheduled_at)}
            </p>
            {(v.contact_name || v.contact_email) && (
              <p className="text-xs text-gray-400 mt-1">
                Contact: {v.contact_name || v.contact_email}
              </p>
            )}
            {v.notes && <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{v.notes}&rdquo;</p>}
          </div>

          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', cfg.color)}>
            {cfg.label}
          </span>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 mt-3">
            <Link href={`/schedule/${v.property_id}`}
              className="text-xs font-medium text-blue-600 hover:underline">
              Reschedule
            </Link>
            <span className="text-gray-200">|</span>
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 flex items-center gap-1">
              {cancelling
                ? <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                : <XCircle size={12} />}
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}