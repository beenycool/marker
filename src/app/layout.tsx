import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { clientEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'AIMARKER - AI-Powered GCSE Marking 10x Faster',
  description:
    'Get instant, accurate GCSE feedback in seconds with AI-powered marking. Mark practice papers 10x faster with advanced OCR technology. Join the waitlist for early access!',
  keywords: [
    'GCSE',
    'marking',
    'AI',
    'education',
    'feedback',
    'assessment',
    'students',
    'teachers',
    'OCR',
    'handwriting',
    'fast marking',
    'instant feedback',
  ],
  authors: [{ name: 'AIMARKER Team' }],
  creator: 'AIMARKER',
  publisher: 'AIMARKER',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(clientEnv.APP_URL),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AIMARKER',
    startupImage: [
      {
        url: '/icons/icon-192x192.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: clientEnv.APP_URL,
    title: 'AIMARKER - AI-Powered GCSE Marking 10x Faster',
    description:
      'Get instant, accurate GCSE feedback in seconds with AI-powered marking. Mark practice papers 10x faster with advanced OCR technology. Join the waitlist for early access!',
    siteName: 'AIMARKER',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIMARKER - AI-Powered GCSE Marking 10x Faster',
    description:
      'Get instant, accurate GCSE feedback in seconds with AI-powered marking. Mark practice papers 10x faster with advanced OCR technology. Join the waitlist for early access!',
    creator: '@aimarker',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="antialiased bg-black text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
