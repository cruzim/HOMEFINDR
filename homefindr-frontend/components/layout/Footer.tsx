import Link from 'next/link';
import { Home, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white font-bold text-lg">HomeFindr</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Nigeria&apos;s trusted real estate marketplace. Connecting buyers, sellers, and agents across Lagos, Abuja, Port Harcourt, and beyond.
            </p>
            <div className="mt-4 space-y-1.5 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Phone size={13} /> +234 800 HOMEFINDR</div>
              <div className="flex items-center gap-2"><Mail size={13} /> hello@homefindr.ng</div>
              <div className="flex items-center gap-2"><MapPin size={13} /> Victoria Island, Lagos, Nigeria</div>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Browse</h4>
            <ul className="space-y-2 text-sm">
              {['Properties for Sale', 'Lagos Listings', 'Abuja Listings', 'Port Harcourt', 'Benin City', 'Jos Properties'].map(l => (
                <li key={l}><Link href="/search" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Careers', 'Press', 'Blog', 'Contact'].map(l => (
                <li key={l}><Link href="#" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              {['Buying Guide', 'Market Reports', 'Mortgage Calculator', 'Agent Directory', 'Privacy Policy', 'Terms of Service'].map(l => (
                <li key={l}><Link href="#" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2024 HomeFindr Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
