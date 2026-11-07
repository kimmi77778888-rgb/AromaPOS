'use client';

import { useEffect } from 'react';

/**
 * AntiTamperGuard
 * Client-side security layer for AromaPOS.
 * Protects POS cashier screens and customer displays against:
 * 1. Unauthorized DevTools inspection (F12, Ctrl+Shift+I/J/C)
 * 2. Source code viewing shortcuts (Ctrl+U)
 * 3. Right-click context menu tampering
 * 4. Memory/Console script injection
 */
export const AntiTamperGuard = () => {
  useEffect(() => {
    // Only enforce strict lockdown in production mode
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Prevent Right-Click Context Menu
    const handleContextMenu = (e) => {
      if (isProduction) {
        e.preventDefault();
        return false;
      }
    };

    // 2. Prevent Common Inspection Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (!isProduction) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // F12 -> DevTools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I -> DevTools Inspect
      // Ctrl+Shift+J / Cmd+Option+J -> DevTools Console
      // Ctrl+Shift+C / Cmd+Option+C -> DevTools Element Inspector
      if (cmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U -> View Page Source
      if (cmdOrCtrl && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S -> Save Page HTML
      if (cmdOrCtrl && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Clear Console & Print Security Warning Banner
    if (isProduction) {
      try {
        console.clear();
        console.log(
          '%c🛑 AROMA POS SECURITY WARNING 🛑',
          'color: #ef4444; font-size: 24px; font-weight: bold; background: #1c1917; padding: 10px; border-radius: 8px;'
        );
        console.log(
          '%cThis is a secured commercial Point-of-Sale terminal. Running unauthorized scripts or attempting to reverse-engineer this system violates security policy.',
          'color: #f59e0b; font-size: 13px; font-weight: 600;'
        );
      } catch (_) {
        // Silently ignore if console is overridden
      }
    }

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return null;
};
