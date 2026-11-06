'use client';

import dynamic from 'next/dynamic';

const AppContent = dynamic(
  () => import('@/App').then((mod) => mod.AppContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-stone-100 font-sans select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-950/40 animate-pulse">
            <span className="text-2xl">☕</span>
          </div>
        </div>
        <div className="mt-5 text-center space-y-1">
          <h2 className="text-base font-bold text-stone-200 tracking-tight">
            Aroma<span className="text-amber-500">POS</span> Terminal
          </h2>
          <p className="text-xs text-stone-500 font-mono">Initializing Secure POS Suite...</p>
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  return <AppContent />;
}

