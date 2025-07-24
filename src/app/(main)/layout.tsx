import { Geist, Geist_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { JoyrideProvider } from '@/components/providers/joyride-provider';
import { Toaster } from '@/components/ui/toaster';
import { StaticHeader } from '@/components/landing/static-header';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <JoyrideProvider>
        <div className={`${geistSans.variable} ${geistMono.variable}`}>
          <StaticHeader />
          {children}
          <Toaster />
        </div>
      </JoyrideProvider>
    </QueryProvider>
  );
}
