import Link from 'next/link';
import { Home, MapPin, Phone, Mail } from 'lucide-react';

const BROWSE_LINKS = [
  { label: 'Properties for Sale', href: '/search' },
  { label: 'Lagos Listings', href: '/search?location=Lagos' },
  { label: 'Abuja Listings', href: '/search?location=Abuja' },
  { label: 'Port Harcourt', href: '/search?location=Port%20Harcourt' },
  { label: 'Benin City', href: '/search?location=Benin%20City' },
  { label: 'Jos Properties', href: '/search?location=Jos' },
];

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Agent Directory', href: '/agents' },
  { label: 'Blog', href: '/about' },           // stub to about until blog exists
  { label: 'Careers', href: '/contact' },       // stub to contact until careers page exists
  { label: 'Press', href: '/contact' },         // stub to contact until press page exists
];

const RESOURCES_LINKS = [
  { label: 'Buying Guide', href: '/guides/buying' },
  { label: 'Mortgage Calculator', href: '/tools/mortgage' },
  { label: 'Agent Directory', href: '/agents' },
  { label: 'Market Reports', href: '/about' },  // stub to about until reports page exists
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

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
              <a href="tel:+2348004663346" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={13} /> +234 800 HOMEFINDR
              </a>
              <a href="mailto:hello@homefindr.ng" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={13} /> hello@homefindr.ng
              </a>
              <div className="flex items-center gap-2"><MapPin size={13} /> Victoria Island, Lagos, Nigeria</div>
            </div>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Browse</h4>
            <ul className="space-y-2 text-sm">
              {BROWSE_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              {COMPANY_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              {RESOURCES_LINKS.map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} HomeFindr Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}