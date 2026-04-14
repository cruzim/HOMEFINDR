'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Bell, Shield, CheckCircle } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, refresh, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    photo_url: '',
    notif_push: true,
    notif_email: true,
    notif_sms: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) {
      setForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        photo_url: user.photo_url || '',
        notif_push: true,
        notif_email: true,
        notif_sms: false,
      });
    }
  }, [user, loading, router]);

  async function handleSave() {
    setSaving(true);
    try {
      await auth.updateProfile({
        full_name: form.full_name,
        phone: form.phone || undefined,
        photo_url: form.photo_url || undefined,
        notif_push: form.notif_push,
        notif_email: form.notif_email,
        notif_sms: form.notif_sms,
      });
      await refresh();
      toast.success('Profile updated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = user.role === 'agent' ? 'agent' : 'buyer';
  const initials = user.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role={role} />
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
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0 bg-blue-600 flex items-center justify-center">
                {user.photo_url ? (
                  <Image src={user.photo_url} alt="Profile" fill className="object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
                <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                  <Camera size={18} className="text-white" />
                </button>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full capitalize">{user.role}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Photo URL</label>
              <input
                type="url"
                value={form.photo_url}
                onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Paste a direct image URL (e.g. from Gravatar)</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
              <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
              <input type="email" value={user.email} disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+234 803 000 0000"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell size={16} className="text-blue-500" /> Notifications</h2>
            <div className="space-y-3">
              {[
                { key: 'notif_push', label: 'Push Notifications', sub: 'Get alerts on your device' },
                { key: 'notif_email', label: 'Email Alerts', sub: 'New listings and price changes' },
                { key: 'notif_sms', label: 'SMS Alerts', sub: 'Viewing reminders via text' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.label}</p>
                    <p className="text-xs text-gray-500">{n.sub}</p>
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, [n.key]: !f[n.key as keyof typeof f] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form[n.key as keyof typeof form] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[n.key as keyof typeof form] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Account status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} className="text-blue-500" /> Account Status</h2>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle size={16} className={user.is_verified ? 'text-emerald-500' : 'text-gray-400'} />
              <span className={user.is_verified ? 'text-emerald-700' : 'text-gray-500'}>
                {user.is_verified ? 'Email verified' : 'Email not verified'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              <CheckCircle size={16} className={user.is_active ? 'text-emerald-500' : 'text-gray-400'} />
              <span className={user.is_active ? 'text-emerald-700' : 'text-red-600'}>
                {user.is_active ? 'Account active' : 'Account suspended'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3">Member since {new Date(user.created_at).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-bold transition-all bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
}
