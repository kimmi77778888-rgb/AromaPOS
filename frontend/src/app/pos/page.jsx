'use client';

import dynamic from 'next/dynamic';

const AppContent = dynamic(
  () => import('@/App').then((mod) => mod.AppContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-stone-950 text-stone-100 font-sans select-none">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <span className="text-xl">☕</span>
        </div>
        <p className="mt-4 text-xs font-mono text-stone-400">Loading AromaPOS Terminal Suite...</p>
      </div>
    ),
  }
);

export default function PosPage() {
  return <AppContent forcePos={true} />;
}

