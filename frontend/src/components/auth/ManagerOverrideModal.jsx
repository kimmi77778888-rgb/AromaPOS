import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  X, 
  KeyRound, 
  AlertTriangle, 
  UserCheck,
  Delete,
  Fingerprint
} from 'lucide-react';

export const ManagerOverrideModal = ({ 
  isOpen, 
  action, 
  details, 
  amount = 0, 
  onSuccess, 
  onClose 
}) => {
  const { user, showToast, loadStaffAndAudits } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = async (pinToVerify = pin) => {
    if (pinToVerify.length < 4) {
      setError('Please enter a full 4-digit manager PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.managerOverride({
        managerPin: pinToVerify,
        action: action || 'MANAGER_OVERRIDE',
        details: details || 'Manager authorization approved',
        cashierId: user?.id,
        cashierName: user?.name,
        amount
      });

      if (result.authorized) {
        showToast(`Override Authorized by ${result.managerName} (${result.managerRole})`, 'success');
        if (loadStaffAndAudits) loadStaffAndAudits();
        if (onSuccess) onSuccess(result);
        onClose();
        handleClear();
      } else {
        setError(result.message || 'Authorization rejected.');
        setPin('');
      }
    } catch (err) {
      setError(err.message || 'Invalid Manager PIN. Access Denied.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-amber-600/40 shadow-2xl shadow-amber-950/60 overflow-hidden flex flex-col">
        {/* Header with Security Badge */}
        <div className="p-5 bg-gradient-to-br from-amber-950/80 via-stone-900 to-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-100 flex items-center gap-1.5">
                <span>Manager Authorization</span>
              </h3>
              <p className="text-[11px] text-amber-400/90 font-medium">Role-Based Override Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Details Card */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Restricted Action</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
              {action || 'PERMISSION OVERRIDE'}
            </span>
          </div>
          <p className="text-xs text-stone-200 font-medium">
            {details || 'This action requires higher level managerial credentials to proceed.'}
          </p>
          {amount > 0 && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/50">
              <span className="text-stone-400">Value of Transaction:</span>
              <span className="font-mono font-bold text-amber-400">${amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
            <Fingerprint className="w-3 h-3 text-stone-400" />
            <span>Initiated by: <strong className="text-stone-300">{user?.name} ({user?.role})</strong></span>
          </div>
        </div>

        {/* PIN Display & Keypad */}
        <div className="p-5 flex flex-col items-center space-y-4">
          <p className="text-xs font-semibold text-stone-300">Enter 4-Digit Manager / Admin PIN</p>

          {/* 4 Bullets Display */}
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    filled
                      ? 'bg-amber-500 ring-4 ring-amber-500/20 scale-110'
                      : 'bg-stone-800 border border-stone-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs text-center flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={loading}
                onClick={() => handleDigit(digit)}
                className="h-12 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-100 text-lg font-bold transition active:scale-95 border border-stone-700/80 flex items-center justify-center cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-12 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 text-xs font-bold transition active:scale-95 border border-stone-700/80 flex items-center justify-center cursor-pointer"
            >
              C
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-100 text-lg font-bold transition active:scale-95 border border-stone-700/80 flex items-center justify-center cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="h-12 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-400 transition active:scale-95 border border-stone-700/80 flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Confidential Security Notice */}
          <div className="w-full pt-3 border-t border-stone-800 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <UserCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Confidential Manager Authorization &bull; Audit Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
};
