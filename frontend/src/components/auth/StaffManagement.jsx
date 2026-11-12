'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  DollarSign, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  Lock,
  ShieldAlert,
  FileText,
  Sliders,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera,
  Layers,
  Cpu,
  BadgeCheck,
  Search,
  Filter,
  Shuffle,
  Phone,
  Mail,
  User,
  Upload,
  Loader2,
  RotateCcw,
  Copy,
  CheckCheck,
  ScanFace,
  ChevronRight,
  Info,
  Shield,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Terminal,
  Wifi,
  Activity,
  LogOut,
  RefreshCw,
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  Radio
} from 'lucide-react';
import { LiveDeviceMap } from '../security/LiveDeviceMap';
import { ROLE_PERMISSIONS, SYSTEM_PERMISSIONS } from '../../services/coffeeData';
import { StaffShiftList } from './StaffShiftList';
import { CreateUserModal } from './CreateUserModal';
import { FaceScannerModal } from './FaceScannerModal';
import { UserAvatar } from '../common/UserAvatar';

export const StaffManagement = () => {
  const { staffList, auditLogs, loginSessions = [], terminateLoginSession, loadStaffAndAudits, showToast, user } = useApp();
  const { isKhmer } = useLanguage();

  // Navigation Subtabs: roster | matrix | roles | audit | shifts
  const [activeSubTab, setActiveSubTab] = useState('roster');
  
  // Interactive UI State
  const [revealedPins, setRevealedPins] = useState({});
  const [copiedPinId, setCopiedPinId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState(null);
  const [faceScanStaffTarget, setFaceScanStaffTarget] = useState(null);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Login Sessions & Device IP State
  const [sessionViewMode, setSessionViewMode] = useState('table'); // 'table' or 'map'
  const [isLiveMapModalOpen, setIsLiveMapModalOpen] = useState(false);
  const [liveMapTargetSessionId, setLiveMapTargetSessionId] = useState(null);
  const [loginSearchQuery, setLoginSearchQuery] = useState('');
  const [loginMethodFilter, setLoginMethodFilter] = useState('ALL');
  const [loginStatusFilter, setLoginStatusFilter] = useState('ALL');
  const [loginLocationFilter, setLoginLocationFilter] = useState('ALL');
  const [loginDeviceTypeFilter, setLoginDeviceTypeFilter] = useState('ALL');
  const [inspectedSession, setInspectedSession] = useState(null);
  const [copiedSessionIp, setCopiedSessionIp] = useState(null);

  const handleCopySessionIp = (ip, id) => {
    if (!ip) return;
    navigator.clipboard?.writeText(ip);
    setCopiedSessionIp(id);
    showToast(isKhmer ? 'បានចម្លងអាសយដ្ឋាន IP' : 'Copied IP address', 'success');
    setTimeout(() => setCopiedSessionIp(null), 2000);
  };

  const handleTerminateSession = async (sessionId, staffName) => {
    try {
      if (terminateLoginSession) {
        await terminateLoginSession(sessionId);
      }
      showToast(isKhmer ? `បានបញ្ចប់ Session របស់ ${staffName} ដោយជោគជ័យ` : `Session for ${staffName} terminated successfully`, 'info');
    } catch (e) {
      showToast('Failed to terminate session', 'error');
    }
  };

  const filteredSessions = useMemo(() => {
    return (loginSessions || []).filter((sess) => {
      const q = loginSearchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (sess.userName || '').toLowerCase().includes(q) ||
        (sess.userRole || '').toLowerCase().includes(q) ||
        (sess.ipAddress || '').toLowerCase().includes(q) ||
        (sess.os || '').toLowerCase().includes(q) ||
        (sess.browser || '').toLowerCase().includes(q) ||
        (sess.deviceType || '').toLowerCase().includes(q) ||
        (sess.terminalId || '').toLowerCase().includes(q) ||
        (sess.location || '').toLowerCase().includes(q) ||
        (sess.city || '').toLowerCase().includes(q) ||
        (sess.country || '').toLowerCase().includes(q) ||
        (sess.isp || '').toLowerCase().includes(q);

      const matchMethod = loginMethodFilter === 'ALL' || sess.loginMethod === loginMethodFilter;
      const matchStatus = loginStatusFilter === 'ALL' || sess.status === loginStatusFilter;
      const matchLocation = loginLocationFilter === 'ALL' || 
        (sess.location || '').toLowerCase().includes(loginLocationFilter.toLowerCase()) ||
        (sess.city || '').toLowerCase().includes(loginLocationFilter.toLowerCase());

      const matchDevice = loginDeviceTypeFilter === 'ALL' || 
        (loginDeviceTypeFilter === 'Phone' && (
          sess.deviceType === 'Phone' || 
          sess.deviceType === 'Mobile' || 
          (sess.deviceModel || '').toLowerCase().includes('phone') || 
          (sess.deviceModel || '').toLowerCase().includes('iphone') ||
          (sess.os || '').toLowerCase().includes('ios')
        )) ||
        (loginDeviceTypeFilter === 'Tablet' && (
          sess.deviceType === 'Tablet' || 
          (sess.deviceModel || '').toLowerCase().includes('tablet') || 
          (sess.deviceModel || '').toLowerCase().includes('ipad')
        )) ||
        (loginDeviceTypeFilter === 'Desktop' && (
          sess.deviceType === 'Desktop' || 
          (sess.deviceModel || '').toLowerCase().includes('pc') || 
          (sess.deviceModel || '').toLowerCase().includes('macbook')
        )) ||
        (loginDeviceTypeFilter === 'POS Touch Station' && (
          sess.deviceType === 'POS Touch Station' || 
          sess.deviceType === 'POS Station' || 
          (sess.deviceModel || '').toLowerCase().includes('pos') || 
          (sess.deviceModel || '').toLowerCase().includes('kiosk')
        ));

      return matchQuery && matchMethod && matchStatus && matchLocation && matchDevice;
    });
  }, [loginSessions, loginSearchQuery, loginMethodFilter, loginStatusFilter, loginLocationFilter, loginDeviceTypeFilter]);

  // Custom Roles state (allows creating brand new roles)
  const [customRoles, setCustomRoles] = useState([
    {
      id: 'SUPERVISOR',
      title: 'Shift Supervisor',
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
      description: 'Supervises register staff, conducts drawer audits, and authorizes refunds.',
      permissions: ['canAccessPos', 'canAccessKds', 'canAccessDashboard', 'canPerformOverrides', 'canSeeExpectedCash']
    },
    {
      id: 'ROASTER',
      title: 'Head Roaster',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      description: 'Manages green and roasted bean inventory, cupping profiles, and batch recipes.',
      permissions: ['canAccessKds', 'canAccessInventory']
    }
  ]);

  const [newRoleForm, setNewRoleForm] = useState({
    id: '',
    title: '',
    description: '',
    permissions: ['canAccessPos', 'canAccessOrders']
  });
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Form State for Add / Edit Staff
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CASHIER',
    pin: '',
    hourlyRate: 14.00,
    phone: '',
    password: 'password123',
    status: 'ACTIVE',
    faceEnrolled: false,
    facePhoto: '',
    permissions: ROLE_PERMISSIONS.CASHIER?.permissions || []
  });

  // Calculate dynamic member counts per role
  const roleCounts = useMemo(() => {
    const list = staffList || [];
    const counts = {
      ALL: list.length,
      ADMIN: 0,
      MANAGER: 0,
      SECURITY: 0,
      CASHIER: 0,
      BARISTA: 0
    };
    list.forEach((s) => {
      const r = (s.role || '').toUpperCase();
      if (counts[r] !== undefined) counts[r]++;
      else counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [staffList]);

  // Filter staff list
  const filteredStaff = useMemo(() => {
    return (staffList || []).filter((staff) => {
      if (roleFilter !== 'ALL' && (staff.role || '').toUpperCase() !== roleFilter.toUpperCase()) return false;
      if (statusFilter !== 'ALL' && (staff.status || 'ACTIVE').toUpperCase() !== statusFilter.toUpperCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = staff.name?.toLowerCase().includes(q);
        const matchEmail = staff.email?.toLowerCase().includes(q);
        const matchPhone = staff.phone?.toLowerCase().includes(q);
        const matchRole = staff.role?.toLowerCase().includes(q);
        const matchId = staff.id?.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchRole || matchId;
      }
      return true;
    });
  }, [staffList, roleFilter, statusFilter, searchQuery]);

  // Live Cross-Device Session Sync Polling: Automatically pulls new logins (including phones) every 10s
  React.useEffect(() => {
    if (activeSubTab !== 'sessions') return;
    const interval = setInterval(() => {
      if (loadStaffAndAudits) loadStaffAndAudits();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSubTab, loadStaffAndAudits]);

  const togglePinReveal = (id) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPin = (staffId, pin) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPinId(staffId);
    showToast(isKhmer ? `បានចម្លងកូដ PIN: ${pin}` : `Copied PIN to clipboard: ${pin}`, 'info');
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleOpenFaceScan = (staff) => {
    setFaceScanStaffTarget(staff);
    setIsFaceScannerOpen(true);
  };

  const handleFaceScanComplete = async (scanResult) => {
    setIsFaceScannerOpen(false);
    if (loadStaffAndAudits) {
      await loadStaffAndAudits();
    }
    if (editingStaff && faceScanStaffTarget && editingStaff.id === faceScanStaffTarget.id) {
      const photo = scanResult?.facePhoto || scanResult?.avatar || scanResult?.photoData;
      if (photo) {
        setFormData((prev) => ({
          ...prev,
          avatar: photo,
          facePhoto: photo,
          faceHash: scanResult?.faceHash || prev.faceHash,
          faceBiometrics: scanResult?.faceBiometrics || prev.faceBiometrics,
          faceEnrolled: true
        }));
      }
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(isKhmer ? 'សូមជ្រើសរើសឯកសាររូបភាព (JPG, PNG, WEBP)' : 'Please select a valid image file (JPG, PNG, WEBP)', 'warning');
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
          facePhoto: res.imageUrl,
          avatar: res.imageUrl
        }));
        showToast(isKhmer ? 'បានផ្ទុករូបភាពប្រវត្តិរូបជោគជ័យ!' : 'Profile photo uploaded to server!', 'success');
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
      facePhoto: '',
      avatar: ''
    }));
    showToast(isKhmer ? 'បានលុបរូបភាពចេញ' : 'Profile photo removed', 'info');
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    const existingPerms = staff.permissions && staff.permissions.length > 0
      ? staff.permissions
      : (ROLE_PERMISSIONS[staff.role]?.permissions || ['canAccessPos', 'canAccessOrders']);

    setFormData({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      pin: staff.pin || staff.pinCode || '1234',
      hourlyRate: staff.hourlyRate || 14.00,
      phone: staff.phone || '',
      password: staff.password || 'password123',
      status: staff.status || 'ACTIVE',
      faceEnrolled: Boolean(staff.faceEnrolled),
      facePhoto: staff.facePhoto || staff.avatar || '',
      permissions: existingPerms
    });
    setShowPassword(false);
  };

  const handleRoleChange = (newRole) => {
    const standardPerms = ROLE_PERMISSIONS[newRole]?.permissions;
    const customMatch = customRoles.find((r) => r.id === newRole);
    const newPerms = standardPerms || customMatch?.permissions || ['canAccessPos', 'canAccessOrders'];

    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: [...newPerms]
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

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(isKhmer ? 'សូមបញ្ចូលឈ្មោះពេញ' : 'Staff Full Name is required', 'warning');
      return;
    }
    if (!formData.pin || formData.pin.length !== 4) {
      showToast(isKhmer ? 'សូមបញ្ចូលលេខកូដ PIN ៤ ខ្ទង់' : 'A 4-digit PIN is required for register login', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.id, {
          ...formData,
          pinCode: formData.pin
        });
        showToast(isKhmer ? `បានកែប្រែគណនី ${formData.name} ដោយជោគជ័យ!` : `User ${formData.name} updated successfully!`, 'success');
        setEditingStaff(null);
      } else {
        await api.createStaff({
          ...formData,
          pinCode: formData.pin
        });
        showToast(isKhmer ? `បានបង្កើតគណនី ${formData.name} ដោយជោគជ័យ!` : `User ${formData.name} created successfully!`, 'success');
        setIsAddModalOpen(false);
      }
      if (loadStaffAndAudits) {
        await loadStaffAndAudits();
      }
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;
    setIsDeleting(true);
    try {
      await api.deleteStaff(deleteConfirmStaff.id);
      showToast(isKhmer ? `បានលុបគណនី ${deleteConfirmStaff.name} ដោយជោគជ័យ` : `User ${deleteConfirmStaff.name} removed successfully`, 'info');
      setDeleteConfirmStaff(null);
      if (loadStaffAndAudits) {
        await loadStaffAndAudits();
      }
    } catch (err) {
      showToast(err.message || 'Failed to remove user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateStaff(staff.id, { ...staff, status: nextStatus });
      showToast(isKhmer ? `${staff.name} ត្រូវបានប្តូរទៅជា ${nextStatus}` : `${staff.name} is now ${nextStatus}`, 'info');
      if (loadStaffAndAudits) {
        await loadStaffAndAudits();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCreateCustomRole = (e) => {
    e.preventDefault();
    if (!newRoleForm.title.trim()) {
      showToast('Please specify a role title', 'warning');
      return;
    }
    const roleId = newRoleForm.title.toUpperCase().replace(/\s+/g, '_');
    const createdRole = {
      id: roleId,
      title: newRoleForm.title.trim(),
      badgeColor: 'bg-stone-900 text-stone-200 border-stone-700',
      description: newRoleForm.description || 'Custom defined store role.',
      permissions: [...newRoleForm.permissions]
    };

    setCustomRoles((prev) => [...prev, createdRole]);
    setIsCreatingRole(false);
    setNewRoleForm({ id: '', title: '', description: '', permissions: ['canAccessPos', 'canAccessOrders'] });
    showToast(`Custom Role "${createdRole.title}" created!`, 'success');
  };

  // Pre-configured role definitions for the interactive overview
  const roleCardsData = [
    {
      role: 'ADMIN',
      title: isKhmer ? 'ម្ចាស់ហាង / Admin' : 'Admin / Owner',
      desc: isKhmer ? 'សិទ្ធិពេញលេញលើប្រព័ន្ធ របាយការណ៍ និងការកំណត់' : 'Full unrestricted access to system, finances & menus',
      accentColor: 'purple',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      dotColor: 'bg-purple-400',
      count: roleCounts.ADMIN || 0
    },
    {
      role: 'MANAGER',
      title: isKhmer ? 'ប្រធានហាង / Manager' : 'Store Manager',
      desc: isKhmer ? 'របាយការណ៍លក់ ស្តុក KDS និងការអនុញ្ញាត Override' : 'Daily sales reports, inventory receiving & overrides',
      accentColor: 'amber',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      dotColor: 'bg-amber-400',
      count: roleCounts.MANAGER || 0
    },
    {
      role: 'SECURITY',
      title: isKhmer ? 'មន្ត្រីសុវត្ថិភាព' : 'Security Officer',
      desc: isKhmer ? 'សវនកម្មសុវត្ថិភាព កំណត់ត្រា Login និងការផ្ទៀងផ្ទាត់' : 'Security audit logs, login attempts & compliance',
      accentColor: 'blue',
      badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      dotColor: 'bg-blue-400',
      count: roleCounts.SECURITY || 0
    },
    {
      role: 'CASHIER',
      title: isKhmer ? 'បុគ្គលិកគិតប្រាក់' : 'Front Cashier',
      desc: isKhmer ? 'ស្ថានីយគិតប្រាក់ POS និងការទូទាត់ប្រាក់' : 'POS order checkout & cash drawer operations',
      accentColor: 'sky',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      dotColor: 'bg-sky-400',
      count: roleCounts.CASHIER || 0
    },
    {
      role: 'BARISTA',
      title: isKhmer ? 'អ្នកឆុងកាហ្វេ / Barista' : 'Barista / Kitchen',
      desc: isKhmer ? 'អេក្រង់ផ្ទះបាយ KDS និងការរៀបចំភេសជ្ជៈ' : 'KDS preparation queue & beverage recipe fulfillment',
      accentColor: 'emerald',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      count: roleCounts.BARISTA || 0
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-stone-950/60 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN PAGE HEADER & PRIMARY ACTION
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-md shadow-amber-950/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100 tracking-tight flex items-center gap-2">
              <span>{isKhmer ? 'ការគ្រប់គ្រងបុគ្គលិក និងសិទ្ធិប្រើប្រាស់' : 'Staff & Access Control'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700/60 font-mono">
                RBAC
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              {isKhmer 
                ? 'គ្រប់គ្រងគណនីបុគ្គលិក កម្រិតសិទ្ធិតាមតួនាទី លេខកូដ PIN និងសវនកម្មសុវត្ថិភាព' 
                : 'Configure roles, granular security permissions, PIN credentials, and audit logs'}
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isKhmer ? '+ បន្ថែមបុគ្គលិកថ្មី' : '+ Add Team Member'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEGMENTED SUB-NAVIGATION TABS
      ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex p-1 bg-stone-900/90 rounded-2xl border border-stone-800/90 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'បញ្ជីបុគ្គលិក' : 'Team Roster'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'roster' ? 'bg-amber-500/30 text-amber-200' : 'bg-stone-800 text-stone-400'
            }`}>
              {staffList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ម៉ាទ្រីសសិទ្ធិ' : 'Permission Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'roles'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ការកំណត់តួនាទី' : 'Role Configurator'}</span>
            {customRoles.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeSubTab === 'roles' ? 'bg-amber-500/30 text-amber-200' : 'bg-stone-800 text-stone-400'
              }`}>
                +{customRoles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'សវនកម្មសុវត្ថិភាព' : 'Audit Trail'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'audit' ? 'bg-amber-500/30 text-amber-200' : 'bg-stone-800 text-stone-400'
            }`}>
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'វេន & ថតប្រាក់' : 'Shifts & Drawers'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logins')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'logins'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ប្រវត្តិ Login & IP' : 'Login & Device IP'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'logins' ? 'bg-amber-500/30 text-amber-200' : 'bg-stone-800 text-stone-400'
            }`}>
              {loginSessions.length}
            </span>
          </button>
        </div>

        {/* Quick Sync status */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isKhmer ? 'ទិន្នន័យស៊ីសង្វាក់គ្នាតាមពេលវេលាជាក់ស្តែង' : 'Live Sync Active'}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE ROLE OVERVIEW & QUICK FILTER STRIP
          (Replaces the massive static cards with sleek clickable filters)
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'roster' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-amber-500" />
              <span>{isKhmer ? 'ជ្រើសរើសតួនាទីដើម្បីចម្រាញ់' : 'Filter by Role'}</span>
            </span>
            {roleFilter !== 'ALL' && (
              <button
                onClick={() => setRoleFilter('ALL')}
                className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset to All'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* "All" Card */}
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                roleFilter === 'ALL'
                  ? 'bg-stone-900 border-amber-500/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/40'
                  : 'bg-stone-900/50 border-stone-800/80 hover:bg-stone-900/80 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200">
                  {isKhmer ? 'បុគ្គលិកទាំងអស់' : 'All Roles'}
                </span>
                <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  roleFilter === 'ALL' ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                }`}>
                  {staffList.length}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-2 truncate">
                {isKhmer ? 'បង្ហាញបុគ្គលិកទាំងអស់' : 'Complete team roster'}
              </p>
            </button>

            {/* Standard Roles */}
            {roleCardsData.map((item) => {
              const isSelected = roleFilter === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => setRoleFilter(isSelected ? 'ALL' : item.role)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-stone-900 border-amber-500/60 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/40'
                      : 'bg-stone-900/50 border-stone-800/80 hover:bg-stone-900/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                      <span className="text-xs font-bold text-stone-200 truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-300'
                    }`}>
                      {item.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 line-clamp-1 group-hover:text-stone-400 transition" title={item.desc}>
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 1: TEAM ROSTER (MAIN TABLE)
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'roster' && (
        <div className="rounded-3xl border border-stone-800/90 bg-stone-900/60 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Integrated Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-stone-950/40">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ...' : 'Search by name, email, phone, role...'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-9 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Role Dropdown */}
              <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-stone-900">All ({staffList.length})</option>
                  <option value="ADMIN" className="bg-stone-900">ADMIN ({roleCounts.ADMIN || 0})</option>
                  <option value="MANAGER" className="bg-stone-900">MANAGER ({roleCounts.MANAGER || 0})</option>
                  <option value="SECURITY" className="bg-stone-900">SECURITY ({roleCounts.SECURITY || 0})</option>
                  <option value="CASHIER" className="bg-stone-900">CASHIER ({roleCounts.CASHIER || 0})</option>
                  <option value="BARISTA" className="bg-stone-900">BARISTA ({roleCounts.BARISTA || 0})</option>
                  {customRoles.map((cr) => (
                    <option key={cr.id} value={cr.id} className="bg-stone-900">{cr.title}</option>
                  ))}
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-stone-900">All Statuses</option>
                  <option value="ACTIVE" className="bg-stone-900">Active Only</option>
                  <option value="INACTIVE" className="bg-stone-900">Inactive / Suspended</option>
                </select>
              </div>

              {/* Counter Pill */}
              <span className="text-xs font-mono text-stone-400 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                {filteredStaff.length} / {staffList.length}
              </span>
            </div>
          </div>

          {/* Clean Modern Table (No redundant profile photo column!) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">{isKhmer ? 'សមាជិកបុគ្គលិក' : 'Team Member'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'តួនាទី' : 'Assigned Role'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'កូដ PIN ស្ថានីយ' : 'POS PIN'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'សិទ្ធិប្រើប្រាស់' : 'Access Level'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ប្រាក់ឈ្នួល / ម៉ោង' : 'Hourly Wage'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-3.5 px-4">{isKhmer ? 'ឧបករណ៍ & IP' : 'Device & IP'}</th>
                  <th className="py-3.5 px-5 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50 text-stone-300">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                        <Users className="w-6 h-6 opacity-60" />
                      </div>
                      <p className="font-bold text-sm text-stone-300">
                        {isKhmer ? 'រកមិនឃើញសមាជិកបុគ្គលិក' : 'No team members match your criteria'}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {isKhmer ? 'សូមសាកល្បងសម្អាតតម្រង ឬពាក្យស្វែងរករបស់អ្នក' : 'Try clearing your search query or role filter'}
                      </p>
                      {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setRoleFilter('ALL');
                            setStatusFilter('ALL');
                          }}
                          className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer transition"
                        >
                          {isKhmer ? 'សម្អាតតម្រងទាំងអស់' : 'Clear all filters'}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isPinRevealed = revealedPins[staff.id];
                    const isCopied = copiedPinId === staff.id;
                    const isCurrentSessionUser = staff.id === user?.id;
                    const roleConfig = ROLE_PERMISSIONS[staff.role] || {
                      title: staff.role,
                      badgeColor: 'bg-stone-800 text-stone-300 border-stone-700'
                    };
                    const permsCount = staff.permissions ? staff.permissions.length : (roleConfig.permissions?.length || 4);
                    const permsPercent = Math.min(100, Math.round((permsCount / SYSTEM_PERMISSIONS.length) * 100));

                    return (
                      <tr key={staff.id} className="hover:bg-stone-800/30 transition-colors group">
                        {/* 1. Team Member (Avatar + Name + Contact) */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="relative">
                              <UserAvatar 
                                user={staff} 
                                size="md" 
                                showFaceIdBadge={staff.faceEnrolled}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-100 text-xs sm:text-sm">
                                  {staff.name}
                                </span>
                                {isCurrentSessionUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                                    {isKhmer ? 'អ្នក' : 'You'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-0.5">
                                <span className="truncate max-w-[170px] sm:max-w-none">{staff.email}</span>
                                {staff.phone && (
                                  <>
                                    <span className="text-stone-700">•</span>
                                    <span>{staff.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${roleConfig.badgeColor}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                            <span>{roleConfig.title || staff.role}</span>
                          </span>
                        </td>

                        {/* 3. POS PIN (Masked with clean reveal/copy buttons) */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="inline-flex items-center gap-1 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                            <span className="text-xs font-bold text-amber-400 min-w-[40px] text-center tracking-wider">
                              {isPinRevealed ? (staff.pin || staff.pinCode) : '••••'}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => togglePinReveal(staff.id)}
                              className="text-stone-500 hover:text-stone-300 p-0.5 transition cursor-pointer"
                              title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                            >
                              {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {isPinRevealed && (
                              <button
                                type="button"
                                onClick={() => handleCopyPin(staff.id, staff.pin || staff.pinCode)}
                                className="text-stone-500 hover:text-amber-400 p-0.5 transition cursor-pointer"
                                title="Copy PIN"
                              >
                                {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 4. Permissions (Clean micro progress bar) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 w-28">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-stone-300 font-bold">{permsCount} / {SYSTEM_PERMISSIONS.length}</span>
                              <span className="text-stone-500">{permsPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  permsPercent > 75 
                                    ? 'bg-amber-500' 
                                    : permsPercent > 40 
                                    ? 'bg-amber-600/80' 
                                    : 'bg-stone-600'
                                }`}
                                style={{ width: `${permsPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. Hourly Wage */}
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-200">
                          ${(staff.hourlyRate || 14.00).toFixed(2)}
                          <span className="text-[10px] text-stone-500 font-normal ml-0.5">/hr</span>
                        </td>

                        {/* 6. Status (Interactive Switch Pill) */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(staff)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                              staff.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700'
                            }`}
                            title="Click to toggle status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              staff.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                            }`} />
                            <span>{staff.status || 'ACTIVE'}</span>
                          </button>
                        </td>

                        {/* 7. Last Login & Device IP */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="font-mono text-[11px] font-bold text-stone-200 truncate">
                                {staff.lastLoginIp || '192.168.1.108'}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate max-w-[150px]" title={staff.lastLoginDevice || 'Desktop (Windows)'}>
                                {staff.lastLoginDevice || 'Desktop (Windows)'}
                              </span>
                            </div>
                            <div className="text-[10px] text-rose-400/90 truncate flex items-center gap-1 font-semibold">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate max-w-[150px]" title={staff.lastLoginLocation || 'Phnom Penh, Cambodia 🇰🇭'}>
                                {staff.lastLoginLocation || 'Phnom Penh, Cambodia 🇰🇭'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Prominent Live Face Scanner Enrollment Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenFaceScan(staff)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer shrink-0 shadow-sm ${
                                staff.faceEnrolled
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border-cyan-500/40 hover:border-cyan-400'
                              }`}
                              title={
                                staff.faceEnrolled
                                  ? (isKhmer ? 'Face ID រួចរាល់ · ចុចដើម្បីស្កេនម្ដងទៀត' : 'Face ID Enrolled · Click to re-scan')
                                  : (isKhmer ? 'ចុះឈ្មោះស្កេនមុខ Face ID សម្រាប់គណនីនេះ' : 'Click to enroll Face ID for this account')
                              }
                            >
                              {staff.faceEnrolled ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              ) : null}
                              <ScanFace className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">
                                {staff.faceEnrolled 
                                  ? (isKhmer ? 'Face ID រួចរាល់' : 'Enrolled') 
                                  : (isKhmer ? 'ស្កេនមុខ Face ID' : 'Enroll Face ID')}
                              </span>
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditModal(staff)}
                              className="p-1.5 rounded-xl bg-stone-800 hover:bg-amber-500/20 text-stone-400 hover:text-amber-400 border border-stone-700/60 hover:border-amber-500/40 transition cursor-pointer"
                              title="Edit User & Permissions"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (Disabled for active logged-in user) */}
                            {isCurrentSessionUser ? (
                              <span
                                className="p-1.5 rounded-xl bg-stone-900 text-stone-600 border border-stone-800/80 cursor-not-allowed opacity-50"
                                title="Active session account (cannot delete yourself)"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmStaff(staff)}
                                className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 border border-stone-700/60 hover:border-rose-800/40 transition cursor-pointer"
                                title={`Delete ${staff.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 2: PERMISSION MATRIX
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'matrix' && (
        <div className="rounded-3xl border border-stone-800/90 bg-stone-900/60 shadow-2xl backdrop-blur-md overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>{isKhmer ? 'ម៉ាទ្រីសសិទ្ធិប្រើប្រាស់ប្រព័ន្ធ (RBAC Matrix)' : 'Role-Based Access Control (RBAC) Matrix'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isKhmer 
                  ? 'ការបែងចែកសិទ្ធិតាមផ្នែក៖ ការលក់ ផ្ទះបាយ របាយការណ៍ហិរញ្ញវត្ថុ និងការអនុញ្ញាតទូទាត់' 
                  : 'Strict system permissions enforcing financial data shielding and blind cash drops'}
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('roles')}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition self-start sm:self-auto"
            >
              <span>{isKhmer ? 'កែប្រែតួនាទី' : 'Customize Roles'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{isKhmer ? 'ម៉ូឌុលសន្តិសុខ & សិទ្ធិ' : 'Security Permission Module'}</th>
                  <th className="py-3 px-4 text-center">Admin / Owner</th>
                  <th className="py-3 px-4 text-center">Store Manager</th>
                  <th className="py-3 px-4 text-center">Front Cashier</th>
                  <th className="py-3 px-4 text-center">Barista (KDS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50 text-stone-300">
                {SYSTEM_PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="hover:bg-stone-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-200 block text-xs">{perm.label}</span>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">{perm.description}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ROLE_PERMISSIONS.MANAGER?.permissions.includes(perm.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ROLE_PERMISSIONS.CASHIER?.permissions.includes(perm.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ROLE_PERMISSIONS.BARISTA?.permissions.includes(perm.id) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-stone-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB 3: ROLE & PERMISSION CONFIGURATOR
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-stone-800/90 bg-stone-900/60 p-6 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>{isKhmer ? 'ការកំណត់តួនាទីថ្មី (Custom Roles)' : 'Custom Role & Permission Configurator'}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isKhmer 
                    ? 'បង្កើតតួនាទីថ្មី ឬកែសម្រួលសិទ្ធិសម្រាប់ក្រុមការងារហាងកាហ្វេរបស់អ្នក' 
                    : 'Define custom job titles with tailor-fit feature permissions'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingRole(!isCreatingRole)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <span>{isCreatingRole ? (isKhmer ? 'បោះបង់' : 'Cancel') : (isKhmer ? '+ បង្កើតតួនាទីថ្មី' : '+ Create Role')}</span>
              </button>
            </div>

            {/* Create Role Form */}
            {isCreatingRole && (
              <form onSubmit={handleCreateCustomRole} className="p-5 rounded-2xl bg-stone-950 border border-amber-500/40 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {isKhmer ? 'កំណត់ព័ត៌មានតួនាទីថ្មី' : 'Define New Role Specification'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                      {isKhmer ? 'ឈ្មោះតួនាទី' : 'Role Title'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newRoleForm.title}
                      onChange={(e) => setNewRoleForm({ ...newRoleForm, title: e.target.value })}
                      placeholder="e.g. Lead Barista, Shift Supervisor"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                      {isKhmer ? 'ការពិពណ៌នា' : 'Description'}
                    </label>
                    <input
                      type="text"
                      value={newRoleForm.description}
                      onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                      placeholder="e.g. Oversees drink quality & inventory counts"
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-2">
                    {isKhmer ? 'សិទ្ធិប្រើប្រាស់ដែលត្រូវអនុញ្ញាត' : 'Granted Feature Permissions'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {SYSTEM_PERMISSIONS.map((perm) => {
                      const isGranted = newRoleForm.permissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => {
                            setNewRoleForm((prev) => ({
                              ...prev,
                              permissions: isGranted
                                ? prev.permissions.filter((p) => p !== perm.id)
                                : [...prev.permissions, perm.id]
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                            isGranted
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          <span className="text-xs font-semibold">{perm.label}</span>
                          {isGranted ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <XCircle className="w-4 h-4 text-stone-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingRole(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    {isKhmer ? 'បោះបង់' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold cursor-pointer"
                  >
                    {isKhmer ? 'រក្សាទុកតួនាទី' : 'Save Custom Role'}
                  </button>
                </div>
              </form>
            )}

            {/* Custom Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customRoles.map((role) => (
                <div key={role.id} className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-100">{role.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                      {role.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{role.description}</p>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-800/80">
                    {role.permissions.map((pId) => {
                      const meta = SYSTEM_PERMISSIONS.find((sp) => sp.id === pId);
                      return (
                        <span key={pId} className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 font-mono">
                          ✓ {meta?.label || pId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TAB 4: AUDIT TRAIL
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'audit' && (
        <div className="rounded-3xl border border-stone-800/90 bg-stone-900/60 shadow-2xl backdrop-blur-md overflow-hidden p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>{isKhmer ? 'សវនកម្មសុវត្ថិភាព និងការអនុញ្ញាត Overrides' : 'Security & Manager Override Audit Trail'}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {isKhmer 
                  ? 'កំណត់ត្រាសុវត្ថិភាព៖ ការលុបវិក្កយបត្រ ការបញ្ចុះតម្លៃ និងការអនុញ្ញាតដោយប្រធាន' 
                  : 'Tamper-evident logs of all voids, promotional discounts, and supervisor authorizations'}
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-stone-800 text-stone-300 self-start sm:self-auto">
              {auditLogs.length} Events Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Initiated By</th>
                  <th className="py-3 px-4">Authorized By</th>
                  <th className="py-3 px-4">Audit Details</th>
                  <th className="py-3 px-4 text-right">Value ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50 text-stone-300 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 font-sans">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-4 text-stone-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          log.action === 'VOID_ITEM'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : log.action === 'DISCOUNT_OVERRIDE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : log.action === 'LOGIN_SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : log.action === 'LOGIN_FAILED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-600'
                            : log.action === 'SCREEN_LOCKED' || log.action === 'SCREEN_UNLOCKED'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-stone-800 text-stone-300'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-stone-200">
                        {log.userName}
                      </td>
                      <td className="py-3 px-4 font-sans text-amber-400 font-bold">
                        {log.authorizedBy || '—'}
                      </td>
                      <td className="py-3 px-4 font-sans text-stone-300 max-w-sm">
                        <div className="truncate">{log.details}</div>
                        {(log.ipAddress || log.deviceInfo) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                            {log.ipAddress && <span className="text-cyan-400">🌐 {log.ipAddress}</span>}
                            {log.deviceInfo && <span>• {log.deviceInfo}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {log.amount > 0 ? `$${log.amount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. TAB 5: STAFF SHIFTS & DRAWER OPEN / CLOSE
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'shifts' && <StaffShiftList />}

      {/* ─────────────────────────────────────────────────────────────
          9. TAB 6: LOGIN SESSIONS & DEVICE IP AUDIT (ENTERPRISE STANDARD)
      ────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'logins' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Sessions */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'Session សរុបទាំងអស់' : 'Total Sessions'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-stone-100 font-mono mt-2">
                {loginSessions.length}
              </p>
              <p className="text-[10px] text-stone-500 mt-1">
                {isKhmer ? 'កំណត់ត្រាសុវត្ថិភាពចូលប្រើប្រព័ន្ធ' : 'Recorded device login events'}
              </p>
            </div>

            {/* Card 2: Active Live Stations */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'ស្ថានីយ / Session កំពុងសកម្ម' : 'Active Live Sessions'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Monitor className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {loginSessions.filter((s) => s.status === 'ACTIVE').length}
                </p>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                {isKhmer ? 'ឧបករណ៍កំពុងតភ្ជាប់ក្នុងពេលបច្ចុប្បន្ន' : 'Currently authenticated devices'}
              </p>
            </div>

            {/* Card 3: Network IP Classification */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'បណ្តាញ IP (Public / LAN)' : 'IP Network Types'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-stone-200 mt-2">
                <span className="text-cyan-400">{loginSessions.filter((s) => s.ipType === 'IPv4').length} Public</span>
                <span className="text-stone-600">•</span>
                <span className="text-emerald-400">{loginSessions.filter((s) => s.ipType === 'LAN').length} Secure LAN</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                {isKhmer ? 'ចែកតាមកម្រិតសុវត្ថិភាពបណ្តាញ' : 'Network architecture breakdown'}
              </p>
            </div>

            {/* Card 4: Security Shield Standard */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {isKhmer ? 'ស្តង់ដារសុវត្ថិភាព' : 'Encryption Standard'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-purple-300 font-mono mt-2">
                TLS 1.3 • AES-256
              </p>
              <p className="text-[10px] text-stone-500 mt-1">
                {isKhmer ? 'ការការពារ Zero-Trust POS' : 'Zero-Trust audited connection'}
              </p>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="rounded-3xl border border-stone-800/90 bg-stone-900/60 shadow-2xl backdrop-blur-md overflow-hidden">
            {/* Header & Filter Toolbar */}
            <div className="p-5 border-b border-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-950/40">
              <div>
                <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span>{isKhmer ? 'ប្រវត្តិ Login ឧបករណ៍ & អាសយដ្ឋាន IP' : 'Login Sessions & Device IP Audit'}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isKhmer 
                    ? 'ត្រួតពិនិត្យឧបករណ៍ដែលបានភ្ជាប់ អាសយដ្ឋាន IP វិធីសាស្ត្រផ្ទៀងផ្ទាត់ និងស្ថានភាព Session ជាក់ស្តែង' 
                    : 'Standard enterprise audit log of all register logins, device fingerprints, and client IP addresses'}
                </p>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    type="text"
                    value={loginSearchQuery}
                    onChange={(e) => setLoginSearchQuery(e.target.value)}
                    placeholder={isKhmer ? 'ស្វែងរកតាម ទីតាំង, IP, ឧបករណ៍, ឈ្មោះ...' : 'Search by location, IP, device, staff...'}
                    className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  {loginSearchQuery && (
                    <button
                      onClick={() => setLoginSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-200 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Location Filter */}
                <select
                  value={loginLocationFilter}
                  onChange={(e) => setLoginLocationFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isKhmer ? 'គ្រប់ទីតាំងទាំងអស់' : 'All Locations'}</option>
                  <option value="Phnom Penh">Phnom Penh 🇰🇭</option>
                  <option value="Siem Reap">Siem Reap 🇰🇭</option>
                  <option value="Battambang">Battambang 🇰🇭</option>
                  <option value="Kandal">Kandal 🇰🇭</option>
                </select>

                {/* Device Type Filter (Phones, Tablets, Desktops, POS Stations) */}
                <select
                  value={loginDeviceTypeFilter}
                  onChange={(e) => setLoginDeviceTypeFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isKhmer ? 'គ្រប់ប្រភេទឧបករណ៍ទាំងអស់' : 'All Device Types'}</option>
                  <option value="Phone">{isKhmer ? '📱 ទូរស័ព្ទដៃ (Phones / Mobile)' : '📱 Phones / Mobile'}</option>
                  <option value="Tablet">{isKhmer ? '📟 ថេប្លេត (Tablet / iPad)' : '📟 Tablet / iPad'}</option>
                  <option value="Desktop">{isKhmer ? '🖥️ កុំព្យូទ័រ (Desktop / Laptop)' : '🖥️ Desktop / Laptop'}</option>
                  <option value="POS Touch Station">{isKhmer ? '📠 ស្ថានីយគិតលុយ (POS Station)' : '📠 POS Touch Station'}</option>
                </select>

                {/* Method Filter */}
                <select
                  value={loginMethodFilter}
                  onChange={(e) => setLoginMethodFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isKhmer ? 'វិធីសាស្ត្រទាំងអស់' : 'All Methods'}</option>
                  <option value="PASSWORD">{isKhmer ? 'ពាក្យសម្ងាត់ (Password)' : 'Password'}</option>
                  <option value="PIN">{isKhmer ? 'លេខកូដសម្ងាត់ (PIN ៤ ខ្ទង់)' : '4-Digit PIN'}</option>
                  <option value="FACE_BIOMETRIC">{isKhmer ? 'ស្កេនផ្ទៃមុខ (Face ID)' : 'Face Biometrics'}</option>
                  <option value="SCREEN_UNLOCK">{isKhmer ? 'ដោះសោស្ថានីយ (Unlock)' : 'Screen Unlock'}</option>
                  <option value="SCREEN_HANDOVER">{isKhmer ? 'ផ្ទេរវេនស្ថានីយ (Handover)' : 'Station Handover'}</option>
                </select>

                {/* Status Filter */}
                <select
                  value={loginStatusFilter}
                  onChange={(e) => setLoginStatusFilter(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{isKhmer ? 'ស្ថានភាពទាំងអស់' : 'All Statuses'}</option>
                  <option value="ACTIVE">{isKhmer ? 'កំពុងដំណើរការ (Active)' : 'Active Only'}</option>
                  <option value="CLOSED">{isKhmer ? 'បានបិទ (Closed)' : 'Closed Only'}</option>
                </select>

                {/* Counter Pill */}
                <span className="text-xs font-mono text-stone-400 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                  {filteredSessions.length} / {loginSessions.length}
                </span>

                {/* View Mode Switcher (Table vs Real-Time Live Map) */}
                <div className="flex items-center p-0.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSessionViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      sessionViewMode === 'table'
                        ? 'bg-amber-500 text-stone-950 font-black shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'តារាង' : 'Table'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                      sessionViewMode === 'map'
                        ? 'bg-amber-500 text-stone-950 font-black shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ផែនទីផ្ទាល់' : 'Live Map'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </button>
                </div>

                {/* Popout Fullscreen Live Map Button */}
                <button
                  type="button"
                  onClick={() => {
                    setLiveMapTargetSessionId(null);
                    setIsLiveMapModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title={isKhmer ? 'បើកផែនទីពេញអេក្រង់' : 'Open Fullscreen Live Map'}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isKhmer ? 'ផែនទីពេញ' : 'Fullscreen'}</span>
                </button>

                {/* Refresh Action */}
                <button
                  type="button"
                  onClick={() => {
                    if (loadStaffAndAudits) loadStaffAndAudits();
                    showToast(isKhmer ? 'បានផ្ទុកទិន្នន័យ Session ឡើងវិញ' : 'Refreshed login sessions', 'info');
                  }}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                  title={isKhmer ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh sessions'}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* View Mode: Interactive Live Map vs Table View */}
            {sessionViewMode === 'map' ? (
              <LiveDeviceMap
                sessions={filteredSessions.length > 0 ? filteredSessions : loginSessions}
                focusedSessionId={inspectedSession?.id}
                className="border-0 rounded-none h-[640px]"
              />
            ) : (
              /* Sessions Table */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">{isKhmer ? 'បុគ្គលិក' : 'Team Member'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'ទីតាំងឧបករណ៍' : 'Device Location'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'អាសយដ្ឋាន IP' : 'Client IP Address'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'ឧបករណ៍ & OS' : 'Device & Platform'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានីយ & Resolution' : 'Station & Resolution'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'វិធីសាស្ត្រ Login' : 'Auth Method'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'ពេលវេលា Login' : 'Login Time'}</th>
                    <th className="py-3.5 px-4">{isKhmer ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="py-3.5 px-5 text-right">{isKhmer ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/50 text-stone-300">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-500 font-sans">
                        <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                          <Globe className="w-6 h-6 opacity-60" />
                        </div>
                        <p className="font-bold text-sm text-stone-300">
                          {isKhmer ? 'រកមិនឃើញប្រវត្តិ Login តាមលក្ខខណ្ឌ' : 'No login sessions match your filters'}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {isKhmer ? 'សូមសាកល្បងសម្អាតពាក្យស្វែងរក ឬចុចប៊ូតុងខាងក្រោមដើម្បីកំណត់តម្រងឡើងវិញ' : 'Try clearing your search query or click the button below to reset filters'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginSearchQuery('');
                            setLoginMethodFilter('ALL');
                            setLoginStatusFilter('ALL');
                            setLoginLocationFilter('ALL');
                            setLoginDeviceTypeFilter('ALL');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-lg hover:border-amber-400"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isKhmer ? 'កំណត់តម្រងឡើងវិញ (បង្ហាញ Session ទាំងអស់)' : 'Reset Filters (Show All Sessions)'}</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isCurrentActive = sess.userId === user?.id;
                      const isCopied = copiedSessionIp === sess.id;

                      return (
                        <tr key={sess.id} className="hover:bg-stone-800/30 transition-colors group">
                          {/* 1. Team Member */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                user={{
                                  name: sess.userName,
                                  role: sess.userRole,
                                  avatar: sess.userAvatar
                                }}
                                size="sm"
                                shape="rounded-xl"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-stone-100 text-xs sm:text-sm">
                                    {sess.userName}
                                  </span>
                                  {isCurrentActive && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                                      {isKhmer ? 'អ្នក' : 'You'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                                  {sess.userRole}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Device Location & Geolocation */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-rose-950/70 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
                                <MapPin className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate max-w-[190px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-xs text-stone-100 truncate">
                                    {sess.location || 'Phnom Penh, Cambodia 🇰🇭'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                                  <span className="truncate">{sess.isp || 'Smart Axiata / CamNet'}</span>
                                  {sess.mapsUrl && (
                                    <a
                                      href={sess.mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5 font-bold hover:underline shrink-0"
                                      title={isKhmer ? 'មើលលើផែនទី Google Maps' : 'View on Google Maps'}
                                    >
                                      <span>Map</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 3. Client IP Address */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-stone-100 block">
                                  {sess.ipAddress}
                                </span>
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded border font-sans ${
                                  sess.ipType === 'IPv4'
                                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                }`}>
                                  <span className="w-1 h-1 rounded-full bg-current" />
                                  <span>{sess.ipLabel || (sess.ipType === 'IPv4' ? 'Public IPv4' : 'Secure LAN')}</span>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopySessionIp(sess.ipAddress, sess.id)}
                                className="p-1 rounded-lg hover:bg-stone-800 text-stone-500 hover:text-stone-300 transition cursor-pointer"
                                title="Copy IP"
                              >
                                {isCopied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          {/* 4. Device & Platform */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {sess.deviceType === 'Phone' || sess.deviceType === 'Mobile' ? (
                                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/70 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs" title="Smartphone / Mobile Device">
                                  <Smartphone className="w-3.5 h-3.5" />
                                </div>
                              ) : sess.deviceType === 'Tablet' ? (
                                <div className="w-7 h-7 rounded-lg bg-sky-950/80 border border-sky-700/70 flex items-center justify-center text-sky-400 shrink-0 shadow-xs" title="Tablet / iPad">
                                  <Tablet className="w-3.5 h-3.5" />
                                </div>
                              ) : sess.deviceType === 'POS Touch Station' || sess.deviceType === 'POS Station' ? (
                                <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-700/70 flex items-center justify-center text-purple-400 shrink-0 shadow-xs" title="POS Station">
                                  <Terminal className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center text-amber-400 shrink-0" title="Desktop / Workstation">
                                  <Monitor className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="truncate max-w-[175px]">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-xs text-stone-200 block truncate">
                                    {sess.deviceModel || sess.os || 'Workstation'}
                                  </span>
                                  {(sess.deviceType === 'Phone' || sess.deviceType === 'Mobile') && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold shrink-0">
                                      📱 Phone
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-500 block truncate">
                                  {sess.browser || 'Browser'} • {sess.os}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 4. Station & Resolution */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-emerald-300 block">
                                {sess.terminalId || 'AROMA-POS-01'}
                              </span>
                              <span className="text-[10px] text-stone-500 block">
                                {sess.screen || '1920x1080'}
                              </span>
                            </div>
                          </td>

                          {/* 5. Auth Method */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase font-mono border ${
                              sess.loginMethod === 'FACE_BIOMETRIC'
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                                : sess.loginMethod === 'PIN'
                                ? 'bg-sky-950/80 text-sky-300 border-sky-800'
                                : sess.loginMethod === 'SCREEN_UNLOCK' || sess.loginMethod === 'SCREEN_HANDOVER'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                : 'bg-amber-950/80 text-amber-300 border-amber-800'
                            }`}>
                              {sess.loginMethod === 'FACE_BIOMETRIC' && <ScanFace className="w-3 h-3" />}
                              {sess.loginMethod === 'PIN' && <KeyRound className="w-3 h-3" />}
                              {sess.loginMethod === 'PASSWORD' && <Lock className="w-3 h-3" />}
                              {(sess.loginMethod === 'SCREEN_UNLOCK' || sess.loginMethod === 'SCREEN_HANDOVER') && <Shield className="w-3 h-3" />}
                              <span>{sess.loginMethod}</span>
                            </span>
                          </td>

                          {/* 6. Login Time */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-stone-400">
                            <div>
                              <span className="text-stone-200 font-bold block">
                                {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-stone-500 block">
                                {new Date(sess.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </td>

                          {/* 7. Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sess.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-stone-800 text-stone-400 border border-stone-700'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                sess.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                              }`} />
                              <span>{sess.status || 'ACTIVE'}</span>
                            </span>
                          </td>

                          {/* 8. Actions */}
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect Hardware / Specs Modal */}
                              <button
                                type="button"
                                onClick={() => setInspectedSession(sess)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                                title={isKhmer ? 'មើលព័ត៌មានលម្អិតឧបករណ៍' : 'View Full Device Specs'}
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>

                              {/* Terminate Session Button (If active) */}
                              {sess.status === 'ACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => handleTerminateSession(sess.id, sess.userName)}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-100 transition cursor-pointer"
                                  title={isKhmer ? 'បញ្ចប់ Session' : 'Terminate Session'}
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. DEVICE SPECS & SESSION INSPECTION MODAL
      ────────────────────────────────────────────────────────────── */}
      {inspectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
          <div className="w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-100">
                    {isKhmer ? 'ព័ត៌មានលម្អិតឧបករណ៍ & Session' : 'Device Security & Session Details'}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono">
                    ID: {inspectedSession.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSession(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs font-sans max-h-[75vh] overflow-y-auto">
              {/* User Identity Banner */}
              <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={{
                      name: inspectedSession.userName,
                      role: inspectedSession.userRole,
                      avatar: inspectedSession.userAvatar
                    }}
                    size="md"
                    shape="rounded-xl"
                  />
                  <div>
                    <p className="font-extrabold text-sm text-stone-100">{inspectedSession.userName}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {inspectedSession.userRole}
                    </span>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  inspectedSession.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    inspectedSession.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                  }`} />
                  <span>{inspectedSession.status}</span>
                </span>
              </div>

              {/* Device Physical Location & Geolocation Map Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border border-amber-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                        <span>{isKhmer ? 'ទីតាំងឧបករណ៍ & ភូមិសាស្ត្រ' : 'Device Geolocation & Physical Location'}</span>
                        <span className="text-xs">{inspectedSession.flag || '🇰🇭'}</span>
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        {isKhmer ? 'ផ្ទៀងផ្ទាត់ទីតាំងពិតរបស់ឧបករណ៍ដែល Login' : 'Verified device physical location & network provider'}
                      </p>
                    </div>
                  </div>

                  {inspectedSession.mapsUrl && (
                    <a
                      href={inspectedSession.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition"
                      title={isKhmer ? 'មើលលើផែនទី Google Maps' : 'Open in Google Maps'}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>{isKhmer ? 'មើលផែនទី' : 'Maps'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'ទីក្រុង / ប្រទេស' : 'City & Country'}
                    </span>
                    <span className="font-extrabold text-stone-100 text-xs block mt-0.5 truncate">
                      {inspectedSession.location || 'Phnom Penh, Cambodia 🇰🇭'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'កូអរដោនេ GPS' : 'GPS Coordinates'}
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-xs block mt-0.5 truncate">
                      {inspectedSession.latitude ? `${inspectedSession.latitude.toFixed(4)}° N, ${inspectedSession.longitude.toFixed(4)}° E` : '11.5564° N, 104.9282° E'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'អ្នកផ្គត់ផ្គង់អ៊ីនធឺណិត (ISP)' : 'Internet Service Provider'}
                    </span>
                    <span className="font-semibold text-cyan-300 text-xs block truncate mt-0.5">
                      {inspectedSession.isp || 'Smart Axiata / CamNet'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      {isKhmer ? 'តំបន់ពេលវេលា' : 'Timezone'}
                    </span>
                    <span className="font-mono font-bold text-stone-200 text-xs block mt-0.5 truncate">
                      Asia/Phnom_Penh (GMT+7)
                    </span>
                  </div>
                </div>

                {/* Styled Map Preview Card - Click to launch Interactive Live Map */}
                <div
                  onClick={() => {
                    setLiveMapTargetSessionId(inspectedSession.id);
                    setIsLiveMapModalOpen(true);
                  }}
                  className="relative h-22 rounded-xl overflow-hidden border border-stone-800 hover:border-amber-500/50 bg-stone-950 flex items-center justify-between px-4 group cursor-pointer transition shadow-inner"
                  title={isKhmer ? 'ចុចដើម្បីបើកផែនទីបន្តផ្ទាល់អន្តរកម្ម' : 'Click to view on interactive real-time map'}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(#38322a_1px,transparent_1px)] [background-size:12px_12px] opacity-70 group-hover:opacity-100 transition" />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition shrink-0">
                      <MapPin className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold text-stone-100 block truncate">
                        {inspectedSession.location || 'Phnom Penh, Cambodia 🇰🇭'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                        <span>{isKhmer ? 'ចុចដើម្បីបើកមើលលើផែនទីបន្តផ្ទាល់' : 'Click to view on real-time map'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 px-2.5 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-stone-950 font-extrabold text-[11px] flex items-center gap-1 shadow-lg transition shrink-0">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'ផែនទីផ្ទាល់' : 'Live Map'}</span>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Client IP Address</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-stone-100 text-xs">{inspectedSession.ipAddress}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {inspectedSession.ipType || 'IPv4'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Device Hardware</span>
                  <span className="font-bold text-stone-100 text-xs block truncate">{inspectedSession.deviceType || 'Desktop PC'}</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Operating System</span>
                  <span className="font-bold text-stone-100 text-xs block">{inspectedSession.os || 'Windows 11'}</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Web Client Browser</span>
                  <span className="font-bold text-stone-100 text-xs block truncate">{inspectedSession.browser || 'Chrome 124'}</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Terminal / Display</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs block">{inspectedSession.terminalId || 'AROMA-POS-01'}</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Resolution</span>
                  <span className="font-mono font-bold text-stone-100 text-xs block">{inspectedSession.screen || '1920x1080'}</span>
                </div>
              </div>

              {/* Login Timestamp & Method */}
              <div className="p-3 rounded-xl bg-stone-950/50 border border-stone-850 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 text-[11px]">Authentication Method:</span>
                  <span className="font-mono font-bold text-amber-400">{inspectedSession.loginMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 text-[11px]">Login Timestamp:</span>
                  <span className="font-mono text-stone-300 text-[11px]">
                    {new Date(inspectedSession.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 text-[11px]">Encryption & Protocol:</span>
                  <span className="font-mono text-emerald-400 text-[11px]">TLS v1.3 • AES-256 GCM</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-800 flex items-center justify-between bg-stone-950/80">
              {inspectedSession.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleTerminateSession(inspectedSession.id, inspectedSession.userName);
                    setInspectedSession(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បញ្ចប់ Session នេះ' : 'Terminate This Session'}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setInspectedSession(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition cursor-pointer"
              >
                {isKhmer ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. EDIT USER MODAL (CLEAN & MODERN)
      ────────────────────────────────────────────────────────────── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl overflow-hidden my-8 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-100">
                    {isKhmer ? `កែសម្រួលបុគ្គលិក: ${editingStaff.name}` : `Edit Team Member: ${editingStaff.name}`}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {isKhmer ? 'កែប្រែព័ត៌មានគណនី លេខកូដ PIN និងសិទ្ធិប្រើប្រាស់' : 'Update credentials, role permissions, and access status'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'អ៊ីមែលចូលប្រព័ន្ធ' : 'Email / Login'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+855 12 345 678"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'ពាក្យសម្ងាត់ Web' : 'Web Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 pr-9 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role, PIN, Wage & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'តួនាទី' : 'Assigned Role'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="CASHIER">CASHIER (POS Only)</option>
                    <option value="BARISTA">BARISTA (KDS Only)</option>
                    <option value="MANAGER">MANAGER (Overrides & Reports)</option>
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="SECURITY">SECURITY (Audits & Compliance)</option>
                    {customRoles.map((cr) => (
                      <option key={cr.id} value={cr.id}>{cr.title} (Custom)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] uppercase font-bold text-stone-400 block">
                      {isKhmer ? 'លេខកូដ PIN ៤ខ្ទង់' : '4-Digit PIN'} *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const rand = Math.floor(1000 + Math.random() * 9000).toString();
                        setFormData((prev) => ({ ...prev, pin: rand }));
                        showToast(`Quick PIN: ${rand}`, 'info');
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 font-semibold cursor-pointer"
                      title="Roll Random PIN"
                    >
                      <Shuffle className="w-2.5 h-2.5" />
                      <span>Roll</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500 text-center tracking-widest text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'ប្រាក់ឈ្នួល ($/ម៉ោង)' : 'Hourly Wage ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-stone-400 block mb-1">
                    {isKhmer ? 'ស្ថានភាព' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Photo & Avatar Section */}
              <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      user={{
                        ...formData,
                        avatar: formData.facePhoto || formData.avatar,
                        name: formData.name,
                        role: formData.role
                      }}
                      size="md"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-stone-200">
                        {isKhmer ? 'រូបថតបុគ្គលិក' : 'Employee Profile Picture'}
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        {formData.facePhoto || formData.avatar ? 'Real photo registered' : 'Initials avatar'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Biometric Face ID Scan */}
                    <button
                      type="button"
                      onClick={() => handleOpenFaceScan(editingStaff)}
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow border ${
                        formData.faceEnrolled
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-cyan-200 border-cyan-500/40'
                      }`}
                      title={formData.faceEnrolled ? 'Face ID Enrolled - Click to re-scan' : 'Enroll Face ID for this account'}
                    >
                      <ScanFace className="w-3.5 h-3.5" />
                      <span>
                        {formData.faceEnrolled 
                          ? (isKhmer ? 'Face ID រួចរាល់' : 'Re-scan Face') 
                          : (isKhmer ? 'ស្កេនមុខ Face ID' : 'Enroll Face ID')}
                      </span>
                    </button>

                    <label
                      htmlFor="staff-photo-edit-file"
                      className={`px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow ${
                        isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                    </label>
                    <input
                      id="staff-photo-edit-file"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    {(formData.facePhoto || formData.avatar) && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 bg-stone-900 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-700 text-stone-400 hover:text-rose-300 rounded-xl transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Feature Permissions Checkboxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-bold text-stone-400 block">
                    {isKhmer ? 'សិទ្ធិប្រើប្រាស់លម្អិត' : 'Granular Feature Permissions'} ({formData.permissions.length} of {SYSTEM_PERMISSIONS.length} Enabled)
                  </label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, permissions: SYSTEM_PERMISSIONS.map((p) => p.id) }))}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      {isKhmer ? 'ផ្តល់ទាំងអស់' : 'Grant All'}
                    </button>
                    <span className="text-stone-600">•</span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, permissions: ROLE_PERMISSIONS[formData.role]?.permissions || ['canAccessPos'] }))}
                      className="text-stone-400 hover:text-stone-200 font-semibold cursor-pointer"
                    >
                      {isKhmer ? 'កំណត់តាមលំនាំដើម' : 'Reset to Role Defaults'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {SYSTEM_PERMISSIONS.map((perm) => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <div
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/40 text-stone-200'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition ${
                          isChecked ? 'bg-amber-500 text-stone-950 font-bold' : 'border border-stone-600 bg-stone-900'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isChecked ? 'text-amber-300' : 'text-stone-300'}`}>
                            {perm.label}
                          </span>
                          <span className="text-[10px] text-stone-500 leading-tight block mt-0.5">
                            {perm.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
                >
                  {isKhmer ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (isKhmer ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. DELETE CONFIRMATION MODAL
      ────────────────────────────────────────────────────────────── */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-rose-900/60 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-100">
                  {isKhmer ? 'លុបគណនីបុគ្គលិក' : 'Delete User Account'}
                </h3>
                <p className="text-xs text-rose-300/80">
                  {isKhmer ? 'ការលុបជាអចិន្ត្រៃយ៍' : 'Permanent removal confirmation'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-2">
              <div className="flex items-center gap-3">
                <UserAvatar user={deleteConfirmStaff} size="md" />
                <div>
                  <span className="font-extrabold text-sm text-stone-100 block">{deleteConfirmStaff.name}</span>
                  <span className="text-xs text-stone-400 font-mono block">{deleteConfirmStaff.email}</span>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{deleteConfirmStaff.role}</span>
                </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed pt-2 border-t border-stone-800/80">
                {isKhmer 
                  ? 'តើអ្នកប្រាកដជាចង់លុបគណនីនេះមែនទេ? លេខកូដ PIN និងសិទ្ធិចូលប្រព័ន្ធនឹងត្រូវលុបចោលទាំងស្រុង។' 
                  : 'Are you sure you want to permanently delete this account? Their POS PIN, credentials, and access rights will be revoked.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteStaff}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : (isKhmer ? 'បញ្ជាក់ការលុប' : 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          11. CREATE USER MODAL & FACE SCANNER MODAL
      ────────────────────────────────────────────────────────────── */}
      <CreateUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={() => {
          if (loadStaffAndAudits) loadStaffAndAudits();
        }}
      />

      <FaceScannerModal
        isOpen={isFaceScannerOpen}
        onClose={() => setIsFaceScannerOpen(false)}
        mode="ENROLL"
        targetStaff={faceScanStaffTarget}
        onSuccess={handleFaceScanComplete}
      />

      {/* ─────────────────────────────────────────────────────────────
          12. REAL-TIME INTERACTIVE DEVICE GEOLOCATION MAP MODAL
      ────────────────────────────────────────────────────────────── */}
      {isLiveMapModalOpen && (
        <LiveDeviceMap
          sessions={loginSessions}
          focusedSessionId={liveMapTargetSessionId}
          isModal={true}
          isOpen={isLiveMapModalOpen}
          onClose={() => {
            setIsLiveMapModalOpen(false);
            setLiveMapTargetSessionId(null);
          }}
        />
      )}
    </div>
  );
};
