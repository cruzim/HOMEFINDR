import { Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-blue-600 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
          <p className="text-blue-100">We&apos;re here to help. Reach out via any channel below.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
            {[
              { icon: Phone, label: 'Phone', value: '+234 800 HOMEFINDR', href: 'tel:+2348004663346' },
              { icon: Mail, label: 'Email', value: 'hello@homefindr.ng', href: 'mailto:hello@homefindr.ng' },
              { icon: MapPin, label: 'Address', value: '14 Adeola Odeku Street, Victoria Island, Lagos', href: null },
              { icon: Clock, label: 'Hours', value: 'Mon – Fri: 8am – 6pm WAT', href: null },
            ].map(c => (
              <div key={c.label} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <c.icon size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</p>
                  {c.href
                    ? <a href={c.href} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{c.value}</a>
                    : <p className="text-sm font-medium text-gray-900">{c.value}</p>
                  }
                </div>
              </div>
            ))}

            <div className="pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" /> Support Channels
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• For property enquiries: <a href="mailto:listings@homefindr.ng" className="text-blue-600 hover:underline">listings@homefindr.ng</a></p>
                <p>• For agent onboarding: <a href="mailto:agents@homefindr.ng" className="text-blue-600 hover:underline">agents@homefindr.ng</a></p>
                <p>• For press enquiries: <a href="mailto:press@homefindr.ng" className="text-blue-600 hover:underline">press@homefindr.ng</a></p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Send a Message</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">First Name</label>
                <input type="text" placeholder="Tunde" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Last Name</label>
                <input type="text" placeholder="Adeyemi" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
              <input type="email" placeholder="tunde@example.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>General enquiry</option>
                <option>Listing support</option>
                <option>Agent registration</option>
                <option>Technical issue</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Message</label>
              <textarea rows={4} placeholder="How can we help you?" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
              Send Message
            </button>
            <p className="text-xs text-gray-400 text-center">We typically respond within 24 hours on business days.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}