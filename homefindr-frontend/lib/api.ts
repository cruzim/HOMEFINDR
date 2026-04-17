/**
 * HomeFindr API client
 * All calls go through here — handles auth tokens, errors, and base URL.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hf_access_token');
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('hf_access_token', access);
  localStorage.setItem('hf_refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('hf_access_token');
  localStorage.removeItem('hf_refresh_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !retried) {
    const refresh = localStorage.getItem('hf_refresh_token');
    if (refresh) {
      const ref = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (ref.ok) {
        const tokens = await ref.json();
        setTokens(tokens.access_token, tokens.refresh_token);
        return request<T>(path, options, true);
      }
    }
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { detail = (await res.json()).detail || detail; } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  photo_url?: string;
  role?: 'buyer' | 'agent' | 'admin' | 'manager';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export const auth = {
  register: (body: { full_name: string; email: string; phone?: string; password: string; role: string }) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request<TokenPair>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => request<User>('/auth/me'),

  googleOAuth: (code: string, redirect_uri: string) =>
    request<TokenPair>('/auth/google', { method: 'POST', body: JSON.stringify({ code, redirect_uri }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  updateProfile: (body: Partial<User> & { notif_push?: boolean; notif_email?: boolean; notif_sms?: boolean }) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Properties ────────────────────────────────────────────────────────

export interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  area: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  price: number;
  original_price?: number;
  property_type: string;
  beds: number;
  baths: number;
  sqft: number;
  lot_size?: number;
  year_built?: number;
  commission_pct: number;
  amenities: string[];
  highlights: string[];
  images: string[];
  virtual_tour_url?: string;
  video_url?: string;
  open_houses: Array<{ date: string; start: string; end: string }>;
  status: string;
  is_featured: boolean;
  has_virtual_tour: boolean;
  view_count: number;
  save_count: number;
  days_on_market: number;
  agent?: {
    id: string;
    full_name: string;
    photo_url?: string;
    phone?: string;
    email: string;
    is_verified?: boolean;
  };
  is_saved?: boolean;
  created_at: string;
}

export interface PropertyList {
  items: Property[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number; // was incorrectly named "pages" — backend field is total_pages
}

export interface PropertyFilters {
  city?: string;
  area?: string;
  min_price?: number;
  max_price?: number;
  beds?: number;
  baths?: number;
  property_type?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export const properties = {
  list: (filters: PropertyFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    return request<PropertyList>(`/properties?${params}`);
  },

  get: (id: string) => request<Property>(`/properties/${id}`),

  create: (body: object) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: object) =>
    request<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (id: string) =>
    request(`/properties/${id}`, { method: 'DELETE' }),

  // Backend uses a single POST toggle for both save and unsave
  save: (id: string) =>
    request<{ message: string }>(`/properties/${id}/save`, { method: 'POST' }),

  unsave: (id: string) =>
    request<{ message: string }>(`/properties/${id}/save`, { method: 'POST' }),

  // Correct URL: /properties/saved/me
  saved: (page = 1) =>
    request<Property[]>(`/properties/saved/me?page=${page}`),

  myListings: (page = 1) =>
    request<PropertyList>(`/properties/my-listings?page=${page}`),
};

// ── Messages ──────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: object[];
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  property_id?: string;
  buyer_id: string;
  agent_id: string;
  last_message_at?: string;
  messages: Message[];
  created_at: string;
  // populated client-side
  other_user?: User;
  property?: Property;
}

export const messages = {
  conversations: () => request<Conversation[]>('/messages/conversations'),

  startConversation: (body: { agent_id: string; property_id?: string; first_message: string }) =>
    request<Conversation>('/messages/conversations', { method: 'POST', body: JSON.stringify(body) }),

  getConversation: (conversationId: string) =>
    request<Conversation>(`/messages/conversations/${conversationId}`),

  // Correct endpoint: GET /messages/conversations/{id}/messages
  getMessages: (conversationId: string) =>
    request<Message[]>(`/messages/conversations/${conversationId}/messages`),

  send: (conversationId: string, content: string, attachments: object[] = []) =>
    request<Message>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),

  markRead: (conversationId: string) =>
    request(`/messages/conversations/${conversationId}/read`, { method: 'POST' }),

  unreadCount: () => request<{ unread: number }>('/messages/unread-count'),
};

// ── Offers ────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  property_id: string;
  buyer_id: string;
  offer_price: number;
  down_payment_pct: number;
  preferred_closing_date?: string;
  contingencies: string[];
  notes?: string;
  status: string;
  counter_price?: number;
  created_at: string;
  updated_at: string;
}

export const offers = {
  // Correct endpoint: /offers/me (not /offers)
  list: () => request<Offer[]>('/offers/me'),
  get: (id: string) => request<Offer>(`/offers/${id}`),
  create: (body: object) => request<Offer>('/offers', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<Offer>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  forProperty: (propertyId: string) => request<Offer[]>(`/offers/property/${propertyId}`),
};

// ── Viewings ──────────────────────────────────────────────────────────

export interface Viewing {
  id: string;
  property_id: string;
  buyer_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
}

export const viewings = {
  list: () => request<Viewing[]>('/viewings/me'),
  agentUpcoming: () => request<Viewing[]>('/viewings/agent/upcoming'),
  create: (body: object) => request<Viewing>('/viewings', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request<Viewing>(`/viewings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  cancel: (id: string) => request<{ message: string }>(`/viewings/${id}`, { method: 'DELETE' }),
};

// ── Notifications ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notifications = {
  list: () => request<Notification[]>('/users/me/notifications'),
  markAllRead: () => request('/users/me/notifications/read-all', { method: 'POST' }),
};
// ── Admin ─────────────────────────────────────────────────────────────

export const admin = {
  // Listings awaiting approval (status = draft)
  pendingListings: () => request<Property[]>('/admin/listings/pending'),

  // All listings regardless of status — uses the standard list endpoint with no status filter
  allListings: (page = 1, page_size = 100) =>
    request<PropertyList>(`/properties?page=${page}&page_size=${page_size}&status=draft`)
      .then(async (drafts) => {
        const active = await request<PropertyList>(`/properties?page=1&page_size=${page_size}&status=active`);
        const pending = await request<PropertyList>(`/properties?page=1&page_size=${page_size}&status=pending`);
        const rejected = await request<PropertyList>(`/properties?page=1&page_size=${page_size}&status=rejected`);
        return {
          items: [...drafts.items, ...active.items, ...pending.items, ...rejected.items],
          total: drafts.total + active.total + pending.total + rejected.total,
        };
      }),

  approveListing: (id: string) =>
    request<{ message: string }>(`/admin/listings/${id}/approve`, { method: 'POST' }),

  rejectListing: (id: string) =>
    request<{ message: string }>(`/admin/listings/${id}/reject`, { method: 'POST' }),

  featureListing: (id: string) =>
    request<{ message: string }>(`/admin/listings/${id}/feature`, { method: 'POST' }),

  stats: () => request<{
    users: { total: number; buyers: number; agents: number };
    listings: { active: number; pending_review: number };
    activity: { total_offers: number; total_viewings: number };
    revenue_naira: number;
  }>('/admin/stats'),
};