export type PropertyType = 'Detached Duplex' | 'Semi-Detached Duplex' | 'Terrace House' | 'Detached Bungalow' | 'Flat/Apartment' | 'Mini Flat' | 'Commercial';

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string; // used for neighborhood/area
  price: number;
  originalPrice?: number;
  beds: number;
  baths: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: PropertyType | string;
  status: 'active' | 'pending' | 'sold' | 'price-reduced';
  badge?: 'new' | 'open-house' | 'price-reduced' | 'virtual-tour';
  images: string[];
  description: string;
  highlights: string[];
  amenities: string[];
  agent: Agent;
  lat: number;
  lng: number;
  daysOnMarket: number;
  hoaFee?: number;
  priceHistory: { date: string; price: number; event: string }[];
  openHouses?: { date: string; startTime: string; endTime: string }[];
  virtualTourUrl?: string;
  schools?: { name: string; type: string; rating: number; distance: string }[];
  nearbyAmenities?: { name: string; type: string; distance: string }[];
  views: number;
  saves: number;
}

export interface Agent {
  id: string;
  name: string;
  photo: string;
  title: string;
  rating: number;
  reviews: number;
  phone: string;
  email: string;
  specialties: string[];
  online: boolean;
}

export interface Offer {
  id: string;
  propertyId: string;
  property: Pick<Property, 'address' | 'city' | 'state' | 'price' | 'images'>;
  offerPrice: number;
  downPaymentPct: number;
  status: 'sent' | 'reviewed' | 'countered' | 'accepted' | 'rejected';
  contingencies: string[];
  preferredClosingDate: string;
  submittedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  content: string;
  attachments?: { type: 'image' | 'listing'; url: string; label?: string }[];
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string; photo: string; role: string }[];
  property?: Pick<Property, 'id' | 'address' | 'city' | 'images' | 'price'>;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  newResults: number;
  totalResults: number;
  createdAt: string;
  lastRunAt: string;
}

export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyTypes?: string[];
  minSqft?: number;
  maxSqft?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  maxHoa?: number;
  maxDaysOnMarket?: number;
  hasVirtualTour?: boolean;
  hasOpenHouse?: boolean;
  isNewListing?: boolean;
  amenities?: string[];
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'best-match';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  role?: 'buyer' | 'agent' | 'admin' | 'manager';
  createdAt: string;
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    smsAlerts: boolean;
  };
}

export interface MarketData {
  city: string;
  state: string;
  medianPrice: number;
  priceChange: number;
  daysOnMarket: number;
  listToSoldRatio: number;
}
