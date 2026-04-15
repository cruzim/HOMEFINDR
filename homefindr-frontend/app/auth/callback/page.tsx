'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, setTokens } from '@/lib/api';
import { dashboardFor } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google sign-in was cancelled or failed.');
      router.push('/auth/login');
      return;
    }

    if (!code) {
      router.push('/auth/login');
      return;
    }

    // Exchange the Google authorization code for HomeFindr tokens
    const redirectUri = `${window.location.origin}/auth/callback`;

    auth.googleOAuth(code, redirectUri)
      .then(async (tokens) => {
        setTokens(tokens.access_token, tokens.refresh_token);
        const me = await auth.me();
        toast.success('Signed in with Google!');
        router.push(dashboardFor(me.role));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Google sign-in failed';
        toast.error(msg);
        router.push('/auth/login');
      });
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      <p className="mt-4 text-gray-600">Completing sign-in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}