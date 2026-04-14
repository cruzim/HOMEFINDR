'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Heart, MessageSquare, Search, Home, PlusCircle, Users, BarChart2, ShieldCheck, LogOut, Settings, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const BUYER_LINKS = [
  { label: 'Overview', href: '/dashboard/buyer', icon: LayoutDashboard },
  { label: 'My Favorites', href: '/favorites', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Schedule', href: '/schedule', icon: Calendar },
  { label: 'My Offers', href: '/offers', icon: Search },
  { label: 'Profile Settings', href: '/profile', icon: Settings },
];

const AGENT_LINKS = [
  { label: 'Agent Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
  { label: 'Create Listing', href: '/listing/create', icon: PlusCircle },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'My Offers', href: '/offers', icon: Search },
  { label: 'Profile Settings', href: '/profile', icon: Settings },
];

const ADMIN_LINKS = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'All Listings', href: '/search', icon: Home },
  { label: 'Users', href: '/dashboard/admin', icon: Users },
  { label: 'Analytics', href: '/dashboard/admin', icon: BarChart2 },
  { label: 'Moderation', href: '/dashboard/admin', icon: ShieldCheck },
];

interface SidebarProps {
  role?: 'buyer' | 'agent' | 'admin';
}

export default function DashboardSidebar({ role = 'buyer' }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const links = role === 'agent' ? AGENT_LINKS : role === 'admin' ? ADMIN_LINKS : BUYER_LINKS;

  const initials = user
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col bg-white border-r border-gray-100 min-h-screen">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm overflow-hidden">
            {user?.photo_url ? (
              <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name || 'Loading...'}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role || role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={label} href={href}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
              <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
