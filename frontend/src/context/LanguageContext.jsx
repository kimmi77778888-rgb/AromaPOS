'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from '../services/translations';
import { storage } from '../utils/storage';

const LanguageContext = createContext();

export const KHR_EXCHANGE_RATE = 4100; // Standard Cambodia exchange rate: $1 = 4,100 KHR

export const KHMER_FONTS = [
  { id: 'Kantumruy Pro', name: 'Kantumruy Pro', labelKm: 'កន្ទុមរុយ ប្រូ (ស្អាតបំផុត & ទំនើប)', badge: 'Modern Standard' },
  { id: 'Noto Sans Khmer', name: 'Noto Sans Khmer', labelKm: 'ណូតូ សាន (ច្បាស់ល្អ)', badge: 'Google Official' },
  { id: 'Koh Santepheap', name: 'Koh Santepheap', labelKm: 'កោះសន្តិភាព (ស្រាល & ស្អាត)', badge: 'Elegant' },
  { id: 'Siemreap', name: 'Siemreap', labelKm: 'សៀមរាប (សាមញ្ញ & ច្បាស់)', badge: 'Clean Classic' },
  { id: 'Battambang', name: 'Battambang', labelKm: 'បាត់ដំបង (មូល & ទន់)', badge: 'Smooth' }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return storage.getItem('aroma_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const [khmerFont, setKhmerFontState] = useState(() => {
    try {
      return storage.getItem('aroma_khmer_font') || 'Kantumruy Pro';
    } catch (e) {
      return 'Kantumruy Pro';
    }
  });

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    try {
      storage.setItem('aroma_lang', lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        if (lang === 'km') {
          document.documentElement.classList.add('lang-km');
        } else {
          document.documentElement.classList.remove('lang-km');
        }
      }
      // Broadcast to other windows / customer display
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('aroma_customer_channel');
        bc.postMessage({ type: 'LANGUAGE_CHANGE', language: lang });
        bc.close();
      }
    } catch (e) {}
  }, []);

  const setKhmerFont = useCallback((fontName) => {
    setKhmerFontState(fontName);
    try {
      storage.setItem('aroma_khmer_font', fontName);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--font-khmer-active', `'${fontName}', 'Kantumruy Pro', 'Noto Sans Khmer', sans-serif`);
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('aroma_customer_channel');
        bc.postMessage({ type: 'KHMER_FONT_CHANGE', font: fontName });
        bc.close();
      }
    } catch (e) {}
  }, []);

  // Initialize DOM attributes and CSS variables on mount
  useEffect(() => {
    document.documentElement.lang = language;
    if (language === 'km') {
      document.documentElement.classList.add('lang-km');
    } else {
      document.documentElement.classList.remove('lang-km');
    }
    document.documentElement.style.setProperty('--font-khmer-active', `'${khmerFont}', 'Kantumruy Pro', 'Noto Sans Khmer', sans-serif`);
  }, [language, khmerFont]);

  useEffect(() => {
    // Listen for cross-window language and font changes
    const bc = new BroadcastChannel('aroma_customer_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'LANGUAGE_CHANGE' && event.data.language) {
        setLanguageState(event.data.language);
      }
      if (event.data?.type === 'KHMER_FONT_CHANGE' && event.data.font) {
        setKhmerFontState(event.data.font);
      }
    };
    return () => bc.close();
  }, []);

  const t = useCallback((key, fallback = '') => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to English if missing in Khmer
    if (TRANSLATIONS.en[key] !== undefined) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  }, [language]);

  const formatUSD = useCallback((amount) => {
    const num = Number(amount) || 0;
    return `$${num.toFixed(2)}`;
  }, []);

  const formatKHR = useCallback((amountInUSD) => {
    const usd = Number(amountInUSD) || 0;
    const khr = Math.round(usd * KHR_EXCHANGE_RATE);
    return `${khr.toLocaleString()} ៛`;
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        khrExchangeRate: KHR_EXCHANGE_RATE,
        formatUSD,
        formatKHR,
        isKhmer: language === 'km',
        khmerFont,
        setKhmerFont,
        availableKhmerFonts: KHMER_FONTS
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
