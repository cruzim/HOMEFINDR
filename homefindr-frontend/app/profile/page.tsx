'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Bell, Calendar, CreditCard, Shield, CheckCircle } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Tunde Adeyemi', email: 'tunde@example.com', phone: '+234 803 001 2345',
    notifications: true, emailAlerts: true, smsAlerts: false,
  });
  const [saved, setSaved] = useState(false);

  function setField(k: string, v: string | boolean) { setProfile(p => ({ ...p, [k]: v })); }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role="buyer" />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 md:p-8 max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500">Manage your account details and preferences.</p>
          </div>

          {/* Photo */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Profile Photo</h2>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                <Image src="https://randomuser.me/api/portraits/men/32.jpg" alt="Profile" fill className="object-cover" />
                <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera size={18} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <button className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Change photo</button>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
            {[
              { key: 'name', label: 'Full Name', type: 'text' },
              { key: 'email', label: 'Email Address', type: 'email' },
              { key: 'phone', label: 'Phone Number', type: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                <input type={f.type} value={profile[f.key as keyof typeof profile] as string}
                  onChange={e => setField(f.key, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell size={16} className="text-blue-500" /> Notifications</h2>
            <div className="space-y-3">
              {[
                { key: 'notifications', label: 'Push Notifications', sub: 'Get alerts on your device' },
                { key: 'emailAlerts', label: 'Email Alerts', sub: 'New listings and price changes' },
                { key: 'smsAlerts', label: 'SMS Alerts', sub: 'Viewing reminders via text' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.sub}</p>
                  </div>
                  <button onClick={() => setField(n.key, !profile[n.key as keyof typeof profile])}
                    className={`relative w-11 h-6 rounded-full transition-colors ${profile[n.key as keyof typeof profile] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile[n.key as keyof typeof profile] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-500" /> Linked Calendars</h2>
            <div className="space-y-2">
              {[
                { name: 'Google Calendar', connected: true },
                { name: 'Apple iCal', connected: false },
              ].map(c => (
                <div key={c.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">{c.name}</span>
                  {c.connected ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle size={13} /> Connected</span>
                  ) : (
                    <button className="text-xs font-semibold text-blue-600 hover:underline">Connect</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={16} className="text-blue-500" /> Payment Methods</h2>
            <div className="p-3 border border-gray-100 rounded-xl flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">VISA</span>
                </div>
                <span className="text-sm text-gray-700">•••• •••• •••• 4242</span>
              </div>
              <span className="text-xs text-gray-400">Expires 12/26</span>
            </div>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
              + Add payment method
            </button>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} className="text-blue-500" /> Security</h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Change Password
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Enable Two-Factor Authentication
              </button>
            </div>
          </div>

          <button onClick={handleSave} className={`w-full py-3 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {saved ? '✓ Changes Saved!' : 'Save Changes'}
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
}
