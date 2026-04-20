'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Phone, Video, MapPin, ChevronLeft, Search, MessageSquare } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { messages as api, type Conversation, type Message } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ── Simple in-memory user-name cache ─────────────────────────────────
const userNameCache: Record<string, { name: string; initials: string }> = {};
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchUserName(id: string, token: string | null): Promise<{ name: string; initials: string }> {
  if (userNameCache[id]) return userNameCache[id];
  try {
    const res = await fetch(`${BASE}/users/${id}/public`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      const name = data.full_name || 'Unknown';
      const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      userNameCache[id] = { name, initials };
      return userNameCache[id];
    }
  } catch {}
  const fallback = { name: id.slice(0, 8), initials: id.slice(0, 2).toUpperCase() };
  return fallback;
}

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showList, setShowList] = useState(true);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sending, setSending] = useState(false);
  // Map of userId -> display info for the chat header / list
  const [userNames, setUserNames] = useState<Record<string, { name: string; initials: string }>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    if (!loading && !user) { router.push('/auth/login'); return; }
    if (user) loadConversations();
  }, [user, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  // Polling: refresh messages every 2.5 s while a conversation is open
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!active) return;

    pollingRef.current = setInterval(async () => {
      try {
        const fresh = await api.getMessages(active.id);
        if (fresh.length !== lastMsgCountRef.current) {
          lastMsgCountRef.current = fresh.length;
          setMsgs(fresh);
        }
      } catch {}
    }, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [active?.id]);

  async function loadConversations() {
    try {
      const convs = await api.conversations();
      setConversations(convs);
      // Pre-fetch names for all participants
      const token = localStorage.getItem('hf_access_token');
      const ids = new Set<string>();
      convs.forEach(c => { ids.add(c.buyer_id); ids.add(c.agent_id); });
      const entries = await Promise.all(
        [...ids].map(async id => [id, await fetchUserName(id, token)] as const)
      );
      setUserNames(Object.fromEntries(entries));
      if (convs.length > 0) openConversation(convs[0]);
    } catch {}
    finally { setLoadingConvs(false); }
  }

  async function openConversation(conv: Conversation) {
    setActive(conv);
    setShowList(false);
    lastMsgCountRef.current = 0;
    try {
      const history = await api.getMessages(conv.id);
      lastMsgCountRef.current = history.length;
      setMsgs(history);
    } catch {
      setMsgs(conv.messages || []);
    }

    // Fetch names if not yet in cache
    const token = localStorage.getItem('hf_access_token');
    const toFetch = [conv.buyer_id, conv.agent_id].filter(id => !userNames[id]);
    if (toFetch.length > 0) {
      const entries = await Promise.all(
        toFetch.map(async id => [id, await fetchUserName(id, token)] as const)
      );
      setUserNames(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    }
  }

  async function sendMessage() {
    if (!input.trim() || !active || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    // Optimistic insert
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: active.id,
      sender_id: user!.id,
      content,
      attachments: [],
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMsgs(m => [...m, optimistic]);
    lastMsgCountRef.current += 1;

    try {
      const sent = await api.send(active.id, content);
      setMsgs(m => m.map(msg => msg.id === optimistic.id ? sent : msg));
    } catch {
      setMsgs(m => m.filter(msg => msg.id !== optimistic.id));
      lastMsgCountRef.current -= 1;
      toast.error('Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const role = user!.role === 'agent' ? 'agent' : 'buyer';

  function getOtherUser(conv: Conversation) {
    const otherId = user!.role === 'buyer' ? conv.agent_id : conv.buyer_id;
    return userNames[otherId] ?? { name: otherId.slice(0, 8), initials: otherId.slice(0, 2).toUpperCase() };
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <DashboardSidebar role={role} />

      {/* Conversation list */}
      <div className={cn('w-full md:w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col', !showList && 'hidden md:flex')}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Contact an agent from a listing to start a conversation</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === active?.id;
              const other = getOtherUser(conv);
              const lastMsg = conv.messages?.[conv.messages.length - 1];
              return (
                <button key={conv.id} onClick={() => openConversation(conv)}
                  className={cn('w-full flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left', isActive && 'bg-blue-50 hover:bg-blue-50')}>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm">
                    {other.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">{other.name}</p>
                      {conv.last_message_at && (
                        <p className="text-[10px] text-gray-400 shrink-0">{formatTime(conv.last_message_at)}</p>
                      )}
                    </div>
                    {lastMsg && <p className="text-xs text-gray-500 truncate">{lastMsg.content}</p>}
                    {conv.property_id && (
                      <p className="text-[10px] text-blue-600 font-medium mt-0.5 flex items-center gap-0.5">
                        <MapPin size={9} /> Property linked
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat thread */}
      {active ? (
        <div className={cn('flex-1 flex flex-col bg-white', showList && 'hidden md:flex')}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
            <button onClick={() => setShowList(true)} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
              <ChevronLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
              {getOtherUser(active).initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">
                {getOtherUser(active).name}
              </p>
              {active.property_id && (
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <MapPin size={10} /> Property conversation
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Phone size={16} /></button>
              <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Video size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {msgs.map(msg => {
              const isMe = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={cn('flex gap-2', isMe && 'flex-row-reverse')}>
                  <div className={cn('max-w-[72%] flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start')}>
                    <div className={cn('px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm')}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-gray-100 flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className={cn('flex-1 flex items-center justify-center bg-white text-gray-400', showList && 'hidden md:flex')}>
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="font-medium">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}