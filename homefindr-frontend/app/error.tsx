'use client';

import { useEffect } from 'react';
import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to error tracking in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try again — if the problem persists, contact support.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
            <RefreshCw size={16} /> Try Again
          </button>
          <Link href="/" className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
            <Home size={16} /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}