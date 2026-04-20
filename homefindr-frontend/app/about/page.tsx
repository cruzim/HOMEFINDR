import Link from 'next/link';
import { Home, Users, Shield, TrendingUp, MapPin } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About HomeFindr</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Nigeria&apos;s most trusted real estate marketplace — connecting buyers, sellers, and verified agents across the country.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            HomeFindr was founded with one goal: to make finding, buying, and selling property in Nigeria transparent, efficient, and trustworthy. We believe every Nigerian deserves access to reliable property data and professional agents.
          </p>
          <p className="text-gray-600 leading-relaxed">
            From our headquarters in Victoria Island, Lagos, our team works every day to improve the Nigerian real estate experience — eliminating fraud, reducing paperwork, and putting the power back in the hands of buyers and sellers.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10,000+', label: 'Listings' },
            { value: '5,000+', label: 'Happy Buyers' },
            { value: '500+', label: 'Verified Agents' },
            { value: '15', label: 'Cities Covered' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-blue-600 mb-1">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Trust & Transparency', desc: 'Every listing is verified. Every agent is screened. No hidden fees.' },
              { icon: Users, title: 'Agent Excellence', desc: 'We partner only with professional, licensed agents committed to client satisfaction.' },
              { icon: TrendingUp, title: 'Market Intelligence', desc: 'Real-time pricing data and market reports so you always make informed decisions.' },
            ].map(v => (
              <div key={v.title} className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon size={22} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Offices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { city: 'Lagos (HQ)', address: '14 Adeola Odeku Street, Victoria Island' },
              { city: 'Abuja', address: '22 Gana Street, Maitama District' },
              { city: 'Port Harcourt', address: '5 Evo Road, GRA Phase 2' },
            ].map(o => (
              <div key={o.city} className="bg-white rounded-2xl p-5 border border-gray-100">
                <p className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                  <MapPin size={14} className="text-blue-500" /> {o.city}
                </p>
                <p className="text-sm text-gray-500">{o.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-10 text-center">
        <Link href="/search" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          Browse Listings
        </Link>
      </div>

      <Footer />
    </div>
  );
}