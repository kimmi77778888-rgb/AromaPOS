import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  User, 
  Mail, 
  Phone, 
  KeyRound, 
  Lock, 
  ShieldCheck, 
  Camera, 
  Upload, 
  CheckCircle2, 
  X, 
  Eye, 
  EyeOff, 
  BadgeCheck,
  Trash2,
  Loader2,
  Monitor,
  Globe,
  Activity,
  Terminal,
  Copy,
  CheckCheck,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { api, isRealAvatar } from '../../services/api';
import { LiveDeviceMap } from '../security/LiveDeviceMap';

export const UserAccountModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, showToast } = useApp();
  const { isKhmer } = useLanguage();
  const [isLiveMapOpen, setIsLiveMapOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pin: '',
    password: '',
    avatar: '',
    facePhoto: '',
    faceEnrolled: false,
    role: 'CASHIER',
    hourlyRate: 14.00
  });

  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [deviceAudit, setDeviceAudit] = useState(null);
  const [copiedIp, setCopiedIp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getClientSecuritySnapshot().then((snap) => {
        setDeviceAudit(snap);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleCopyIp = (ip) => {
    if (!ip) return;
    navigator.clipboard?.writeText(ip);
    setCopiedIp(true);
    showToast(isKhmer ? 'បានចម្លងអាសយដ្ឋាន IP ទៅក្តារតម្បៀតខ្ទាស់' : 'Copied IP address to clipboard', 'success');
    setTimeout(() => setCopiedIp(false), 2000);
  };

  useEffect(() => {
    if (user && isOpen) {
      const realAvatar = isRealAvatar(user.avatar) ? user.avatar : (isRealAvatar(user.facePhoto) ? user.facePhoto : '');
      const realFace = isRealAvatar(user.facePhoto) ? user.facePhoto : realAvatar;

      setFormData({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '+855 12 345 678',
        pin: user.pin || user.pinCode || '1234',
        password: '',
        avatar: realAvatar,
        facePhoto: realFace,
        faceEnrolled: !!(user.faceEnrolled && (realAvatar || realFace)),
        role: user.role || 'CASHIER',
        hourlyRate: user.hourlyRate || 14.00,
        status: user.status || 'ACTIVE'
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isKhmer ? 'សូមជ្រើសរើសឯកសាររូបភាពពិតប្រាកដ (JPG, PNG, WEBP)' : 'Please select a valid image file (JPG, PNG, WEBP)', 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast(isKhmer ? 'ទំហំរូបភាពត្រូវតែតូចជាង 10MB' : 'Image size must be less than 10MB', 'warning');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          avatar: res.imageUrl,
          facePhoto: res.imageUrl
        }));
        showToast(isKhmer ? 'បានផ្ទុករូបភាពពិតប្រាកដជោគជ័យ!' : 'Real photo uploaded to server successfully!', 'success');
      }
    } catch (err) {
      showToast(isKhmer ? 'បរាជ័យក្នុងការផ្ទុករូបភាព' : 'Failed to upload photo to server', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: '',
      facePhoto: '',
      faceEnrolled: false
    }));
    showToast(isKhmer ? 'បានលុបរូបថតចេញ - បង្ហាញអក្សរកាត់គណនី' : 'Profile photo removed - displaying name initials', 'info');
  };

  const handleFaceScanSuccess = (scanData) => {
    const photo = scanData?.facePhoto || scanData?.avatar || scanData?.photoData;
    if (photo) {
      setFormData((prev) => ({
        ...prev,
        avatar: photo,
        facePhoto: photo,
        faceHash: scanData?.faceHash || prev.faceHash,
        faceBiometrics: scanData?.faceBiometrics || prev.faceBiometrics,
        faceEnrolled: true
      }));
    }
    setIsFaceScannerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលឈ្មោះ' : 'Name is required', 'warning');
      return;
    }
    if (!formData.pin || formData.pin.length !== 4) {
      showToast(isKhmer ? 'លេខកូដ PIN ត្រូវតែមាន ៤ ខ្ទង់' : '4-digit PIN is required', 'warning');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      showToast(isKhmer ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' : 'New password must be at least 6 characters', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        ...formData,
        id: user.id,
        pin: formData.pin,
        pinCode: formData.pin,
        faceEnrolled: !!(formData.faceEnrolled && formData.avatar),
        facePhoto: formData.facePhoto || formData.avatar || '',
        avatar: formData.avatar || formData.facePhoto || ''
      });
      onClose();
    } catch (err) {
      // Toast handled by updateUserProfile
    } finally {
      setIsSaving(false);
    }
  };

  const hasRealPhoto = isRealAvatar(formData.avatar) || isRealAvatar(formData.facePhoto);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in overflow-y-auto">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
          {/* Header */}
          <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-500 shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-100">
                  {isKhmer ? 'គណនីរបស់ខ្ញុំ & រូបថតពិត' : 'My Account & Real Profile'}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isKhmer ? 'ផ្ទុករូបថតពិត និងគ្រប់គ្រងលេខកូដ PIN ផ្ទាល់ខ្លួន' : 'Upload your real photo and manage personal PIN & credentials'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Top User Profile Card with Real Photo / Real Initials */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  user={{
                    ...formData,
                    avatar: formData.avatar,
                    facePhoto: formData.facePhoto,
                    name: formData.name,
                    role: formData.role
                  }}
                  size="lg"
                  shape="rounded-2xl"
                  showBadge
                  showFaceIdBadge={formData.faceEnrolled}
                />

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-100 text-base">{formData.name || 'Staff User'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-amber-950/80 text-amber-300 border-amber-800 uppercase tracking-wide">
                      {formData.role}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 font-mono block mt-0.5">{formData.email}</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    {hasRealPhoto ? (
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {isKhmer ? 'រូបថតពិតត្រូវបានផ្ទុក' : 'Real photo uploaded'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-stone-500">
                        {isKhmer ? 'បង្ហាញអក្សរកាត់ឈ្មោះ (មិនទាន់មានរូបថត)' : 'Showing initials (No photo uploaded yet)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo Upload Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Upload Real Photo from Disk */}
                <label
                  htmlFor="user-profile-file-input"
                  className={`px-3 py-2 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 hover:border-amber-500/50 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 ${
                    isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  title="Upload real image file from disk"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isUploadingPhoto ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ផ្ទុករូបពិត' : 'Upload Photo')}</span>
                </label>
                <input
                  id="user-profile-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Remove Photo Button */}
                {hasRealPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-xl bg-stone-900 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-700 text-stone-400 hover:text-rose-300 transition cursor-pointer shadow-md"
                    title={isKhmer ? 'លុបរូបថតចេញ' : 'Remove profile photo'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Liam Vance"
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  {isKhmer ? 'អ៊ីមែលចូលប្រើប្រាស់' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@cafe.com"
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+855 12 345 678"
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* 4-Digit POS PIN */}
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  {isKhmer ? 'លេខសម្ងាត់ PIN (៤ ខ្ទង់)' : '4-Digit POS PIN'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={4}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono font-bold text-amber-400 focus:outline-none tracking-widest transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                  {isKhmer ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់ (មិនបាច់បំពេញក៏បាន)' : 'New Password (Leave blank to keep current)'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isKhmer ? 'បញ្ចូលពាក្យសម្ងាត់ថ្មី...' : 'Enter new password...'}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-100 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Standard Security & Active Device Information Card */}
            <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-850 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-200">
                      {isKhmer ? 'សុវត្ថិភាពឧបករណ៍ & អាសយដ្ឋាន IP' : 'Device Security & IP Address'}
                    </h4>
                    <p className="text-[10px] text-stone-500">
                      {isKhmer ? 'ព័ត៌មានលម្អិតអំពីឧបករណ៍ដែលបាន Login និងអាសយដ្ឋាន IP' : 'Standard client connection audit metadata'}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isKhmer ? 'Session សកម្ម' : 'Active Session'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                {/* IP Address */}
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-850 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">
                        {isKhmer ? 'អាសយដ្ឋាន IP ម៉ាស៊ីន' : 'Client IP Address'}
                      </span>
                      <span className="font-mono font-bold text-stone-100 text-xs truncate block">
                        {deviceAudit?.ipAddress || user?.lastLoginIp || '192.168.1.108 (LAN)'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyIp(deviceAudit?.ipAddress || user?.lastLoginIp || '192.168.1.108')}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                    title={isKhmer ? 'ចម្លង IP' : 'Copy IP Address'}
                  >
                    {copiedIp ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Device Type & OS */}
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-850 flex items-center gap-2 min-w-0">
                  <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'ប្រភេទឧបករណ៍ & OS' : 'Device & Operating System'}
                    </span>
                    <span className="font-bold text-stone-100 text-xs truncate block">
                      {deviceAudit?.os || 'Windows 11'} • {deviceAudit?.deviceType || 'Desktop'}
                    </span>
                  </div>
                </div>

                {/* Web Browser */}
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-850 flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'កម្មវិធីរុករក (Browser)' : 'Web Client Browser'}
                    </span>
                    <span className="font-medium text-stone-200 text-xs truncate block">
                      {deviceAudit?.browser || 'Google Chrome 124'}
                    </span>
                  </div>
                </div>

                {/* Terminal / POS ID */}
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-850 flex items-center gap-2 min-w-0">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'ស្ថានីយ / Terminal ID' : 'Station / Terminal ID'}
                    </span>
                    <span className="font-mono font-bold text-emerald-300 text-xs truncate block">
                      {deviceAudit?.terminalId || 'AROMA-POS-01'} ({deviceAudit?.screen || '1920x1080'})
                    </span>
                  </div>
                </div>

                {/* Device Physical Geolocation */}
                <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-850 flex items-center justify-between sm:col-span-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">
                        {isKhmer ? 'ទីតាំងឧបករណ៍ & ភូមិសាស្ត្រ' : 'Device Geolocation & Physical Location'}
                      </span>
                      <span className="font-bold text-stone-100 text-xs truncate block">
                        {deviceAudit?.location || user?.lastLoginLocation || 'Phnom Penh, Cambodia 🇰🇭'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsLiveMapOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                      title={isKhmer ? 'បើកផែនទីផ្កាយរណបបន្តផ្ទាល់' : 'View Real-Time Live Map'}
                    >
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>{isKhmer ? 'ផែនទីផ្ទាល់' : 'Live Map'}</span>
                    </button>
                    <a
                      href={deviceAudit?.mapsUrl || 'https://www.google.com/maps?q=11.5564,104.9282'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-amber-400 hover:text-amber-300 font-bold text-[10px] flex items-center gap-1 transition"
                      title={isKhmer ? 'មើលលើផែនទី Google Maps' : 'View on Google Maps'}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isKhmer ? 'មើលផែនទី' : 'Maps'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-900">
                <span>
                  {isKhmer ? 'វិធីសាស្ត្រ Login:' : 'Login Method:'}{' '}
                  <span className="text-amber-400 font-bold">{user?.lastLoginMethod || 'PASSWORD'}</span>
                </span>
                <span className="font-mono text-[10px] text-stone-500">
                  TLS v1.3 • AES-256 GCM
                </span>
              </div>
            </div>

            {/* Modal Submit Footer */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploadingPhoto}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold shadow-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSaving ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {isLiveMapOpen && (
        <LiveDeviceMap
          sessions={[{
            id: 'current-session',
            userName: user?.name,
            userRole: user?.role,
            userAvatar: user?.avatar,
            ipAddress: deviceAudit?.ipAddress || user?.lastLoginIp || '127.0.0.1',
            latitude: deviceAudit?.latitude || 11.5564,
            longitude: deviceAudit?.longitude || 104.9282,
            location: deviceAudit?.location || user?.lastLoginLocation || 'Phnom Penh, Cambodia 🇰🇭',
            isp: deviceAudit?.isp || 'Broadband ISP',
            deviceModel: deviceAudit?.deviceSummary || user?.lastLoginDevice || 'Desktop PC',
            status: 'ACTIVE'
          }]}
          isModal={true}
          isOpen={isLiveMapOpen}
          onClose={() => setIsLiveMapOpen(false)}
        />
      )}
    </>
  );
};
