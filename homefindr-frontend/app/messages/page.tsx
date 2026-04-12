'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Paperclip, Phone, Video, MapPin, Calendar, ChevronLeft, Search } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { CONVERSATIONS } from '@/data/mock';
import { formatPrice, cn } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

export default function MessagesPage() {
  const [active, setActive] = useState<Conversation>(CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>(CONVERSATIONS[0].messages);
  const [input, setInput] = useState('');
  const [showList, setShowList] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function switchConversation(conv: Conversation) {
    setActive(conv);
    setMessages(conv.messages);
    setShowList(false);
  }

  function sendMessage() {
    if (!input.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: active.id,
      senderId: 'user-1',
      senderName: 'You',
      senderPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setMessages(m => [...m, msg]);
    setInput('');
  }

  const other = active.participants.find(p => p.id !== 'user-1')!;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      <DashboardSidebar role="buyer" />

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
          {CONVERSATIONS.map(conv => {
            const o = conv.participants.find(p => p.id !== 'user-1')!;
            const isActive = conv.id === active.id;
            return (
              <button key={conv.id} onClick={() => switchConversation(conv)}
                className={cn('w-full flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left', isActive && 'bg-blue-50 hover:bg-blue-50')}>
                <div className="relative shrink-0">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image src={o.photo} alt={o.name} fill className="object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{o.name}</p>
                    <p className="text-[10px] text-gray-400 shrink-0">{conv.lastMessageTime}</p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                  {conv.property && (
                    <p className="text-[10px] text-blue-600 font-medium truncate mt-0.5 flex items-center gap-0.5">
                      <MapPin size={9} /> {conv.property.address}
                    </p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{conv.unreadCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat thread */}
      <div className={cn('flex-1 flex flex-col bg-white', showList && 'hidden md:flex')}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
          <button onClick={() => setShowList(true)} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
            <Image src={other.photo} alt={other.name} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{other.name}</p>
            {active.property && (
              <p className="text-xs text-blue-600 font-medium flex items-center gap-1 truncate">
                <MapPin size={10} /> {active.property.address} · {formatPrice(active.property.price)}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <a href={`tel:+234`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Phone size={16} />
            </a>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Video size={16} />
            </button>
          </div>
        </div>

        {/* Property context card */}
        {active.property && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <Link href={`/listing/${active.property.id}`} className="flex items-center gap-3 hover:bg-gray-100 rounded-xl p-2 transition-colors">
              <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                <Image src={active.property.images[0]} alt={active.property.address} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{active.property.address}</p>
                <p className="text-xs text-blue-600 font-bold">{formatPrice(active.property.price)}</p>
              </div>
              <span className="text-xs text-blue-600 font-semibold shrink-0">View →</span>
            </Link>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.senderId === 'user-1';
            return (
              <div key={msg.id} className={cn('flex gap-2 msg-enter', isMe && 'flex-row-reverse')}>
                {!isMe && (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1">
                    <Image src={msg.senderPhoto} alt={msg.senderName} fill className="object-cover" />
                  </div>
                )}
                <div className={cn('max-w-[72%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
                  <div className={cn('px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm')}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-gray-400">{msg.timestamp}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 flex gap-2 border-t border-gray-100">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <Calendar size={12} /> Schedule Viewing
          </button>
          <Link href="/offers" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
            Make Offer
          </Link>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Paperclip size={18} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          <button onClick={sendMessage} disabled={!input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
