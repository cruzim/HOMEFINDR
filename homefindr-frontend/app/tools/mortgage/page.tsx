'use client';

import { useState } from 'react';
import Footer from '@/components/layout/Footer';
import { Calculator } from 'lucide-react';

export default function MortgageCalculatorPage() {
  const [price, setPrice] = useState(50_000_000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(18);    // typical Nigerian mortgage rate
  const [years, setYears] = useState(15);

  const downPayment = Math.round(price * (downPct / 100));
  const principal = price - downPayment;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const monthlyPayment = principal > 0 && monthlyRate > 0
    ? Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1))
    : Math.round(principal / n);
  const totalPaid = monthlyPayment * n;
  const totalInterest = totalPaid - principal;

  const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-blue-600 text-white py-16 px-6 text-center">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Calculator size={24} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Mortgage Calculator</h1>
        <p className="text-blue-100">Estimate your monthly repayments based on Nigerian bank rates.</p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Inputs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="font-bold text-gray-900 text-lg">Loan Details</h2>

            {[
              { label: 'Property Price (₦)', value: price, setter: setPrice, min: 1_000_000, max: 2_000_000_000, step: 500_000 },
              { label: `Down Payment (${downPct}%)`, value: downPct, setter: setDownPct, min: 5, max: 80, step: 5, display: `${downPct}% = ${fmt(downPayment)}` },
              { label: 'Annual Interest Rate (%)', value: rate, setter: setRate, min: 5, max: 35, step: 0.5 },
              { label: 'Loan Term (Years)', value: years, setter: setYears, min: 1, max: 30, step: 1 },
            ].map(f => (
              <div key={f.label}>
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">{f.label}</label>
                  <span className="text-sm font-semibold text-blue-600">
                    {'display' in f ? f.display : (f.label.includes('Rate') || f.label.includes('Term') || f.label.includes('Down'))
                      ? f.value + (f.label.includes('Rate') ? '%' : f.label.includes('Term') ? ' yrs' : '')
                      : fmt(f.value)}
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min} max={f.max} step={f.step}
                  value={f.value}
                  onChange={e => f.setter(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>{f.min.toLocaleString()}</span>
                  <span>{f.max.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-blue-600 text-white rounded-2xl p-6 text-center">
              <p className="text-blue-100 text-sm mb-1">Monthly Payment</p>
              <p className="text-4xl font-bold">{fmt(monthlyPayment)}</p>
              <p className="text-blue-200 text-xs mt-1">over {years} years at {rate}% p.a.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              {[
                { label: 'Property Price', value: fmt(price) },
                { label: 'Down Payment', value: fmt(downPayment) },
                { label: 'Loan Amount', value: fmt(principal), highlight: true },
                { label: 'Total Interest Paid', value: fmt(totalInterest) },
                { label: 'Total Amount Paid', value: fmt(totalPaid) },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                  <span className="text-gray-500">{r.label}</span>
                  <span className={r.highlight ? 'font-bold text-blue-600' : 'font-semibold text-gray-900'}>{r.value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed px-1">
              ⚠️ This is an estimate only. Actual rates, fees, and eligibility depend on your bank and financial profile. Consult a mortgage advisor before making any financial decisions.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}