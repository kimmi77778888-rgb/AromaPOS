'use client';

import React from 'react';
import Link from 'next/link';
import { Coffee, ShieldCheck, ArrowLeft, Mail, Globe, Lock, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy & Google OAuth Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed">
            Effective Date: November 21, 2026 • Last updated for Google OAuth 2.0 & National Bank of Cambodia (NBC) Bakong Standards.
          </p>
        </div>

        {/* Section 1: Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            1. Overview & Identity
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            Aroma Coffee Roastery (&quot;AromaPOS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the storefront and POS services at <strong className="text-white">aromapos-frontend.onrender.com</strong>. We are committed to protecting the privacy, security, and integrity of personal information shared by our customers and guests.
          </p>
        </section>

        {/* Section 2: Google User Data Policy */}
        <section className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            2. Google OAuth 2.0 User Data Policy
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            When you sign in using <strong className="text-white">Sign In with Google</strong>, our application requests access solely to your basic profile information:
          </p>
          <ul className="space-y-2 text-xs text-stone-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Primary Email Address:</strong> Used strictly to identify your customer account, send order receipts, and prevent fraudulent duplicate accounts. Only real consumer email addresses (@gmail.com, etc.) are accepted.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Full Name & Avatar:</strong> Used to personalize your cafe order experience, your barista pickup ticket, and display your loyalty points status.</span>
            </li>
          </ul>
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-600/30 text-xs text-amber-200">
            <strong>Limited Use Requirement:</strong> Aroma Coffee Roastery adheres strictly to the Google API Services User Data Policy. We never sell your personal data, never share Google profile credentials with third-party advertisers, and never use your data for unauthorized profiling.
          </div>
        </section>

        {/* Section 3: Data Collection & Usage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400">
            3. Information We Collect
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-850 space-y-1.5">
              <h3 className="font-bold text-white text-sm">Order & Delivery Information</h3>
              <p className="text-stone-400 leading-relaxed">
                Delivery street addresses in Phnom Penh (e.g. Boeng Keng Kang, Tuol Kouk), customer contact phone number, and barista preparation preferences.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-850 space-y-1.5">
              <h3 className="font-bold text-white text-sm">Payment Transactions</h3>
              <p className="text-stone-400 leading-relaxed">
                Transactions via NBC Bakong KHQR, ABA Pay, or Cash On Delivery (COD). We do not store raw credit card numbers or banking passwords.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Data Retention & Account Deletion */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-amber-400">
            4. Data Retention & Deletion
          </h2>
          <p className="text-sm text-stone-300 leading-relaxed">
            Customers have the right to request deletion of their account, order history, and saved delivery addresses at any time. To request account deletion or data export, email our developer and data protection officer at <strong className="text-white">lensophara@gmail.com</strong>.
          </p>
        </section>

        {/* Section 5: Developer Contact */}
        <section className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800/80 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" />
            5. Contact Information
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed">
            For questions about this Privacy Policy, your customer account, or Google OAuth integration, please contact:
          </p>
          <div className="text-xs text-stone-300 space-y-1 font-mono pt-2">
            <p>• Lead Developer: <strong className="text-white">Sophara Len</strong></p>
            <p>• Contact Email: <a href="mailto:lensophara@gmail.com" className="text-amber-400 underline">lensophara@gmail.com</a></p>
            <p>• Roastery Address: #57 Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh, Cambodia</p>
            <p>• Official Hotline: +855 (0)23 999 881</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-850 py-8 px-4 text-center text-xs text-stone-500 font-mono">
        © 2026 Aroma Coffee Roastery. All rights reserved. Registered in Phnom Penh, Cambodia.
      </footer>
    </div>
  );
}
