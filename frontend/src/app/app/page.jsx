'use client';

import dynamic from 'next/dynamic';

const CoffeeAppMobileExperience = dynamic(
  () => import('@/components/ecommerce/CoffeeAppMobileExperience').then((mod) => mod.CoffeeAppMobileExperience),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#1E1916] text-white font-sans">
        <div className="w-14 h-14 rounded-2xl bg-[#C67C4E]/20 border border-[#C67C4E]/40 flex items-center justify-center animate-pulse">
          <span className="text-2xl">☕</span>
        </div>
        <p className="mt-4 text-xs font-mono text-stone-400">Loading Coffee Shop App UI UX Design...</p>
      </div>
    ),
  }
);

export default function AppPage() {
  return (
    <CoffeeAppMobileExperience 
      standalone={true} 
      onClose={() => { window.location.href = '/'; }} 
    />
  );
}
