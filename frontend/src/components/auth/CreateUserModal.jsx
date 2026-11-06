import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { 
  UserPlus, 
  X, 
  ShieldCheck, 
  KeyRound, 
  DollarSign, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Lock, 
  Camera, 
  Check, 
  Eye, 
  EyeOff, 
  Upload,
  Trash2,
  Loader2,
  ScanFace
} from 'lucide-react';
import { ROLE_PERMISSIONS, SYSTEM_PERMISSIONS } from '../../services/coffeeData';
import { UserAvatar } from '../common/UserAvatar';

export const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { showToast, loadStaffAndAudits } = useApp();
  const { isKhmer } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CASHIER',
    pin: Math.floor(1000 + Math.random() * 9000).toString(),
    hourlyRate: 14.00,
    phone: '+855 ',
    password: 'password123',
    status: 'ACTIVE',
    avatar: '',
    permissions: ROLE_PERMISSIONS.CASHIER?.permissions || ['canAccessPos']
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  if (!isOpen) return null;

  const handleRoleChange = (newRole) => {
    const standardPerms = ROLE_PERMISSIONS[newRole]?.permissions || ['canAccessPos'];
    const defaultWage = newRole === 'ADMIN' ? 28.00 : newRole === 'MANAGER' ? 22.00 : newRole === 'CASHIER' ? 14.00 : 12.00;

    setFormData((prev) => ({
      ...prev,
      role: newRole,
      hourlyRate: defaultWage,
      permissions: [...standardPerms]
    }));
  };

  const togglePermission = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      const updated = exists
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(isKhmer ? 'សូមជ្រើសរើសឯកសាររូបភាព (JPG, PNG, WEBP)' : 'Please select an image file (JPG, PNG, WEBP)', 'warning');
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
          avatar: res.imageUrl
        }));
        showToast(isKhmer ? 'បានផ្ទុករូបភាពប្រវត្តិរូបជោគជ័យ!' : 'Profile photo uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast(isKhmer ? 'បរាជ័យក្នុងការផ្ទុករូបភាព' : 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: ''
    }));
    showToast(isKhmer ? 'បានលុបរូបភាពចេញ' : 'Photo removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញរបស់បុគ្គលិក' : 'Staff Full Name is required', 'warning');
      return;
    }
    if (!formData.pin || formData.pin.length !== 4) {
      showToast(isKhmer ? 'សូមបញ្ចូលលេខកូដ PIN ៤ខ្ទង់សម្រាប់ចូល POS' : 'A 4-digit numeric PIN is required for POS sign-in', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@cafe.com`,
        role: formData.role,
        pinCode: formData.pin,
        pin: formData.pin,
        hourlyRate: parseFloat(formData.hourlyRate) || 14.00,
        phone: formData.phone,
        password: formData.password || 'password123',
        status: formData.status || 'ACTIVE',
        faceEnrolled: false,
        facePhoto: null,
        faceBiometrics: null,
        faceHash: null,
        avatar: formData.avatar || null,
        permissions: formData.permissions
      };

      const created = await api.createStaff(payload);
      showToast(
        isKhmer 
          ? `បានបង្កើតគណនី ${created.name} (${created.role}) ដោយជោគជ័យ!` 
          : `User ${created.name} (${created.role}) created successfully!`, 
        'success'
      );
      
      if (loadStaffAndAudits) {
        await loadStaffAndAudits();
      }
      if (onUserCreated) {
        onUserCreated(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.message || (isKhmer ? 'បរាជ័យក្នុងការបង្កើតគណនី' : 'Failed to create user'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                <span>{isKhmer ? 'បង្កើតគណនីបុគ្គលិកថ្មី' : 'Create New User & Staff Member'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  POS Staff
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                {isKhmer 
                  ? 'កំណត់សិទ្ធិ តួនាទី និងលេខកូដ PIN សម្ងាត់សម្រាប់បុគ្គលិក' 
                  : 'Grant role-based credentials, 4-digit PIN, and account access'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ព័ត៌មានគណនី & អត្តសញ្ញាណ' : 'Identity & Account Credentials'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isKhmer ? 'ឧ. សុខ ចាន់ដារ៉ា' : 'e.g. David Sterling'}
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData((prev) => {
                      const updated = { ...prev, name: newName };
                      if (!prev.email || prev.email.endsWith('@cafe.com')) {
                        updated.email = newName ? `${newName.toLowerCase().replace(/\s+/g, '.')}@cafe.com` : '';
                      }
                      return updated;
                    });
                  }}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'អ៊ីមែល / ឈ្មោះចូលប្រព័ន្ធ' : 'Email / Web Login'}
                </label>
                <input
                  type="email"
                  placeholder="name@cafe.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    placeholder="+855 12 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'ពាក្យសម្ងាត់' : 'Initial Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 pr-9 text-xs font-mono text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role, PIN & Wage */}
          <div className="space-y-3 pt-3 border-t border-stone-800">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'តួនាទី លេខកូដ PIN & ប្រាក់ឈ្នួល' : 'Role, Quick PIN & Compensation'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'តួនាទី' : 'Role'} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="CASHIER">💵 Cashier</option>
                  <option value="BARISTA">☕ Barista / Kitchen</option>
                  <option value="MANAGER">👔 Store Manager</option>
                  <option value="ADMIN">👑 Admin / Owner</option>
                  <option value="SECURITY">🛡️ Security & Compliance Officer</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'លេខកូដ PIN' : '4-Digit PIN'} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="4444"
                  value={formData.pin}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-bold tracking-widest text-amber-400 text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'ប្រាក់ឈ្នួល ($/ម៉ោង)' : 'Wage ($/hr)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-300 block mb-1">
                  {isKhmer ? 'ស្ថានភាព' : 'Status'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="ACTIVE">{isKhmer ? 'សកម្ម (Active)' : 'Active'}</option>
                  <option value="INACTIVE">{isKhmer ? 'អសកម្ម (Inactive)' : 'Inactive'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Profile Photo Upload */}
          <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-200">
                    {isKhmer ? 'រូបភាពប្រវត្តិរូប (Profile Photo)' : 'Staff Profile Photo'}
                  </h5>
                  <p className="text-[11px] text-stone-400">
                    {isKhmer 
                      ? 'ផ្ទុកឡើងរូបថតបុគ្គលិកពីកុំព្យូទ័រ' 
                      : 'Upload staff avatar photo from local files'}
                  </p>
                </div>
              </div>

              {formData.avatar ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  <Check className="w-3 h-3" />
                  <span>{isKhmer ? 'មានរូបថត' : 'Photo Set'}</span>
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-stone-500 bg-stone-900 px-2 py-0.5 rounded-full border border-stone-800">
                  {isKhmer ? 'មិនទាន់មានរូបភាព' : 'No Photo Yet'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="relative group shrink-0">
                <UserAvatar
                  user={{
                    ...formData,
                    avatar: formData.avatar,
                    name: formData.name,
                    role: formData.role
                  }}
                  size="lg"
                />
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow transition cursor-pointer"
                    title={isKhmer ? 'លុបរូបភាព' : 'Remove photo'}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Action Button: File Upload */}
              <div className="flex-1 flex items-center gap-2">
                <label
                  htmlFor="create-user-upload-input"
                  className={`py-2 px-4 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-700 text-stone-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  title="Upload image file from storage"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isUploadingPhoto ? (isKhmer ? 'កំពុងផ្ទុក...' : 'Uploading...') : (isKhmer ? 'ផ្ទុកឡើងរូបថត' : 'Upload Photo')}</span>
                </label>
                <input
                  id="create-user-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Informational Callout: Face ID enrollment is only for created accounts */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-300">
              <ScanFace className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[11px] text-cyan-200">
                  {isKhmer ? 'ការចុះឈ្មោះស្កេនផ្ទៃមុខ Face ID (Biometric Enrollment)' : 'Biometric Face ID Enrollment Notice'}
                </span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  {isKhmer 
                    ? 'សម្រាប់ការ save ផ្ទៃមុខ Face ID ទាល់តែគណនីនេះត្រូវបានបង្កើតរួចរាល់ជាមុនសិន។ បន្ទាប់ពីបង្កើតរួច សូមចុចប៊ូតុង [ 📷 ស្កេនមុខ Face ID ] នៅលើជួរឈ្មោះបុគ្គលិកក្នុងបញ្ជី Staff Management ដើម្បីស្កេនមុខពិតប្រាកដ។'
                    : 'Face ID biometric enrollment is only permitted for accounts that are already created. After creating this account, click [ 📷 Enroll Face ID ] on their row in Staff Management to capture live face biometrics.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Permissions Granular Matrix */}
          <div className="space-y-2 pt-3 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                {isKhmer 
                  ? `សិទ្ធិអនុញ្ញាតប្រព័ន្ធ (${formData.permissions.length} បានបើក)` 
                  : `Assigned Security Permissions (${formData.permissions.length} Enabled)`}
              </label>
              <div className="flex gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, permissions: SYSTEM_PERMISSIONS.map((p) => p.id) }))}
                  className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  {isKhmer ? 'ផ្ដល់ទាំងអស់' : 'Grant All'}
                </button>
                <span className="text-stone-600">•</span>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ 
                    ...prev, 
                    permissions: ROLE_PERMISSIONS[prev.role]?.permissions || ['canAccessPos', 'canAccessOrders'] 
                  }))}
                  className="text-stone-400 hover:text-stone-200 font-semibold cursor-pointer"
                >
                  {isKhmer ? 'តាមតួនាទី' : 'Reset'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SYSTEM_PERMISSIONS.map((perm) => {
                const isAssigned = formData.permissions.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-[11px] transition cursor-pointer ${
                      isAssigned
                        ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                      isAssigned ? 'bg-amber-600 border-amber-500 text-stone-950 font-bold' : 'border-stone-700 bg-stone-900'
                    }`}>
                      {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{perm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-bold transition cursor-pointer"
            >
              {isKhmer ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {submitting 
                  ? (isKhmer ? 'កំពុងបង្កើត...' : 'Creating User...') 
                  : (isKhmer ? 'បង្កើតគណនីបុគ្គលិក' : 'Create Staff Member')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
