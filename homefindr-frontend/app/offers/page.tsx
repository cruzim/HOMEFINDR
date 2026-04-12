'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Info, CreditCard, Lock } from 'lucide-react';
import { PROPERTIES } from '@/data/mock';
import { formatFullPrice, formatPrice, cn } from '@/lib/utils';

const CONTINGENCIES = ['Home Inspection', 'Appraisal', 'Financing', 'Sale of Buyer\'s Home'];

const OFFER_JOURNEY = [
  { label: 'Viewing Completed', date: 'Jan 16, 2024', done: true },
  { label: 'Offer Drafting', date: 'Jan 17, 2024', done: true, active: true },
  { label: 'Seller Review', date: 'Expected 24–48h', done: false },
  { label: 'Escrow Open', date: 'TBD', done: false },
];

function OffersContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId') ?? 'prop-1';
  const property = PROPERTIES.find(p => p.id === propertyId) ?? PROPERTIES[0];

  const [step, setStep] = useState(1);
  const [bidPrice, setBidPrice] = useState(Math.round(property.price * 0.96));
  const [downPct, setDownPct] = useState(20);
  const [closingDate, setClosingDate] = useState('2024-03-15');
  const [contingencies, setContingencies] = useState(['Home Inspection', 'Appraisal']);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [confirmed, setConfirmed] = useState(false);

  function toggleContingency(c: string) {
    setContingencies(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  }

  const downAmount = Math.round(bidPrice * downPct / 100);
  const steps = ['Offer Terms', 'Earnest Money', 'Confirmation'];

  if (confirmed) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Offer Submitted!</h2>
          <p className="text-sm text-gray-500 mb-6">Your offer of <strong>{formatFullPrice(bidPrice)}</strong> has been submitted to the seller. You&apos;ll be notified as soon as they respond.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                <Image src={property.images[0]} alt={property.address} fill className="object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{property.address}</p>
                <p className="text-xs text-gray-500">{property.zip}, {property.city}</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">Offer: {formatFullPrice(bidPrice)}</p>
              </div>
            </div>
          </div>
          <Link href="/dashboard/buyer" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mb-3 transition-colors">
            Go to Dashboard
          </Link>
          <Link href="/messages" className="block text-sm text-blue-600 hover:underline">Message Agent</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8 px-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main form */}
          <div className="flex-1 min-w-0">
            <Link href={`/listing/${property.id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
              <ArrowLeft size={15} /> Back to Listing Detail
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Finalize Your Offer</h1>
            <p className="text-sm text-gray-500 mb-7">You are making a binding offer for {property.address}.</p>

            {/* Steps */}
            <div className="flex items-center gap-0 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${step > i + 1 ? 'bg-blue-600 border-blue-600 text-white' : step === i + 1 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium text-center ${step === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${step > i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1 - Offer Terms */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Offer Terms</h2>
                  <p className="text-sm text-gray-500">Specify the financial terms of your purchase proposal.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Bid Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₦</span>
                      <input type="number" value={bidPrice} onChange={e => setBidPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Recommended: {formatPrice(Math.round(property.price * 0.95))} – {formatPrice(Math.round(property.price * 1.02))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Down Payment (%)</label>
                    <div className="relative">
                      <input type="number" value={downPct} onChange={e => setDownPct(Number(e.target.value))} min={5} max={100}
                        className="w-full pr-8 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Approx. {formatPrice(downAmount)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Preferred Closing Date</label>
                  <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Standard Contingencies</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTINGENCIES.map(c => (
                      <label key={c} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                        <input type="checkbox" checked={contingencies.includes(c)} onChange={() => toggleContingency(c)} className="w-4 h-4 accent-blue-600 rounded" />
                        <span className="text-sm text-gray-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <Info size={15} className="text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700">These terms will be drafted into a legal contract upon acceptance.</p>
                </div>

                <button onClick={() => setStep(2)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* Step 2 - Payment */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Earnest Money Deposit</h2>
                  <p className="text-sm text-gray-500">Secure your offer with a 1% earnest money deposit of <strong>{formatPrice(Math.round(bidPrice * 0.01))}</strong>.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Card Number</label>
                    <div className="relative">
                      <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value }))} placeholder="0000 0000 0000 0000" maxLength={19}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Expiry</label>
                      <input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} placeholder="MM / YY"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">CVV</label>
                      <input value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value }))} placeholder="123" maxLength={4}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Cardholder Name</label>
                    <input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} placeholder="Tunde Adeyemi"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Offer Amount</span><span className="font-semibold">{formatFullPrice(bidPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Earnest Deposit (1%)</span><span className="font-semibold">{formatPrice(Math.round(bidPrice * 0.01))}</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="font-bold text-gray-900">Due Now</span><span className="font-bold text-blue-600">{formatPrice(Math.round(bidPrice * 0.01))}</span></div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock size={13} className="text-emerald-500" /> Secured by 256-bit SSL encryption
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                  <button onClick={() => setConfirmed(true)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                    Submit Offer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            {/* Property card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-40">
                <Image src={property.images[0]} alt={property.address} fill className="object-cover" />
                <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">Active</span>
              </div>
              <div className="p-4">
                <p className="font-bold text-gray-900">{property.address}</p>
                <p className="text-xs text-gray-500 mb-2">{property.zip}, {property.city}, {property.state}</p>
                <div className="flex justify-between items-center">
                  <p className="text-blue-600 font-bold">{formatFullPrice(property.price)}</p>
                  <p className="text-xs text-gray-400">List Price</p>
                </div>
              </div>
            </div>

            {/* Agent */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Assigned Agent</p>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <Image src={property.agent.photo} alt={property.agent.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{property.agent.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">Active Now</p>
                </div>
              </div>
            </div>

            {/* Offer journey */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Offer Journey</p>
              <div className="space-y-4">
                {OFFER_JOURNEY.map((j, i) => (
                  <div key={j.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', j.done ? 'bg-blue-600' : 'bg-gray-100 border-2 border-gray-200')}>
                        {j.done ? <CheckCircle size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                      {i < OFFER_JOURNEY.length - 1 && <div className={`w-0.5 h-6 mt-1 ${j.done ? 'bg-blue-200' : 'bg-gray-100'}`} />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-semibold ${j.done ? 'text-gray-900' : 'text-gray-400'}`}>{j.label}</p>
                      <p className="text-xs text-gray-400">{j.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">💡 Buyer Tip</p>
              <p className="text-xs text-blue-600 leading-relaxed">Offers with a higher down payment or fewer contingencies are often seen as more favourable by sellers in competitive markets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <OffersContent />
    </Suspense>
  );
}
