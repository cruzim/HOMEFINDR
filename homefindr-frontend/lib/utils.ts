import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format price in Nigerian Naira — compact above 1M */
export function formatPrice(price: number): string {
  if (price >= 1_000_000_000) return `₦${(price / 1_000_000_000).toFixed(2)}B`;
  if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(0)}M`;
  return `₦${price.toLocaleString('en-NG')}`;
}

/** Full formatted price with commas */
export function formatFullPrice(price: number): string {
  return `₦${price.toLocaleString('en-NG')}`;
}

export function formatSqft(sqft: number): string {
  return `${sqft.toLocaleString()} sqft`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getBadgeColor(badge: string): string {
  switch (badge) {
    case 'new': return 'bg-emerald-500 text-white';
    case 'open-house': return 'bg-blue-600 text-white';
    case 'price-reduced': return 'bg-orange-500 text-white';
    case 'virtual-tour': return 'bg-purple-600 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export function getBadgeLabel(badge: string): string {
  switch (badge) {
    case 'new': return 'NEW';
    case 'open-house': return 'OPEN HOUSE';
    case 'price-reduced': return 'PRICE REDUCED';
    case 'virtual-tour': return 'VIRTUAL TOUR';
    default: return badge.toUpperCase();
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-emerald-600 bg-emerald-50';
    case 'pending': return 'text-orange-600 bg-orange-50';
    case 'sold': return 'text-gray-600 bg-gray-100';
    case 'price-reduced': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getOfferStatusColor(status: string): string {
  switch (status) {
    case 'sent': return 'text-blue-600 bg-blue-50';
    case 'reviewed': return 'text-yellow-600 bg-yellow-50';
    case 'countered': return 'text-orange-600 bg-orange-50';
    case 'accepted': return 'text-emerald-600 bg-emerald-50';
    case 'rejected': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const NIGERIAN_CITIES = [
  'Lagos', 'Abuja', 'Port Harcourt', 'Benin City', 'Jos',
  'Ibadan', 'Kano', 'Kaduna', 'Enugu', 'Owerri',
];

export const NIGERIAN_AREAS: Record<string, string[]> = {
  Lagos: ['Ikoyi', 'Victoria Island', 'Banana Island', 'Lekki Phase 1', 'Lekki Phase 2', 'Ajah', 'Ikeja GRA', 'Magodo', 'Surulere', 'Yaba', 'Oshodi'],
  Abuja: ['Maitama', 'Asokoro', 'Wuse II', 'Garki', 'Gwarinpa', 'Jabi', 'Utako', 'Katampe', 'Lugbe', 'Kubwa'],
  'Port Harcourt': ['GRA Phase 1', 'GRA Phase 2', 'Trans Amadi', 'Old GRA', 'Eliozu', 'Rumuola', 'Diobu', 'Ada George'],
  'Benin City': ['GRA', 'Independence Layout', 'Ugbowo', 'Sapele Road', 'New Benin', 'Adesuwa', 'Ikpoba Hill'],
  Jos: ['Hill Station', 'Anglo-Jos', 'Rayfield', 'Jenta', 'Bukuru', 'Bauchi Road'],
};

export const PROPERTY_TYPES = [
  'Detached Duplex',
  'Semi-Detached Duplex',
  'Terrace House',
  'Detached Bungalow',
  'Flat/Apartment',
  'Mini Flat',
  'Commercial',
];

export const AMENITIES_LIST = [
  'Swimming Pool', 'Boys Quarters', 'Generator/Inverter', 'CCTV & Security',
  'Air Conditioning', '4+ Car Garage', 'Smart Home', 'Waterfront',
  'Gatehouse', 'Electric Fence', 'Borehole', 'Solar Panels',
];
