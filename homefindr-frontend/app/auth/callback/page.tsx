'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 1. Create a separate component for the logic
function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error("Auth error:", error);
      router.push(`/auth/login?error=${error}`);
      return;
    }

    if (token) {
      // Save token to local storage
      localStorage.setItem('auth_token', token);
      // Redirect to dashboard
      router.push('/dashboard');
    } else {
      // Fallback if no token is present
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Completing sign-in...</p>
    </div>
  );
}

// 2. Wrap the handler in Suspense in the default export
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading authentication...</p>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}