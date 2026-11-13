import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';
import {
  MessageSquare,
  Smartphone,
  Send,
  X,
  Phone,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Radio,
  Clock,
  Copy,
  CheckCheck,
  ShieldAlert,
  Zap,
  RotateCcw
} from 'lucide-react';

/**
 * Detect Cambodia Telecom Mobile Carrier from phone prefix
 */
const detectCarrier = (phone = '') => {
  const clean = phone.replace(/[^0-9]/g, '');
  // Smart Axiata: 010, 015, 016, 069, 070, 086, 087, 093, 096, 098 (or with 855)
  if (/^(855|0)(10|15|16|69|70|86|87|93|96|98)/.test(clean)) {
    return { name: 'Smart Axiata 5G', color: 'bg-emerald-950 text-emerald-300 border-emerald-700/80', icon: '🟢' };
  }
  // Cellcard (CamGSM): 011, 012, 014, 017, 061, 076, 077, 078, 085, 089, 092, 095, 099
  if (/^(855|0)(11|12|14|17|61|76|77|78|85|89|92|95|99)/.test(clean)) {
    return { name: 'Cellcard 4G LTE', color: 'bg-orange-950 text-orange-300 border-orange-700/80', icon: '🟠' };
  }
  // Metfone (Viettel): 088, 097, 071, 066, 067, 068, 090, 031
  if (/^(855|0)(88|97|71|66|67|68|90|31)/.test(clean)) {
    return { name: 'Metfone 4G', color: 'bg-rose-950 text-rose-300 border-rose-700/80', icon: '🔴' };
  }
  return { name: 'Cambodia Mobile', color: 'bg-stone-900 text-stone-300 border-stone-700', icon: '📱' };
};

