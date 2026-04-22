'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, TrendingUp, XCircle, MessageSquare } from 'lucide-react';
import { properties as propApi, offers as offerApi, type Property, type Offer, User } from '@/lib/api';
import { formatFullPrice, formatPrice, formatDate, getOfferStatusColor, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

const CONTINGENCIES = ['Home Inspection', 'Appraisal', 'Financing', "Sale of Buyer's Home"];

// ── Buyer: Make Offer Form ─────────────────────────────────────────────────────

function MakeOfferForm({ propertyId, property }: { propertyId: string; property: Property }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bidPrice, setBidPrice] = useState(Math.round(property.price * 0.96));
  const [downPct, setDownPct] = useState(20);
  const [closingDate, setClosingDate] = useState('');
  const [contingencies, setContingencies] = useState(['Home Inspection', 'Appraisal']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleContingency(c: string) {
    setContingencies(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  }

  const downAmount = Math.round(bidPrice * downPct / 100);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await offerApi.create({
        property_id: propertyId,
        offer_price: bidPrice,
        down_payment_pct: downPct,
        preferred_closing_date: closingDate ? new Date(closingDate).toISOString() : undefined,
        contingencies,
        notes: notes || undefined,
      });
      setSubmitted(true);
      toast.success('Offer submitted!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your offer of <strong>{formatFullPrice(bidPrice)}</strong> has been sent to the agent.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="font-semibold text-sm text-gray-900">{property.title || property.address}</p>
            <p className="text-xs text-gray-500">{property.area}, {property.city}</p>
            <p className="text-xs font-bold text-blue-600 mt-1">Offer: {formatFullPrice(bidPrice)}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/buyer" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Dashboard
            </Link>
            <Link href="/offers" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              My Offers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Offer Terms', 'Confirmation'];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href={`/listing/${propertyId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={15} /> Back to Listing
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Make an Offer</h1>
        <p className="text-sm text-gray-500 mb-6">{property.title || property.address} · {formatPrice(property.price)}</p>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                step > i + 1 ? 'bg-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}>
                {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium ml-2 hidden sm:block', step === i + 1 ? 'text-blue-600' : 'text-gray-400')}>{s}</span>
              {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-2', step > i + 1 ? 'bg-blue-500' : 'bg-gray-200')} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Your Offer Price (₦)</label>
              <input type="number" value={bidPrice} onChange={e => setBidPrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-500 mt-1">
                Listed at {formatPrice(property.price)} ·{' '}
                <span className={bidPrice >= property.price ? 'text-emerald-600' : 'text-orange-500'}>
                  {bidPrice >= property.price ? `+${formatPrice(bidPrice - property.price)} over asking` : `${formatPrice(property.price - bidPrice)} below asking`}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Down Payment: {downPct}% ({formatPrice(downAmount)})</label>
              <input type="range" min={5} max={100} step={5} value={downPct} onChange={e => setDownPct(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full accent-blue-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5%</span><span>100%</span></div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Preferred Closing Date</label>
              <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">Contingencies</label>
              <div className="grid grid-cols-2 gap-2">
                {CONTINGENCIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleContingency(c)}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left',
                      contingencies.includes(c) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-blue-300')}>
                    <div className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      contingencies.includes(c) ? 'border-blue-500 bg-blue-500' : 'border-gray-300')}>
                      {contingencies.includes(c) && <CheckCircle size={10} className="text-white" />}
                    </div>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Notes to Agent (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Add any personal message or terms..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
              Review Offer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Offer Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium text-gray-900 text-right max-w-[200px]">{property.title || property.address}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Listed Price</span><span className="font-medium">{formatFullPrice(property.price)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Your Offer</span><span className="font-bold text-blue-600 text-base">{formatFullPrice(bidPrice)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Down Payment</span><span className="font-medium">{downPct}% · {formatPrice(downAmount)}</span></div>
                {closingDate && <div className="flex justify-between"><span className="text-gray-500">Closing Date</span><span className="font-medium">{new Date(closingDate).toLocaleDateString('en-NG', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Contingencies</span><span className="font-medium text-right max-w-[200px]">{contingencies.join(', ') || 'None'}</span></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Edit Offer
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {submitting ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Submitting...</> : <><CheckCircle size={16} /> Submit Offer</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Agent: Offer Management ────────────────────────────────────────────────────

function AgentOffersView({ user }: { user: User }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterInput, setCounterInput] = useState<Record<string, number>>({});
  const [showCounter, setShowCounter] = useState<string | null>(null);

  useEffect(() => {
    offerApi.list().then(setOffers).catch(() => {}).finally(() => setFetching(false));
  }, [user.id]);

  async function handleAction(offerId: string, status: string, counterPrice?: number) {
    setActionLoading(offerId + status);
    try {
      const updated = await offerApi.update(offerId, {
        status,
        ...(counterPrice ? { counter_price: counterPrice } : {}),
      });
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, ...updated } : o));
      setShowCounter(null);
      toast.success(
        status === 'accepted' ? 'Offer accepted!' :
        status === 'rejected' ? 'Offer declined' :
        'Counter offer sent'
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  const pending = offers.filter(o => o.status === 'sent' || o.status === 'reviewed');
  const resolved = offers.filter(o => !['sent', 'reviewed'].includes(o.status));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="agent" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-blue-600" /> Offers Received
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pending.length} pending · {resolved.length} resolved
            </p>
          </div>

          {fetching ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : offers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-lg font-medium text-gray-600 mb-2">No offers yet</p>
              <p className="text-sm">Offers from buyers will appear here once your listings receive interest.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending offers */}
              {pending.length > 0 && (
                <section>
                  <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Awaiting Response</h2>
                  <div className="space-y-4">
                    {pending.map(o => (
                      <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <p className="font-bold text-xl text-gray-900">{formatFullPrice(o.offer_price)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Received {formatDate(o.created_at)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Down payment: {o.down_payment_pct}%</p>
                            {o.preferred_closing_date && (
                              <p className="text-xs text-gray-400">Preferred closing: {formatDate(o.preferred_closing_date)}</p>
                            )}
                            {o.contingencies?.length > 0 && (
                              <p className="text-xs text-gray-400">Contingencies: {o.contingencies.join(', ')}</p>
                            )}
                            {o.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">&ldquo;{o.notes}&rdquo;</p>
                            )}
                          </div>
                          <span className={cn('text-xs font-semibold px-3 py-1 rounded-full capitalize shrink-0', getOfferStatusColor(o.status))}>
                            {o.status}
                          </span>
                        </div>

                        {/* Action buttons */}
                        {showCounter === o.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              placeholder="Counter price (₦)"
                              value={counterInput[o.id] || ''}
                              onChange={e => setCounterInput(prev => ({ ...prev, [o.id]: Number(e.target.value) }))}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleAction(o.id, 'countered', counterInput[o.id])}
                              disabled={!counterInput[o.id] || actionLoading === o.id + 'countered'}
                              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors">
                              {actionLoading === o.id + 'countered'
                                ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                                : <MessageSquare size={13} />}
                              Send Counter
                            </button>
                            <button onClick={() => setShowCounter(null)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleAction(o.id, 'accepted')}
                              disabled={actionLoading !== null}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                              {actionLoading === o.id + 'accepted'
                                ? <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                                : <CheckCircle size={14} />}
                              Accept
                            </button>
                            <button
                              onClick={() => setShowCounter(o.id)}
                              disabled={actionLoading !== null}
                              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                              <MessageSquare size={14} /> Counter
                            </button>
                            <button
                              onClick={() => handleAction(o.id, 'rejected')}
                              disabled={actionLoading !== null}
                              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors">
                              {actionLoading === o.id + 'rejected'
                                ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                : <XCircle size={14} />}
                              Decline
                            </button>
                            <Link
                              href={`/listing/${o.property_id}`}
                              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors">
                              View Listing
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Resolved offers */}
              {resolved.length > 0 && (
                <section>
                  <h2 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide text-gray-400">Resolved</h2>
                  <div className="space-y-3">
                    {resolved.map(o => (
                      <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 opacity-80">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-gray-900">{formatFullPrice(o.offer_price)}</p>
                            <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
                            {o.counter_price && (
                              <p className="text-xs text-orange-600 font-medium mt-0.5">Counter: {formatFullPrice(o.counter_price)}</p>
                            )}
                          </div>
                          <span className={cn('text-xs font-semibold px-3 py-1 rounded-full capitalize', getOfferStatusColor(o.status))}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

// ── Buyer: My Offers List ──────────────────────────────────────────────────────

function BuyerOffersView({ user }: { user: User }) {
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    offerApi.list().then(setMyOffers).catch(() => {}).finally(() => setFetching(false));
  }, [user.id]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-blue-600" /> My Offers
            </h1>
            <p className="text-sm text-gray-500 mt-1">{myOffers.length} offer{myOffers.length !== 1 ? 's' : ''}</p>
          </div>

          {fetching ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : myOffers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-lg font-medium text-gray-600 mb-2">No offers yet</p>
              <p className="text-sm mb-6">Browse properties and make your first offer</p>
              <Link href="/search" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myOffers.map(o => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg text-gray-900">{formatFullPrice(o.offer_price)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Submitted {formatDate(o.created_at)}</p>
                      {o.counter_price && (
                        <p className="text-sm text-orange-600 font-semibold mt-1">
                          Counter offer: {formatFullPrice(o.counter_price)}
                        </p>
                      )}
                      {o.notes && <p className="text-sm text-gray-600 mt-2">{o.notes}</p>}
                    </div>
                    <span className={cn('text-xs font-semibold px-3 py-1 rounded-full capitalize shrink-0', getOfferStatusColor(o.status))}>
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs text-gray-500">
                    <span>Down payment: {o.down_payment_pct}%</span>
                    {o.preferred_closing_date && <span>Closing: {formatDate(o.preferred_closing_date)}</span>}
                    {o.contingencies?.length > 0 && <span>{o.contingencies.length} contingencies</span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/listing/${o.property_id}`} className="text-xs text-blue-600 hover:underline font-medium">
                      View Property
                    </Link>
                    {o.status === 'sent' && (
                      <span className="text-xs text-gray-400">· Waiting for agent response</span>
                    )}
                    {o.status === 'countered' && o.counter_price && (
                      <span className="text-xs text-orange-600 font-medium">· Agent countered at {formatPrice(o.counter_price)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

// ── Root: dispatch by role + query ─────────────────────────────────────────────

function OffersContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const propertyId = searchParams.get('propertyId');

  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProp, setLoadingProp] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user && propertyId) {
      setLoadingProp(true);
      propApi.get(propertyId).then(setProperty).catch(() => {}).finally(() => setLoadingProp(false));
    }
  }, [user, loading, propertyId, router]);

  if (loading || loadingProp) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!user) return null;

  // Buyer navigated from a listing — show the make-offer form
  if (user.role === 'buyer' && propertyId && property) {
    return <MakeOfferForm propertyId={propertyId} property={property} />;
  }

  // Agent sees their received offers with accept/reject/counter
  if (user.role === 'agent' || user.role === 'admin') {
    return <AgentOffersView user={user} />;
  }

  // Buyer sees their submitted offers
  return <BuyerOffersView user={user} />;
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <OffersContent />
    </Suspense>
  );
}