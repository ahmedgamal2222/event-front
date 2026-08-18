import type { Metadata } from 'next';
import './globals.css';
import ApiProxyInterceptor from './components/ApiProxyInterceptor';

export const metadata: Metadata = {
  title: 'Event Management Platform – منصة إدارة الفعاليات',
  description: 'A complete event management platform for summits, conferences, and gatherings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('event_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}`,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&family=Tajawal:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ApiProxyInterceptor />
        {children}
      </body>
    </html>
  );
}
