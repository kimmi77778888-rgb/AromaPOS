import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Lock, Delete, ShieldCheck, ShieldAlert } from 'lucide-react';
import { DEMO_USERS } from '../../services/coffeeData';

export const QuickLockModal = ({ isOpen, onClose }) => {
  const { user, unlockScreen, showToast, staffList } = useApp();
  const { isKhmer } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  if (!isOpen) return null;

  const handleKeyPress = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = (pinToTest) => {
    const allStaff = (staffList && staffList.length > 0) ? staffList : DEMO_USERS;
    const matched = allStaff.find((u) => (u.pin || u.pinCode) === pinToTest);
    
    if (matched) {
      setFailedAttempts(0);
      unlockScreen(matched);
      onClose();
      setPin('');
      return;
    }

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 4) {
      setError(`Warning: ${nextAttempts} failed attempts. Contact Manager or Security Officer if PIN is forgotten.`);
    } else {
      setError('Incorrect 4-digit PIN. Please enter your valid credentials.');
    }
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-6">
        {/* Lock Banner */}
        <div className="space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-100 tracking-tight">
              Terminal Locked
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Current Session Active &bull; Enter confidential 4-digit PIN to resume
            </p>
          </div>
        </div>

        {/* Current Active Staff Badge */}
        <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>Active Operator:</span>
          <span className="font-bold text-stone-200">{user?.name} ({user?.role})</span>
        </div>

        {/* PIN Dots Display */}
        <div className="space-y-2">
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-amber-500 border-amber-400 scale-110 shadow-md shadow-amber-500/50'
                    : 'border-stone-700 bg-stone-950'
                }`}
              ></div>
            ))}
          </div>
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="h-14 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-500 hover:bg-stone-800 text-stone-100 font-extrabold text-lg transition duration-150 active:scale-95 shadow-sm cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-stone-950/40 border border-stone-800 text-stone-500 hover:text-stone-300 text-xs font-bold transition cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-500 hover:bg-stone-800 text-stone-100 font-extrabold text-lg transition duration-150 active:scale-95 shadow-sm cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-stone-950/40 border border-stone-800 text-stone-500 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security Footer Notice */}
        <div className="pt-4 border-t border-stone-800 flex items-center justify-center gap-2 text-stone-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted POS Session &bull; Protected Station</span>
        </div>
      </div>
    </div>
  );
};
