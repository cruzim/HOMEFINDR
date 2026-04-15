'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, CheckCircle } from 'lucide-react';
import { useAuth, dashboardFor } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<'buyer' | 'agent'>('buyer');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/\d/.test(form.password)) {
      setError('Password must contain at least one digit.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ ...form, role, phone: form.phone || undefined });
      toast.success('Account created! Welcome to HomeFindr.');
      // Redirect to the correct dashboard for the user's role
      router.push(dashboardFor(user.role));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
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
              {['Access thousands of listings across Nigeria', 'Connect with verified agents', 'Get market insights and price alerts', 'Secure offer processing'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-blue-100 text-sm">
                  <CheckCircle size={16} className="text-white shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-6">Join HomeFindr — it only takes 2 minutes.</p>

          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['buyer', 'agent'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${role === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                I am a {r}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Tunde Adeyemi', required: true },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'tunde@example.com', required: true },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+234 803 000 0000', required: false },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••', required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input type={f.type} placeholder={f.placeholder} required={f.required}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            ))}

            {form.password && form.password.length > 0 && !/\d/.test(form.password) && (
              <p className="text-xs text-amber-600">Password must contain at least one digit.</p>
            )}

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