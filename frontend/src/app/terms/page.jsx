'use client';

import React from 'react';
import Link from 'next/link';
import { Coffee, FileText, ArrowLeft, CheckCircle2, Shield, AlertCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-xl border-b border-stone-850 px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2.5 text-stone-300 hover:text-white transition text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Return to Storefront</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-md">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight text-white">
              Aroma<span className="text-amber-500">POS</span> Roastery
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10">
        {/* Header Hero */}
        <div className="space-y-4 border-b border-stone-850 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <FileText className="w-4 h-4" />
            <span>Customer Terms & Online Ordering Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed">
            Effective Date: November 21, 2026 • Governed by the laws and e-commerce regulations of the Kingdom of Cambodia.
          </p>
        </div>

        {/* Section 1: Acceptance */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            1. Acceptance of Terms
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            By accessing or placing an order through <strong className="text-white">aromapos-frontend.onrender.com</strong>, creating an account with Google OAuth or verified email, or ordering from our physical POS terminals, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        {/* Section 2: Real Email & Authentication */}
        <section className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            2. Customer Account Integrity & Authentication
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            To safeguard our loyalty points system and ensure delivery accuracy, Aroma Coffee Roastery requires genuine authentication:
          </p>
          <ul className="space-y-2 text-xs text-stone-300">
            <li>• Users must sign in via legitimate <strong className="text-white">Google OAuth 2.0</strong> or register with a verified real consumer email domain (@gmail.com, @yahoo.com, @outlook.com, @icloud.com).</li>
            <li>• Fake, disposable, or bot-generated email accounts are automatically prohibited and rejected by our verification engine.</li>
            <li>• You are responsible for keeping your credentials confidential. AromaPOS is not liable for unauthorized activity resulting from shared credentials.</li>
          </ul>
        </section>

        {/* Section 3: Orders, Delivery & KHQR Payments */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-amber-400">
            3. Ordering, Delivery & Payments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-850 space-y-2">
              <h3 className="font-bold text-white text-sm">Phnom Penh Delivery</h3>
              <p className="text-stone-400 leading-relaxed">
                Orders are fulfilled across Phnom Penh within estimated 20-30 minutes. Dispatch times may vary due to extreme weather or traffic conditions. Live GPS radar status is visible on your account portal.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-850 space-y-2">
              <h3 className="font-bold text-white text-sm">Bakong KHQR Payments</h3>
              <p className="text-stone-400 leading-relaxed">
                Payments via NBC Bakong KHQR are verified in real time. Transactions are billed in USD or Cambodian Khmer Riel (៛) at our published daily exchange rate ($1 = 4,100 KHR).
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Refunds & Cancellations */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            4. Refunds & Quality Guarantee
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            Because our beverages and roasted coffee beans are freshly prepared perishable goods, orders that have entered preparation or delivery cannot be cancelled. However, if your beverage arrives damaged, incorrect, or does not meet our high artisan quality standards, our baristas will immediately prepare a free replacement or issue a full refund.
          </p>
        </section>

        {/* Section 5: Contact */}
        <section className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-3 text-xs">
          <h2 className="text-base font-bold text-white">5. Roastery & Inquiries</h2>
          <p className="text-stone-300">
            For terms inquiries or corporate wholesale inquiries, please reach out directly:
          </p>
          <p className="text-amber-400 font-mono">lensophara@gmail.com • +855 (0)23 999 881</p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-850 py-8 px-4 text-center text-xs text-stone-500 font-mono">
        © 2026 Aroma Coffee Roastery. All rights reserved. Registered in Phnom Penh, Cambodia.
      </footer>
    </div>
  );
}
