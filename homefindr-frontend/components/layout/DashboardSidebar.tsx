'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Heart, MessageSquare, Search, Home, PlusCircle, Users, BarChart2, ShieldCheck, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const BUYER_LINKS = [
  { label: 'Overview', href: '/dashboard/buyer', icon: LayoutDashboard },
  { label: 'My Favorites', href: '/favorites', icon: Heart },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Saved Searches', href: '/dashboard/buyer#searches', icon: Search },
  { label: 'Profile Settings', href: '/profile', icon: Settings },
];

const AGENT_LINKS = [
  { label: 'Agent Dashboard', href: '/dashboard/agent', icon: LayoutDashboard },
  { label: 'Manage Listings', href: '/dashboard/agent#listings', icon: Home },
  { label: 'Create Listing', href: '/listing/create', icon: PlusCircle },
  { label: 'Lead Inbox', href: '/messages', icon: Users },
];

const ADMIN_LINKS = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Listings', href: '/dashboard/admin#listings', icon: Home },
  { label: 'Users', href: '/dashboard/admin#users', icon: Users },
  { label: 'Analytics', href: '/dashboard/admin#analytics', icon: BarChart2 },
  { label: 'Moderation', href: '/dashboard/admin#moderation', icon: ShieldCheck },
];

interface SidebarProps {
  role?: 'buyer' | 'agent' | 'admin';
  user?: { name: string; email: string; photo: string; role: string };
}

export default function DashboardSidebar({ role = 'buyer', user }: SidebarProps) {
  const pathname = usePathname();
  const links = role === 'agent' ? AGENT_LINKS : role === 'admin' ? ADMIN_LINKS : BUYER_LINKS;
  const defaultUser = { name: 'Tunde Adeyemi', email: 'tunde@example.com', photo: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Buyer' };
  const u = user ?? defaultUser;

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col bg-white border-r border-gray-100 min-h-screen">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
            <Image src={u.photo} alt={u.name} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{u.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard/buyer' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors', active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
              <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
