'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Search, Heart, MessageSquare, Bell, Menu, X, ChevronDown, Home, MapPin, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { cn, NIGERIAN_CITIES, NIGERIAN_AREAS } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isPublic = pathname === '/';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchChange(val: string) {
    setQuery(val);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const all = [
      ...NIGERIAN_CITIES,
      ...Object.values(NIGERIAN_AREAS).flat(),
    ].filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 6);
    setSuggestions(all);
    setShowSuggestions(true);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?location=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  }

  const dashboardHref = user?.role === 'agent' ? '/dashboard/agent'
    : user?.role === 'admin' || user?.role === 'manager' ? '/dashboard/admin'
    : '/dashboard/buyer';

  const initials = user
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <button className="lg:hidden p-1 text-gray-500 hover:text-gray-900" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[17px] text-gray-900 hidden sm:block">HomeFindr</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-2">
          <Link href="/search" className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors', pathname.startsWith('/search') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')}>
            Buy
          </Link>
          <Link href="/map" className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors', pathname === '/map' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50')}>
            Map View
          </Link>
        </nav>

        <div ref={searchRef} className="flex-1 max-w-md relative hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length && setShowSuggestions(true)}
                placeholder="Address, City, Area..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
              {suggestions.map(s => (
                <button key={s} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                  onClick={() => { setQuery(s); setShowSuggestions(false); router.push(`/search?location=${encodeURIComponent(s)}`); }}>
                  <MapPin size={14} className="text-gray-400 shrink-0" />{s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {user && (
            <>
              <Link href="/favorites" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Saved">
                <Heart size={20} />
              </Link>
              <Link href="/messages" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Messages">
                <MessageSquare size={20} />
              </Link>
              <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
                <Bell size={20} />
              </button>
            </>
          )}

          {user ? (
            <div ref={userMenuRef} className="relative ml-1">
              <button onClick={() => setUserMenuOpen(o => !o)} className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-blue-200 transition-all">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm bg-blue-600 flex items-center justify-center">
                  {user.photo_url ? (
                    <Image src={user.photo_url} alt={user.full_name} fill className="object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{initials}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <ChevronDown size={14} className={cn('text-gray-500 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full capitalize">{user.role}</span>
                  </div>
                  <Link href={dashboardHref} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <LayoutDashboard size={15} className="text-gray-400" /> My Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <User size={15} className="text-gray-400" /> Profile
                  </Link>
                  <Link href="/favorites" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    <Heart size={15} className="text-gray-400" /> Saved Listings
                  </Link>
                  {(user.role === 'agent') && (
                    <Link href="/listing/create" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <Settings size={15} className="text-gray-400" /> Create Listing
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1">
                    <button onClick={() => { setUserMenuOpen(false); logout(); }} className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Join</Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={e => handleSearchChange(e.target.value)} placeholder="Search city, area or address..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </form>
          <Link href="/search" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Buy Property</Link>
          <Link href="/map" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Map View</Link>
          {user ? (
            <>
              <Link href="/favorites" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Saved Listings</Link>
              <Link href="/messages" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Messages</Link>
              <Link href={dashboardHref} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={() => { setMobileOpen(false); logout(); }} className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">Sign Out</button>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <Link href="/auth/login" className="flex-1 py-2 text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <Link href="/auth/signup" className="flex-1 py-2 text-center text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setMobileOpen(false)}>Join</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
