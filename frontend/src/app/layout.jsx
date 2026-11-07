import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AntiTamperGuard } from '@/components/security/AntiTamperGuard';

export const metadata = {
  title: 'AromaPOS — Artisan Coffee POS & Inventory Management',
  description: 'Artisan Coffee Shop Point of Sale and Inventory Management System featuring dynamic analytics, real-time stock sync, and modern warm aesthetics.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C68B59' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M17 8h1a4 4 0 1 1 0 8h-1'></path><path d='M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z'></path><line x1='6' y1='2' x2='6' y2='4'></line><line x1='10' y1='2' x2='10' y2='4'></line><line x1='14' y1='2' x2='14' y2='4'></line></svg>",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="km" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Koh+Santepheap:wght@300;400;700;900&family=Noto+Sans+Khmer:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Siemreap&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-stone-950 text-stone-100 antialiased selection:bg-amber-600/30 selection:text-amber-200">
        <AntiTamperGuard />
        <LanguageProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

