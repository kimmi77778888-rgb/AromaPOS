import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, Coffee } from 'lucide-react';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Coffee className="w-5 h-5 text-amber-300 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-stone-900/95';
      case 'warning':
        return 'border-amber-500/40 bg-stone-900/95';
      case 'error':
        return 'border-rose-500/40 bg-stone-900/95';
      default:
        return 'border-amber-700/40 bg-stone-900/95';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border ${getBorderColor()} text-stone-100 transition-all transform duration-300`}
      >
        {getIcon()}
        <p className="text-sm font-medium tracking-wide">{toast.message}</p>
      </div>
    </div>
  );
};