export const SendSmsModal = ({ isOpen, onClose, targetStaff = null, targetSession = null }) => {
  const { isKhmer } = useLanguage();
  const { showToast, triggerDeviceAlarm, staffList = [] } = useApp();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('NATIVE_SMS'); // 'NATIVE_SMS' | 'IN_APP_PUSH' | 'CLOUD_GATEWAY'

  // Pre-fill recipient information on open
  useEffect(() => {
    if (!isOpen) {
      setSentSuccess(false);
      return;
    }

    let phone = '';
    let name = '';

    if (targetStaff) {
      phone = targetStaff.phone || '';
      name = targetStaff.name || 'Staff Member';
    } else if (targetSession) {
      name = targetSession.userName || 'Staff Member';
      // Look up phone from staffList matching session userId or userName
      const matched = staffList.find(
        (s) => s.userId === targetSession.userId || s.name === targetSession.userName
      );
      phone = matched?.phone || targetSession.phone || '+855 12 345 671';
    } else {
      phone = '+855 12 888 999';
      name = 'Staff Member';
    }

    setPhoneNumber(phone);
    setRecipientName(name);
    setSmsMessage(
      isKhmer
        ? `[AromaPOS]: សូមជម្រាបជូន ${name} សូមប្រញាប់មកជួបអ្នកគ្រប់គ្រងនៅស្ថានីយគិតលុយ។`
        : `[AromaPOS Alert]: Hi ${name}, please report to register station immediately.`
    );
  }, [isOpen, targetStaff, targetSession, staffList, isKhmer]);

  if (!isOpen) return null;

  const carrier = detectCarrier(phoneNumber);
  const charCount = smsMessage.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  // Preset templates
  const templates = [
    {
      id: 't1',
      title: isKhmer ? '🚨 ហៅមកបញ្ជរ' : '🚨 Report to Register',
      text: isKhmer
        ? `[AromaPOS]: ការហៅបន្ទាន់! សូម ${recipientName} ប្រញាប់មកកាន់ស្ថានីយគិតលុយជាបន្ទាន់។`
        : `[AromaPOS]: Urgent call! ${recipientName}, please report to the register station immediately.`
    },
    {
      id: 't2',
      title: isKhmer ? '⏰ រំលឹកផ្ទេរវេន' : '⏰ Shift Handover',
      text: isKhmer
        ? `[AromaPOS]: រំលឹកវេនការងារ! ដល់ម៉ោងផ្ទេរវេនស្ថានីយ (Shift Handover) ហើយ សូមរាប់ប្រាក់ក្នុងថត។`
        : `[AromaPOS]: Shift reminder! It is time for shift handover and register drawer count.`
    },
    {
      id: 't3',
      title: isKhmer ? '📋 កិច្ចប្រជុំបន្ទាន់' : '📋 Briefing Call',
      text: isKhmer
        ? `[AromaPOS]: អ្នកគ្រប់គ្រងត្រូវការជួបពិភាក្សាការងារបន្ទាន់ សូមទាក់ទងមកបន្ទប់ Office។`
        : `[AromaPOS]: Manager requests a brief operational check-in. Please contact the office.`
    }
  ];

  const handleSelectTemplate = (t) => {
    setSmsMessage(t.text);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !smsMessage.trim()) return;

    setIsSending(true);

    try {
      // 1. Native SMS Dispatch via sms: protocol
      if (deliveryMethod === 'NATIVE_SMS') {
        const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
        const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(smsMessage.trim())}`;
        window.open(smsUri, '_self');
      }

      // 2. Direct In-App Push Dispatch to Target Device
      if (deliveryMethod === 'IN_APP_PUSH' || deliveryMethod === 'CLOUD_GATEWAY') {
        if (targetSession && triggerDeviceAlarm) {
          triggerDeviceAlarm({
            targetSessionId: targetSession.id,
            targetUserName: recipientName,
            message: smsMessage.trim(),
            soundType: 'CHIME'
          });
        }
      }

      // Play pleasant confirmation chime
      soundService.playPaymentSuccessSound();
      setSentSuccess(true);
      showToast(
        isKhmer
          ? `បានបញ្ជូនសារ SMS ទៅកាន់ ${recipientName} (${phoneNumber})!`
          : `SMS dispatched successfully to ${recipientName} (${phoneNumber})!`,
        'success'
      );

      setTimeout(() => {
        setIsSending(false);
        onClose();
      }, 1500);
    } catch (err) {
      setIsSending(false);
      showToast('Error dispatching SMS', 'error');
    }
  };

  const handleCopySmsText = () => {
    navigator.clipboard?.writeText(smsMessage);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-800 bg-stone-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <span>{isKhmer ? 'ផ្ញើសារ SMS ទៅកាន់ឧបករណ៍' : 'Send SMS Message to Device'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  GSM / 4G
                </span>
              </h3>
              <p className="text-xs text-stone-400 truncate">
                {recipientName} • <span className="font-mono text-cyan-300">{phoneNumber}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Recipient Phone & Telecom Carrier */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-300 flex items-center justify-between text-xs">
              <span>{isKhmer ? 'លេខទូរស័ព្ទអ្នកទទួល (Phone Number):' : 'Recipient Phone Number:'}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${carrier.color}`}>
                <span>{carrier.icon}</span>
                <span>{carrier.name}</span>
              </span>
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+855 12 345 678"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-stone-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Quick Template Chips */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-400 text-[11px] uppercase tracking-wider block">
              {isKhmer ? 'គំរូសាររហ័ស (Quick Templates):' : 'Quick SMS Templates:'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className="px-2.5 py-1 rounded-xl bg-stone-800/80 hover:bg-stone-750 border border-stone-700/80 text-stone-200 text-[11px] font-bold transition cursor-pointer"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* SMS Message Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-bold text-stone-300">
              <label>{isKhmer ? 'អត្ថបទសារ (SMS Content):' : 'SMS Message Body:'}</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySmsText}
                  className="text-stone-400 hover:text-stone-200 inline-flex items-center gap-1 font-mono text-[10px]"
                >
                  {copiedLink ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? (isKhmer ? 'បានចម្លង' : 'Copied') : (isKhmer ? 'ចម្លង' : 'Copy')}</span>
                </button>
                <span className="text-[10px] font-mono text-stone-500">
                  {charCount} / 160 chars ({smsSegments} SMS)
                </span>
              </div>
            </div>
            <textarea
              rows={4}
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder={isKhmer ? 'វាយសារ SMS នៅទីនេះ...' : 'Type SMS message here...'}
              className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 text-stone-100 text-xs focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
              required
            />
          </div>

          {/* Delivery Method Selection */}
          <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-850 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              {isKhmer ? 'ជម្រើសបញ្ជូន (Dispatch Mode):' : 'Dispatch Gateway Mode:'}
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeliveryMethod('NATIVE_SMS')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                  deliveryMethod === 'NATIVE_SMS'
                    ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="truncate">
                  <span className="font-extrabold block truncate text-[11px]">
                    {isKhmer ? 'កម្មវិធី SMS ទូរស័ព្ទ' : 'Native SMS App'}
                  </span>
                  <span className="text-[9px] text-stone-500 block truncate">1-Click Native App</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('IN_APP_PUSH')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                  deliveryMethod === 'IN_APP_PUSH'
                    ? 'bg-amber-950/70 border-amber-500/80 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <span className="font-extrabold block truncate text-[11px]">
                    {isKhmer ? 'ផ្ញើទៅអេក្រង់ផ្ទាល់' : 'In-App Direct Push'}
                  </span>
                  <span className="text-[9px] text-stone-500 block truncate">Instant Live Alert</span>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSending || !phoneNumber.trim() || !smsMessage.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-950"
            >
              {sentSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{isKhmer ? 'បានបញ្ជូនជោគជ័យ!' : 'Sent Successfully!'}</span>
                </>
              ) : isSending ? (
                <span>{isKhmer ? 'កំពុងបញ្ជូន...' : 'Dispatching...'}</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isKhmer ? 'បញ្ជូនសារ SMS ឥឡូវនេះ' : 'Send SMS Now'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SendSmsModal;
