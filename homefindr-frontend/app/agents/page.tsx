import Link from 'next/link';
import { Search, Shield, Star, Phone } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Agent Directory' };

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Benin City', 'Jos', 'Ibadan', 'Kano', 'Enugu'];

export default function AgentDirectoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-blue-600 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Agent Directory</h1>
        <p className="text-blue-100 max-w-xl mx-auto">Find verified, professional real estate agents across Nigeria. All agents on HomeFindr are screened and vetted.</p>
      </section>

      {/* Why verified matters */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Use a Verified Agent?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Screened & Licensed', desc: 'All HomeFindr agents hold valid ESVARBON registration and have been background-checked.' },
              { icon: Star, title: 'Rated by Buyers', desc: 'Real reviews from real buyers. See agent ratings before you decide who to work with.' },
              { icon: Phone, title: 'Direct Contact', desc: 'Message or call agents directly through the platform — no middlemen.' },
            ].map(v => (
              <div key={v.title} className="text-center p-6 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by city */}
      <section className="py-14 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Browse Agents by City</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CITIES.map(city => (
              <Link
                key={city}
                href={`/search?location=${encodeURIComponent(city)}`}
                className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-center group">
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{city}</p>
                <p className="text-xs text-gray-400 mt-1">View listings</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Are you an agent? */}
      <section className="py-14 px-6 bg-blue-600 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Are you a real estate agent?</h2>
        <p className="text-blue-100 mb-6 max-w-md mx-auto">Join thousands of agents growing their business on HomeFindr. List properties, receive leads, and close deals faster.</p>
        <Link href="/auth/signup" className="inline-block px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
          Register as Agent
        </Link>
      </section>

      <Footer />
    </div>
  );
}