import Link from 'next/link';
import { CheckCircle, Home, Search, FileText, Key, Shield } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Buying Guide — How to Buy Property in Nigeria' };

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Define Your Budget',
    body: 'Before browsing, determine exactly how much you can afford. Factor in the purchase price, legal fees (typically 5–10% of property value), agency fees (5–10%), and moving costs. If financing, get pre-approval from your bank first.',
  },
  {
    icon: Home,
    step: '02',
    title: 'Search & Shortlist',
    body: 'Use HomeFindr to browse verified listings by city, area, budget, and property type. Save your favourites and set up search alerts so you never miss a new listing that matches your criteria.',
  },
  {
    icon: Shield,
    step: '03',
    title: 'Due Diligence',
    body: 'Before making an offer, verify the title document (Certificate of Occupancy, Deed of Assignment, or Governor\'s Consent). Engage a lawyer to conduct a land search at the land registry to confirm the seller\'s ownership and check for encumbrances.',
  },
  {
    icon: FileText,
    step: '04',
    title: 'Make an Offer',
    body: 'Submit your offer through HomeFindr. The agent will present it to the seller. Negotiation is normal — your first offer need not be your final offer. Once agreed, ensure all terms are documented in writing.',
  },
  {
    icon: CheckCircle,
    step: '05',
    title: 'Sign & Pay',
    body: 'Your solicitor will draft the contract of sale. Review it carefully before signing. Payment is typically made in tranches — an initial deposit followed by the balance on completion. Never pay in cash; always use traceable bank transfers.',
  },
  {
    icon: Key,
    step: '06',
    title: 'Take Possession',
    body: 'Once payment is complete and all documents are signed and registered, you receive the keys. Ensure you obtain the original title documents and all relevant receipts. Congratulations — you\'re a homeowner!',
  },
];

export default function BuyingGuidePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-blue-600 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">The Nigerian Property Buying Guide</h1>
        <p className="text-blue-100 max-w-2xl mx-auto">Everything you need to know about buying property in Nigeria — from budget planning to collecting your keys.</p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-5">
                <div className="shrink-0 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                  {s.step}
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <s.icon size={16} className="text-blue-500" /> {s.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-bold text-gray-900 mb-2">⚠️ Watch Out For</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                'Sellers who cannot produce original title documents',
                'Properties with active court disputes or government acquisition notices',
                'Agents asking for large cash payments without receipts',
                '"Family land" without proper legal documentation',
                'Prices significantly below market value (too good to be true)',
              ].map(w => (
                <li key={w} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span> {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-center">
            <Link href="/search" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Start Your Search
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}