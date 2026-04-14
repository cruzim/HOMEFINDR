import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'HomeFindr — Find Your Perfect Home in Nigeria', template: '%s | HomeFindr' },
  description: 'Search thousands of properties for sale across Lagos, Abuja, Port Harcourt, Benin City and Jos. Nigeria\'s most trusted real estate marketplace.',
  keywords: ['real estate Nigeria', 'houses for sale Lagos', 'property Abuja', 'buy house Nigeria'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '10px', fontSize: '14px' } }} />
        </AuthProvider>
      </body>
    </html>
  );
}
