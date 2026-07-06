import type { Metadata } from 'next';
import './globals.css';
import { TrackerProvider } from '@/context/TrackerContext';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: '습관 트래커',
  description: '목표 · 시스템 · 습관 기반 분기 트래커',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <TrackerProvider>
          <Navigation />
          <main className="max-w-5xl mx-auto px-4 py-6">
            {children}
          </main>
        </TrackerProvider>
      </body>
    </html>
  );
}
