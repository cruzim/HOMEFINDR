'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Extract the token sent back from your backend after successful Google OAuth
    const token = searchParams.get('token');
    
    if (token) {
      // Store the token for future authenticated requests
      localStorage.setItem('auth_token', token);
      // Redirect the user to their dashboard
      router.push('/dashboard');
    } else {
      // Redirect to login with an error if no token is found
      router.push('/auth/login?error=OAuthFailed');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Completing login...</h1>
        <p className="text-gray-500">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}