import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { getBrandBadge } from '../../utils/deviceDetector';
import {
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  X,
  ExternalLink,
  Wifi,
  Battery,
  Lock,
  LogOut,
  RefreshCw,
  Send,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Copy,
  CheckCheck,
  MessageSquare,
  AlertTriangle,
  BellRing,
  Volume2,
  Radio
} from 'lucide-react';

export const RemoteDeviceModal = ({ session, isOpen, onClose, onTerminate }) => {
  const { isKhmer } = useLanguage();
  const { triggerDeviceAlarm } = useApp();
  const [activeScreenTab, setActiveScreenTab] = useState('pos'); // 'pos' | 'cart' | 'status'
  const [remoteMessage, setRemoteMessage] = useState('');
  const [sentMessageToast, setSentMessageToast] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopiedIp, setIsCopiedIp] = useState(false);
  const [simulatedPing, setSimulatedPing] = useState(18);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);

  const handleSendAlarm = (soundType = 'SIREN') => {
    if (!session) return;
    if (triggerDeviceAlarm) {
      triggerDeviceAlarm({
        targetSessionId: session.id,
        targetUserName: session.userName,
        message: remoteMessage.trim() || `Urgent Attention Required on ${session.deviceModel || 'Terminal'}!`,
        soundType
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !session) return;
    setIsDeviceLocked(false);
    setActiveScreenTab(session.userRole === 'BARISTA' ? 'kds' : 'pos');
    
    // Randomize low network ping to show real-time telemetry
    const interval = setInterval(() => {
      setSimulatedPing(Math.floor(14 + Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const brandInfo = getBrandBadge(session.brand || session.deviceModel);
  const isPhone = session.deviceType === 'Phone' || session.deviceType === 'Mobile';
  const isTablet = session.deviceType === 'Tablet';
  const isPosStation = session.deviceType === 'POS Touch Station' || session.deviceType === 'POS Station';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCopyIp = () => {
    if (session.ipAddress) {
      navigator.clipboard?.writeText(session.ipAddress);
      setIsCopiedIp(true);
      setTimeout(() => setIsCopiedIp(false), 2000);
    }
  };

  const handleSendRemoteMessage = (e) => {
    e.preventDefault();
    if (!remoteMessage.trim()) return;
    setSentMessageToast(remoteMessage.trim());
    setRemoteMessage('');
    setTimeout(() => setSentMessageToast(null), 3500);
  };

  const handleOpenStandaloneWindow = () => {
    const width = isPhone ? 412 : isTablet ? 1024 : 1200;
    const height = isPhone ? 890 : isTablet ? 768 : 820;
    const url = `${window.location.origin}/?session_preview=${session.id}`;
    window.open(
      url,
      `AromaDevice_${session.id}`,
      `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[96vh] rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isPhone
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400'
                : isTablet
                ? 'bg-sky-950/80 border-sky-700/60 text-sky-400'
                : isPosStation
                ? 'bg-purple-950/80 border-purple-700/60 text-purple-400'
                : 'bg-stone-900 border-stone-800 text-amber-400'
            }`}>
              {isPhone ? <Smartphone className="w-5 h-5" /> : isTablet ? <Tablet className="w-5 h-5" /> : isPosStation ? <Terminal className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border flex items-center gap-1 ${brandInfo.color}`}>
                  <span>{brandInfo.icon}</span>
                  <span>{brandInfo.name}</span>
                </span>
                <span className="font-extrabold text-sm text-stone-100 truncate">
                  {session.deviceModel || session.os || 'Universal Station'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isKhmer ? 'កំពុងតភ្ជាប់ផ្ទាល់' : 'Live Mirror'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">
                {session.userName} ({session.userRole}) • {session.location || 'Phnom Penh, Cambodia 🇰🇭'} • <span className="font-mono text-cyan-300">{session.ipAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Pop-out dedicated window */}
            <button
              type="button"
              onClick={handleOpenStandaloneWindow}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title={isKhmer ? 'បើកអេក្រង់ឧបករណ៍នេះក្នុងផ្ទាំងថ្មី' : 'Open in dedicated standalone window'}
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isKhmer ? 'បើកផ្ទាំងថ្មី' : 'Pop-out'}</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns: Device Screen Mirror on Left, Remote Controls on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-stone-925">
          {/* Left Column: Authentic Device Frame & Live Screen (Col 7/12 on large) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            {/* Authentic Device Frame */}
            <div className={`relative transition-all duration-300 ${
              isPhone
                ? 'w-full max-w-[340px] aspect-[9/19.5] rounded-[48px] p-3 bg-gradient-to-b from-stone-800 via-stone-900 to-stone-950 border-4 border-stone-700/80 shadow-2xl ring-1 ring-white/10'
                : isTablet
                ? 'w-full max-w-[560px] aspect-[4/3] rounded-[36px] p-3.5 bg-gradient-to-b from-stone-800 to-stone-950 border-4 border-stone-700 shadow-2xl ring-1 ring-white/10'
                : 'w-full max-w-[580px] aspect-[16/10] rounded-[24px] p-3 bg-stone-950 border-4 border-stone-800 shadow-2xl ring-1 ring-white/10'
            }`}>
              {/* Phone Top Notch / Dynamic Island */}
              {isPhone && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30">
                  <div className="w-24 h-5 rounded-full bg-black border border-stone-800/80 flex items-center justify-between px-2.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Camera / Active Link" />
                    <span className="text-[9px] font-bold text-amber-400 font-mono">Aroma</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800" />
                  </div>
                </div>
              )}

              {/* Status Bar */}
              <div className="absolute top-2 left-6 right-6 z-20 flex items-center justify-between text-[10px] font-semibold text-stone-300 font-mono px-1">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-emerald-400 font-bold">{session.ipLabel?.includes('5G') ? '5G' : 'Wi-Fi'}</span>
                  <Wifi className="w-3 h-3 text-stone-300" />
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              {/* Screen Display Glass Container */}
              <div className={`w-full h-full rounded-[38px] overflow-hidden bg-stone-950 border border-stone-850 flex flex-col relative ${
                isRefreshing ? 'opacity-70 transition-opacity' : 'opacity-100'
              }`}>
                {/* On-screen Remote Toast Message Banner */}
                {sentMessageToast && (
                  <div className="absolute top-12 left-3 right-3 z-40 p-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-4 duration-200">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase block opacity-80">{isKhmer ? 'សារពី Admin' : 'Admin Broadcast'}:</span>
                      <span className="font-extrabold truncate">{sentMessageToast}</span>
                    </div>
                  </div>
                )}

                {/* Device Screen Locked Overlay */}
                {isDeviceLocked ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-stone-950/95 z-30">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3 animate-pulse">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h5 className="font-black text-sm text-stone-100">
                      {isKhmer ? 'អេក្រង់ត្រូវបានចាក់សោពីចម្ងាយ' : 'Screen Remotely Locked by Manager'}
                    </h5>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-[220px]">
                      {isKhmer ? 'ស្ថានីយនេះត្រូវបានផ្អាកជាបណ្ដោះអាសន្នដើម្បីសុវត្ថិភាព' : 'This terminal is temporarily paused for security inspection.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsDeviceLocked(false)}
                      className="mt-4 px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs cursor-pointer"
                    >
                      {isKhmer ? 'ដោះសោវិញ' : 'Unlock Device'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Remote Screen Mini-Header */}
                    <div className="pt-8 px-4 pb-2.5 bg-stone-900 border-b border-stone-850 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                          <Coffee className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-extrabold text-[11px] text-stone-100 block truncate">
                            AromaPOS Mobile
                          </span>
                          <span className="text-[9px] text-stone-400 block truncate">
                            {session.userName} • {session.userRole}
                          </span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-stone-800 text-emerald-400 border border-emerald-500/30">
                        ● LIVE
                      </span>
                    </div>

                    {/* Remote Screen Interactive Content */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-stone-200">
                      {/* Active Order / Cart Snapshot */}
                      <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            {isKhmer ? 'វិក្កយបត្រកំពុងដំណើរការ' : 'Active Register Ticket'}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">#ORD-9024</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-300 font-medium">1x Caramel Brulee Macchiato</span>
                            <span className="font-mono font-bold text-stone-200">$5.25</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-300 font-medium">1x Cardamom Cinnamon Swirl</span>
                            <span className="font-mono font-bold text-stone-200">$3.80</span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-stone-800 flex items-center justify-between font-bold">
                            <span className="text-stone-400">{isKhmer ? 'សរុប (Total)' : 'Total'}</span>
                            <span className="text-amber-400 font-mono text-sm font-black">$9.05</span>
                          </div>
                        </div>
                      </div>

                      {/* Station Security Telemetry */}
                      <div className="p-3 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">{isKhmer ? 'វិធីសាស្ត្រ Login:' : 'Auth Method:'}</span>
                          <span className="font-mono font-bold text-stone-200">{session.loginMethod}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">{isKhmer ? 'ម៉ោងចូលប្រើ:' : 'Logged in:'}</span>
                          <span className="font-mono text-stone-300">{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">{isKhmer ? 'កម្រិតសុវត្ថិភាព:' : 'Encryption:'}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> TLS 1.3 / AES
                          </span>
                        </div>
                      </div>

                      {/* Quick POS Catalog preview in phone */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-stone-900 border border-stone-850 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 text-[10px]">
                            ☕
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-bold text-stone-200 block truncate">Americano</span>
                            <span className="text-[9px] font-mono text-amber-400 font-bold">$3.25</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-stone-900 border border-stone-850 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 text-[10px]">
                            🍵
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] font-bold text-stone-200 block truncate">Matcha Latte</span>
                            <span className="text-[9px] font-mono text-emerald-400 font-bold">$4.75</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Remote Screen Bottom Navigation */}
                    <div className="p-2.5 bg-stone-900/90 border-t border-stone-850 flex items-center justify-around shrink-0 text-stone-400 text-[10px] font-bold">
                      <span className="text-amber-400 flex flex-col items-center gap-0.5">
                        <Coffee className="w-3.5 h-3.5" />
                        <span>POS</span>
                      </span>
                      <span className="hover:text-stone-200 flex flex-col items-center gap-0.5 cursor-pointer">
                        <Terminal className="w-3.5 h-3.5" />
                        <span>KDS</span>
                      </span>
                      <span className="hover:text-stone-200 flex flex-col items-center gap-0.5 cursor-pointer">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Shift</span>
                      </span>
                    </div>
                  </>
                )}

                {/* Phone Bottom Home Bar */}
                {isPhone && (
                  <div className="py-1 flex justify-center bg-stone-950 shrink-0">
                    <div className="w-24 h-1 rounded-full bg-stone-700" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Remote Control Deck & Live Telemetry (Col 5/12 on large) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Telemetry Card */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isKhmer ? 'ទិន្នន័យតភ្ជាប់ផ្ទាល់' : 'Live Connection Telemetry'}</span>
                  </h5>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-850">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">{isKhmer ? 'ល្បឿនតភ្ជាប់' : 'Latency Ping'}</span>
                    <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
                      {simulatedPing} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-850">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">{isKhmer ? 'ទំហំអេក្រង់' : 'Resolution'}</span>
                    <span className="font-mono font-bold text-amber-300 text-xs mt-0.5 block truncate">
                      {session.screen || '393x852'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-850 col-span-2">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">{isKhmer ? 'អាសយដ្ឋាន IP & បណ្តាញ' : 'Client IP & Carrier'}</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-cyan-300 text-xs truncate">
                        {session.ipAddress} ({session.ipLabel})
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyIp}
                        className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
                        title="Copy IP"
                      >
                        {isCopiedIp ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-850 col-span-2">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">{isKhmer ? 'ទីតាំងភូមិសាស្ត្រ & ISP' : 'Location & ISP'}</span>
                    <p className="text-xs text-stone-300 font-medium mt-0.5">
                      {session.location || 'Phnom Penh, Cambodia 🇰🇭'}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {session.isp || 'Smart Axiata / Cellcard Network'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Send Broadcast Message to this Device */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800">
                <h5 className="font-extrabold text-xs text-stone-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isKhmer ? 'ផ្ញើសារបន្ទាន់ទៅកាន់ឧបករណ៍នេះ' : 'Send Alert / Message to Device'}</span>
                </h5>
                <form onSubmit={handleSendRemoteMessage} className="space-y-2">
                  <input
                    type="text"
                    value={remoteMessage}
                    onChange={(e) => setRemoteMessage(e.target.value)}
                    placeholder={isKhmer ? 'វាយសារផ្ញើទៅអេក្រង់បុគ្គលិក...' : 'Type alert to show on staff screen...'}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!remoteMessage.trim()}
                    className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ផ្ញើសារទៅអេក្រង់ទូរស័ព្ទ' : 'Broadcast to Device'}</span>
                  </button>
                </form>
              </div>

              {/* Instant Sound Alarm Trigger */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-rose-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                    <span>{isKhmer ? 'បន្លឺសំឡេងរោទ៍ Alarm ទៅកាន់ឧបករណ៍' : 'Trigger Sound Alarm on Device'}</span>
                  </h5>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    ⚡ Live Audio
                  </span>
                </div>

                <p className="text-[11px] text-stone-400">
                  {isKhmer
                    ? 'ចុចបន្លឺសំឡេងរោទ៍ Alarm លើទូរស័ព្ទ ឬកុំព្យូទ័ររបស់បុគ្គលិកនេះភ្លាមៗគ្រប់ពេលដែលអ្នកចង់'
                    : 'Triggers an instant audible siren buzzer and alert vibration on this device immediately.'}
                </p>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendAlarm('SIREN')}
                    className="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] flex flex-col items-center gap-1 transition cursor-pointer shadow-md shadow-rose-950"
                    title={isKhmer ? 'បន្លឺសំឡេងស៊ីរ៉ែន' : 'Play Siren Alarm'}
                  >
                    <BellRing className="w-4 h-4" />
                    <span>🚨 {isKhmer ? 'ស៊ីរ៉ែន' : 'Siren'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendAlarm('BUZZER')}
                    className="py-2.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-[11px] flex flex-col items-center gap-1 transition cursor-pointer shadow-md shadow-amber-950"
                    title={isKhmer ? 'បន្លឺសំឡេង Buzzer' : 'Play Loud Buzzer'}
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>📢 {isKhmer ? 'Buzzer' : 'Buzzer'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendAlarm('CHIME')}
                    className="py-2.5 px-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[11px] flex flex-col items-center gap-1 transition cursor-pointer shadow-md shadow-cyan-950"
                    title={isKhmer ? 'បន្លឺសំឡេងកណ្តឹងបន្ទាន់' : 'Play Urgent Chime'}
                  >
                    <Radio className="w-4 h-4" />
                    <span>🔔 {isKhmer ? 'កណ្តឹង' : 'Chime'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Administrative Remote Actions */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
              <span className="text-[10px] text-stone-500 uppercase font-extrabold tracking-wider block mb-2">
                {isKhmer ? 'សកម្មភាពរដ្ឋបាលពីចម្ងាយ' : 'Remote Admin Actions'}
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Lock Device Screen Button */}
                <button
                  type="button"
                  onClick={() => setIsDeviceLocked(!isDeviceLocked)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDeviceLocked
                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                      : 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isDeviceLocked ? (isKhmer ? 'ដោះសោ' : 'Unlock') : (isKhmer ? 'ចាក់សោអេក្រង់' : 'Lock Screen')}</span>
                </button>

                {/* Terminate Session Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onTerminate) onTerminate(session.id, session.userName);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'ផ្តាច់ Session' : 'Terminate'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

