'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [role, setRole] = useState<'buyer' | 'agent'>('buyer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    window.location.href = '/dashboard/buyer';
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-blue-600">
        <Image src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80" alt="Nigerian home" fill className="object-cover mix-blend-luminosity opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">HomeFindr</span>
          </div>
          <div>
            <h2 className="text-white text-3xl font-bold mb-6">Join Nigeria&apos;s #1 Real Estate Platform</h2>
            <ul className="space-y-3">
              {['Access 10,000+ listings across Nigeria', 'Connect with verified agents', 'Get market insights and price alerts', 'Secure offer & payment processing'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-blue-100 text-sm">
                  <CheckCircle size={16} className="text-white shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Join HomeFindr — it only takes 2 minutes.</p>

          {/* Role toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['buyer', 'agent'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${role === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                I am a {r}
              </button>
            ))}
          </div>

          {/* Google */}
          <button className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-5">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400">or with email</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Tunde Adeyemi' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'tunde@example.com' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+234 803 000 0000' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} required
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            ))}

            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Creating account...</> : 'Create Account'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By signing up you agree to our{' '}
              <Link href="#" className="text-blue-600 hover:underline">Terms</Link> &amp;{' '}
              <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
