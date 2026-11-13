import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { soundService } from '../../services/soundService';
import {
  BellRing,
  VolumeX,
  Volume2,
  AlertTriangle,
  Radio,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const EmergencyAlarmModal = () => {
  const { activeAlarm, silenceAlarm } = useApp();
  const { isKhmer } = useLanguage();
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!activeAlarm) return;
    const interval = setInterval(() => {
      setPulseCount((prev) => prev + 1);
    }, 600);
    return () => clearInterval(interval);
  }, [activeAlarm]);

  if (!activeAlarm) return null;

  const isFlashing = pulseCount % 2 === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Outer Flashing Alert Ring */}
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 border-4 shadow-2xl ${
          isFlashing
            ? 'bg-gradient-to-b from-rose-950 via-stone-900 to-stone-950 border-rose-500 shadow-rose-500/40 ring-4 ring-rose-500/30'
            : 'bg-gradient-to-b from-amber-950 via-stone-900 to-stone-950 border-amber-500 shadow-amber-500/40 ring-4 ring-amber-500/30'
        }`}
      >
        {/* Pulsing Alarm Siren Bell */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 transition-transform duration-300 shadow-xl ${
            isFlashing
              ? 'bg-rose-500 text-white scale-110 rotate-6 shadow-rose-500/50'
              : 'bg-amber-500 text-stone-950 scale-100 -rotate-6 shadow-amber-500/50'
          }`}
        >
          <BellRing className="w-10 h-10 animate-bounce" />
        </div>

        {/* Live Alarm Title */}
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500 text-white animate-pulse">
            🚨 {isKhmer ? 'សំឡេងរោទ៍អាសន្នពី Admin' : 'EMERGENCY SOUND ALARM'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-stone-100 pt-2">
            {isKhmer ? 'ការហៅបន្ទាន់ទៅកាន់ឧបករណ៍!' : 'Urgent Call to Device!'}
          </h3>
          <p className="text-xs text-stone-400 font-medium">
            {isKhmer ? 'ឧបករណ៍នេះកំពុងបន្លឺសំឡេងរោទ៍កម្រិតខ្ពស់' : 'This device is actively ringing with a high-priority sound alarm.'}
          </p>
        </div>

        {/* Broadcast Message Box */}
        <div className="w-full my-5 p-4 rounded-2xl bg-stone-950/90 border border-stone-800 text-left space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span>{isKhmer ? 'អ្នកផ្ញើ:' : 'From:'} <strong className="text-amber-400">{activeAlarm.senderName || 'Manager Admin'}</strong></span>
            <span>{new Date(activeAlarm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-stone-100 font-bold text-sm">
            "{activeAlarm.message || 'Urgent Staff Attention Required at Register!'}"
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 font-mono">
            <span>Target: <strong className="text-stone-300">{activeAlarm.targetUserName || 'All Devices'}</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-ping" />
              <span>{activeAlarm.soundType || 'SIREN'} ACTIVE</span>
            </span>
          </div>
        </div>

        {/* Big Stop / Silence Alarm Button */}
        <button
          type="button"
          onClick={() => silenceAlarm(activeAlarm.id)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:opacity-95 text-stone-950 font-black text-base transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <VolumeX className="w-6 h-6" />
          <span>{isKhmer ? 'បញ្ឈប់សំឡេងរោទ៍ (Silence Alarm)' : 'Silence & Acknowledge Alarm'}</span>
        </button>

        <p className="text-[10px] text-stone-500 font-mono mt-3">
          {isKhmer ? 'ចុចប៊ូតុងខាងលើដើម្បីបញ្ឈប់សំឡេងរោទ៍លើឧបករណ៍នេះ' : 'Click the button above to silence the alarm buzzer on this device.'}
        </p>
      </div>
    </div>
  );
};
export default EmergencyAlarmModal;

