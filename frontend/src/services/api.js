import { INITIAL_PRODUCTS, INITIAL_ORDERS, DEMO_USERS, INITIAL_INGREDIENTS, CATEGORIES } from './coffeeData';
import { storage } from '../utils/storage';
import { checkFaceUniqueness } from '../utils/faceBiometrics';
import { getDeviceInfo, resolveClientIp, classifyIp, resolveClientLocation, getFullDeviceAuditSnapshot } from '../utils/deviceDetector';

const API_HOST = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '') 
  : '';
export const BASE_URL = API_HOST ? `${API_HOST}/api` : '/api';

const STORAGE_PRODUCTS_KEY = 'aromapos_products';
const STORAGE_ORDERS_KEY = 'aromapos_orders';
const STORAGE_USER_KEY = 'aromapos_current_user';
const STORAGE_INGREDIENTS_KEY = 'aromapos_ingredients';
const STORAGE_CATEGORIES_KEY = 'aromapos_categories';

export const getStoredCategories = () => {
  try {
    const raw = storage.getItem(STORAGE_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return CATEGORIES;
};

export const saveStoredCategories = (categories) => {
  try {
    storage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {}
};

export const getStoredProducts = () => {
  try {
    const raw = storage.getItem(STORAGE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
  return INITIAL_PRODUCTS;
};

export const saveStoredProducts = (products) => {
  try {
    storage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
};

export const getStoredIngredients = () => {
  try {
    const raw = storage.getItem(STORAGE_INGREDIENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
  return INITIAL_INGREDIENTS;
};

export const saveStoredIngredients = (ingredients) => {
  try {
    storage.setItem(STORAGE_INGREDIENTS_KEY, JSON.stringify(ingredients));
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
};

export const getStoredOrders = () => {
  try {
    const raw = storage.getItem(STORAGE_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
  return INITIAL_ORDERS;
};

export const saveStoredOrders = (orders) => {
  try {
    storage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
};

export const isRealAvatar = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('ui-avatars.com') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('dummyimage')
  ) {
    return false;
  }
  return true;
};

export const sanitizeUserAvatar = (user) => {
  if (!user || typeof user !== 'object') return user;
  const realAvatar = isRealAvatar(user.avatar) ? user.avatar : '';
  const realFacePhoto = isRealAvatar(user.facePhoto) ? user.facePhoto : (realAvatar || '');
  return {
    ...user,
    avatar: realAvatar,
    facePhoto: realFacePhoto
  };
};

export const getStoredUser = () => {
  try {
    const raw = storage.getItem(STORAGE_USER_KEY);
    if (raw) return sanitizeUserAvatar(JSON.parse(raw));
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
  return null;
};

export const saveStoredUser = (user) => {
  try {
    if (user) {
      storage.setItem(STORAGE_USER_KEY, JSON.stringify(sanitizeUserAvatar(user)));
    } else {
      storage.removeItem(STORAGE_USER_KEY);
    }
  } catch (e) {
    console.warn('LocalStorage error', e);
  }
};

export const getStoredStaff = () => {
  try {
    const raw = storage.getItem('aromapos_staff_roster');
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        // Ensure admin user has updated password/pin 77778888
        const updated = list.map((u) => {
          if (u.email === 'admin@cafe.com' || u.role === 'ADMIN') {
            return { ...u, password: '77778888', pin: '77778888' };
          }
          return u;
        });
        // Ensure standard security user is present in roster
        const hasSecurity = updated.some((u) => u.email === 'security@cafe.com' || u.role === 'SECURITY');
        if (!hasSecurity) {
          const securityUser = DEMO_USERS.find((u) => u.id === 'usr-5');
          if (securityUser) {
            updated.unshift(securityUser);
          }
        }
        saveStoredStaff(updated);
        return updated.map(sanitizeUserAvatar);
      }
    }
  } catch (e) {}
  return DEMO_USERS.map(sanitizeUserAvatar);
};

export const saveStoredStaff = (staff) => {
  try {
    const sanitized = Array.isArray(staff) ? staff.map(sanitizeUserAvatar) : staff;
    storage.setItem('aromapos_staff_roster', JSON.stringify(sanitized));
  } catch (e) {}
};

export const getStoredAuditLogs = () => {
  try {
    const raw = storage.getItem('aromapos_audit_logs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: "aud-1",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      userId: "usr-4",
      userName: "Chloe Chen",
      userRole: "CASHIER",
      action: "VOID_ITEM",
      details: "Voided 1x Smoked Spanish Cortado ($4.25) due to customer change of mind",
      authorizedBy: "Sophia Bennett (Store Manager)",
      amount: 4.25
    },
    {
      id: "aud-2",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      userId: "usr-4",
      userName: "Chloe Chen",
      userRole: "CASHIER",
      action: "DISCOUNT_OVERRIDE",
      details: "Applied 50% Employee VIP Courtesy Discount on ticket #ORD-1049",
      authorizedBy: "Marcus Thorne (Administrator)",
      amount: 12.50
    },
    {
      id: "aud-3",
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      userId: "usr-1",
      userName: "Liam Vance",
      userRole: "BARISTA",
      action: "SHIFT_CLOSE",
      details: "Morning register drawer reconciliation float balanced",
      authorizedBy: "Self-Verified",
      amount: 0.00
    }
  ];
};

export const saveStoredAuditLogs = (logs) => {
  try {
    storage.setItem('aromapos_audit_logs', JSON.stringify(logs));
  } catch (e) {}
};

export const getInitialLoginSessions = () => {
  const now = Date.now();
  return [
    {
      id: "sess-phone-101",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      userAvatar: "",
      ipAddress: "103.216.54.18",
      ipType: "IPv4",
      ipLabel: "Smart 5G Cellular",
      brand: "Apple",
      deviceType: "Phone",
      deviceModel: "iPhone 16 Pro (iOS 18)",
      isDemo: true,
      isReal: false,
      os: "iOS 18.1",
      browser: "Mobile Safari 18.0",
      screen: "393x852",
      terminalId: "MOB-PHONE-01",
      location: "Phnom Penh, Cambodia 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 11.5564,
      longitude: 104.9282,
      isp: "Smart Axiata 5G Mobile Network",
      mapsUrl: "https://www.google.com/maps?q=11.5564,104.9282",
      loginMethod: "PASSWORD",
      status: "ACTIVE",
      timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString()
    },
    {
      id: "sess-phone-102",
      userId: "usr-2",
      userName: "Sophia Bennett",
      userRole: "MANAGER",
      userAvatar: "",
      ipAddress: "203.144.92.45",
      ipType: "IPv4",
      ipLabel: "Cellcard 4G LTE",
      brand: "Samsung",
      deviceType: "Phone",
      deviceModel: "Samsung Galaxy S24 Ultra",
      isDemo: true,
      isReal: false,
      os: "Android 14",
      browser: "Chrome Mobile 124",
      screen: "412x915",
      terminalId: "MOB-PHONE-02",
      location: "Siem Reap, Cambodia 🇰🇭",
      city: "Siem Reap",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 13.3671,
      longitude: 103.8448,
      isp: "CamGSM (Cellcard Mobile Network)",
      mapsUrl: "https://www.google.com/maps?q=13.3671,103.8448",
      loginMethod: "PIN",
      status: "ACTIVE",
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      lastActive: new Date(now - 3 * 60 * 1000).toISOString()
    },
    {
      id: "sess-1001",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      userAvatar: "",
      ipAddress: "103.216.54.12",
      ipType: "IPv4",
      ipLabel: "Public IPv4",
      brand: "Microsoft Windows",
      deviceType: "Desktop",
      deviceModel: "Windows 11 (Desktop PC)",
      isDemo: true,
      isReal: false,
      os: "Windows 11",
      browser: "Google Chrome 124",
      screen: "1920x1080",
      terminalId: "AROMA-POS-01",
      location: "Phnom Penh, Cambodia 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 11.5564,
      longitude: 104.9282,
      isp: "Smart Axiata Co., Ltd.",
      mapsUrl: "https://www.google.com/maps?q=11.5564,104.9282",
      loginMethod: "PASSWORD",
      status: "ACTIVE",
      timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString()
    },
    {
      id: "sess-1002",
      userId: "usr-4",
      userName: "Chloe Chen",
      userRole: "CASHIER",
      userAvatar: "",
      ipAddress: "192.168.1.105",
      ipType: "LAN",
      ipLabel: "Secure LAN (Station #01)",
      brand: "Sunmi POS",
      deviceType: "POS Touch Station",
      deviceModel: "Windows 10 (POS Kiosk)",
      isDemo: true,
      isReal: false,
      os: "Windows 10",
      browser: "Google Chrome 122",
      screen: "1920x1080",
      terminalId: "AROMA-POS-01",
      location: "BKK1 Store, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 11.5529,
      longitude: 104.9244,
      isp: "Store POS LAN / CamNet",
      mapsUrl: "https://www.google.com/maps?q=11.5529,104.9244",
      loginMethod: "PIN",
      status: "ACTIVE",
      timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
      lastActive: new Date(now - 10 * 60 * 1000).toISOString()
    },
    {
      id: "sess-1003",
      userId: "usr-2",
      userName: "Sophia Bennett",
      userRole: "MANAGER",
      userAvatar: "",
      ipAddress: "192.168.1.102",
      ipType: "LAN",
      ipLabel: "Secure LAN (Manager Pad)",
      brand: "Apple",
      deviceType: "Tablet",
      deviceModel: "iPad Pro 12.9 (Tablet)",
      isDemo: true,
      isReal: false,
      os: "iPadOS",
      browser: "Apple Safari 17",
      screen: "1024x768",
      terminalId: "AROMA-PAD-02",
      location: "Toul Kork Branch, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 11.5732,
      longitude: 104.8988,
      isp: "SINET Cambodia Fiber",
      mapsUrl: "https://www.google.com/maps?q=11.5732,104.8988",
      loginMethod: "PIN",
      status: "CLOSED",
      timestamp: new Date(now - 140 * 60 * 1000).toISOString(),
      lastActive: new Date(now - 45 * 60 * 1000).toISOString()
    },
    {
      id: "sess-1004",
      userId: "usr-1",
      userName: "Liam Vance",
      userRole: "BARISTA",
      userAvatar: "",
      ipAddress: "192.168.1.108",
      ipType: "LAN",
      ipLabel: "Secure LAN (Kitchen KDS)",
      brand: "Samsung",
      deviceType: "Tablet",
      deviceModel: "Android Tablet 10\"",
      isDemo: true,
      isReal: false,
      os: "Android 13",
      browser: "Google Chrome 121",
      screen: "1280x800",
      terminalId: "AROMA-KDS-01",
      location: "BKK1 Kitchen Station 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 11.5529,
      longitude: 104.9244,
      isp: "Store POS LAN",
      mapsUrl: "https://www.google.com/maps?q=11.5529,104.9244",
      loginMethod: "FACE_BIOMETRIC",
      status: "CLOSED",
      timestamp: new Date(now - 220 * 60 * 1000).toISOString(),
      lastActive: new Date(now - 120 * 60 * 1000).toISOString()
    },
    {
      id: "sess-1005",
      userId: "usr-5",
      userName: "Security Officer",
      userRole: "SECURITY",
      userAvatar: "",
      ipAddress: "103.216.54.88",
      ipType: "IPv4",
      ipLabel: "Public IPv4 (HQ VPN)",
      brand: "Apple",
      deviceType: "Desktop",
      deviceModel: "macOS Sonoma (MacBook Pro)",
      isDemo: true,
      isReal: false,
      os: "macOS",
      browser: "Apple Safari 17",
      screen: "2560x1440",
      terminalId: "SEC-STATION-HQ",
      location: "Siem Reap Regional Office 🇰🇭",
      city: "Siem Reap",
      country: "Cambodia",
      countryCode: "KH",
      flag: "🇰🇭",
      latitude: 13.3633,
      longitude: 103.8564,
      isp: "Metfone Viettel Cambodia",
      mapsUrl: "https://www.google.com/maps?q=13.3633,103.8564",
      loginMethod: "PASSWORD",
      status: "CLOSED",
      timestamp: new Date(now - 340 * 60 * 1000).toISOString(),
      lastActive: new Date(now - 260 * 60 * 1000).toISOString()
    }
  ];
};

export const getStoredLoginSessions = () => {
  try {
    const raw = storage.getItem('aromapos_login_sessions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return getInitialLoginSessions();
};

export const saveStoredLoginSessions = (sessions) => {
  try {
    storage.setItem('aromapos_login_sessions', JSON.stringify(sessions));
  } catch (e) {}
};

export const recordLoginSession = async (user, loginMethod = 'PASSWORD', clientIpOverride = null, deviceInfoOverride = null, locationOverride = null) => {
  if (!user) return null;
  try {
    const liveIp = clientIpOverride || await resolveClientIp();
    const info = deviceInfoOverride || getDeviceInfo();
    const loc = locationOverride || await resolveClientLocation(liveIp);
    const classification = classifyIp(liveIp);

    const newSession = {
      id: "sess-" + Date.now(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userAvatar: user.avatar || user.facePhoto || '',
      ipAddress: liveIp,
      ipType: classification.type,
      ipLabel: info.deviceType === 'Phone' ? 'Cellular / Mobile 4G/5G' : classification.label,
      brand: info.brand || 'Apple',
      deviceType: info.deviceType || 'Desktop',
      deviceModel: info.deviceModel || `${info.brand || 'Universal'} (${info.deviceType})`,
      os: info.os || 'Unknown OS',
      browser: info.browser || 'Web Browser',
      screen: info.screen || '1920x1080',
      terminalId: info.terminalId || 'AROMA-POS-01',
      loginMethod,
      location: loc.displayLocation || 'Phnom Penh, Cambodia 🇰🇭',
      city: loc.city || 'Phnom Penh',
      country: loc.country || 'Cambodia',
      countryCode: loc.countryCode || 'KH',
      flag: loc.flag || '🇰🇭',
      latitude: loc.latitude || 11.5564,
      longitude: loc.longitude || 104.9282,
      isp: loc.isp || 'Smart Axiata / CamNet',
      mapsUrl: loc.mapsUrl || `https://www.google.com/maps?q=${loc.latitude || 11.5564},${loc.longitude || 104.9282}`,
      status: 'ACTIVE',
      isDemo: false,
      isReal: true,
      timestamp: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    const existing = getStoredLoginSessions();
    const updatedSessions = [newSession, ...existing.filter((s) => s.id !== newSession.id)].slice(0, 100);
    saveStoredLoginSessions(updatedSessions);

    // Cross-Device Server Broadcast: Ensure mobile logins sync with all connected devices
    fetch(`${BASE_URL}/auth/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSession)
    }).catch(() => {});

    // Update staff roster with lastLogin details
    const staffList = getStoredStaff();
    const updatedStaff = staffList.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          lastLoginIp: liveIp,
          lastLoginDevice: `${info.deviceType} • ${info.os} (${info.browser})`,
          lastLoginLocation: newSession.location,
          lastLoginAt: newSession.timestamp,
          lastLoginMethod
        };
      }
      return u;
    });
    saveStoredStaff(updatedStaff);

    // Update current stored user if matching
    const currentStored = getStoredUser();
    if (currentStored && currentStored.id === user.id) {
      saveStoredUser({
        ...currentStored,
        lastLoginIp: liveIp,
        lastLoginDevice: `${info.deviceType} • ${info.os} (${info.browser})`,
        lastLoginLocation: newSession.location,
        lastLoginAt: newSession.timestamp,
        lastLoginMethod
      });
    }

    return newSession;
  } catch (e) {
    console.warn('Error recording login session:', e);
    return null;
  }
};

export const terminateLoginSession = (sessionId) => {
  try {
    const sessions = getStoredLoginSessions();
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, status: 'CLOSED', lastActive: new Date().toISOString() } : s));
    saveStoredLoginSessions(updated);
    return updated;
  } catch (e) {
    return getStoredLoginSessions();
  }
};

export const clearLoginSessions = () => {
  try {
    storage.removeItem('aromapos_login_sessions');
  } catch (e) {}
};

export const clearDemoLoginSessions = () => {
  try {
    const sessions = getStoredLoginSessions();
    const realSessions = sessions.filter((s) => !s.isDemo && s.isDemo !== true);
    saveStoredLoginSessions(realSessions);
    fetch(`${BASE_URL}/auth/sessions/demo`, { method: 'DELETE' }).catch(() => {});
    return realSessions;
  } catch (e) {
    return [];
  }
};

export const restoreDemoLoginSessions = () => {
  try {
    const existing = getStoredLoginSessions();
    const demoSessions = getInitialLoginSessions();
    const realOnly = existing.filter((s) => !s.isDemo && s.isDemo !== true);
    const combined = [...realOnly, ...demoSessions];
    saveStoredLoginSessions(combined);
    return combined;
  } catch (e) {
    return getInitialLoginSessions();
  }
};

export const getStoredDeviceTravelBreadcrumbs = () => {
  try {
    const raw = storage.getItem('aromapos_device_travel_breadcrumbs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const now = Date.now();
  return [
    {
      id: "tb-101",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      deviceId: "POS-STATION-01",
      deviceInfo: "Windows 11 Desktop",
      ipAddress: "103.216.54.12",
      location: "BKK1 Flagship Store, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      latitude: 11.5529,
      longitude: 104.9248,
      speed: 0,
      accuracy: 5,
      isp: "Smart Axiata Co., Ltd.",
      activity: "LOGIN",
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "tb-102",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      deviceId: "Manager Tablet",
      deviceInfo: "iPad Pro 12.9",
      ipAddress: "103.216.54.15",
      location: "Norodom Blvd In-Transit, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      latitude: 11.5620,
      longitude: 104.9290,
      speed: 32,
      accuracy: 8,
      isp: "Cellcard 4G LTE",
      activity: "MOVING",
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "tb-103",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      deviceId: "Manager Tablet",
      deviceInfo: "iPad Pro 12.9",
      ipAddress: "103.216.54.22",
      location: "Riverside Roastery, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      latitude: 11.5714,
      longitude: 104.9312,
      speed: 0,
      accuracy: 4,
      isp: "CamNet Broadband",
      activity: "CHECKPOINT",
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "tb-104",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      deviceId: "Manager Tablet",
      deviceInfo: "iPad Pro 12.9",
      ipAddress: "103.216.54.30",
      location: "Russian Blvd In-Transit, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      latitude: 11.5680,
      longitude: 104.9120,
      speed: 28,
      accuracy: 9,
      isp: "Smart Axiata 5G",
      activity: "MOVING",
      timestamp: new Date(now - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "tb-105",
      userId: "usr-3",
      userName: "Marcus Thorne",
      userRole: "ADMIN",
      deviceId: "POS-STATION-02",
      deviceInfo: "Windows 11 POS Terminal",
      ipAddress: "103.216.54.88",
      location: "Tuol Kork Branch, Phnom Penh 🇰🇭",
      city: "Phnom Penh",
      country: "Cambodia",
      latitude: 11.5739,
      longitude: 104.8985,
      speed: 0,
      accuracy: 3.5,
      isp: "SINET Cambodia Fiber",
      activity: "LOGIN",
      timestamp: new Date(now - 15 * 60 * 1000).toISOString()
    }
  ];
};

export const saveStoredDeviceTravelBreadcrumbs = (crumbs) => {
  try {
    storage.setItem('aromapos_device_travel_breadcrumbs', JSON.stringify(crumbs));
  } catch (e) {}
};

export const addStoredDeviceTravelBreadcrumb = (crumb) => {
  const existing = getStoredDeviceTravelBreadcrumbs();
  const updated = [...existing, { ...crumb, id: crumb.id || 'tb-' + Date.now(), timestamp: crumb.timestamp || new Date().toISOString() }].slice(-500);
  saveStoredDeviceTravelBreadcrumbs(updated);
  return updated;
};

export const api = {
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const p = String(password || '').trim();
    const liveAudit = await getFullDeviceAuditSnapshot();
    const liveIp = liveAudit.ipAddress;
    const devInfo = { ...liveAudit, deviceSummary: `${liveAudit.os} (${liveAudit.browser})` };
    const liveLoc = { ...liveAudit, displayLocation: liveAudit.location };

    // 1. Instant local authentication (0ms response, immune to sleeping server or 401s)
    const staffList = getStoredStaff();
    const found = staffList.find(
      (u) => 
        u.email.toLowerCase() === cleanEmail ||
        u.email.toLowerCase() === `${cleanEmail}@cafe.com` ||
        (cleanEmail === 'admin' && u.role === 'ADMIN') ||
        (cleanEmail === 'manager' && u.role === 'MANAGER') ||
        (cleanEmail === 'cashier' && u.role === 'CASHIER') ||
        (cleanEmail === 'barista' && u.role === 'BARISTA')
    );

    if (found) {
      const isMatch = 
        (found.password && p === found.password) ||
        (found.pin && p === found.pin) ||
        (found.pinCode && p === found.pinCode);

      if (isMatch) {
        await recordLoginSession(found, 'PASSWORD', liveIp, devInfo, liveLoc);
        addStoredDeviceTravelBreadcrumb({
          userId: found.id,
          userName: found.name,
          userRole: found.role,
          deviceId: liveAudit.terminalId || 'POS-DEV',
          deviceInfo: devInfo.deviceSummary,
          ipAddress: liveIp,
          location: liveAudit.location,
          latitude: liveAudit.latitude,
          longitude: liveAudit.longitude,
          speed: liveAudit.speed || 0,
          accuracy: liveAudit.accuracy || 10,
          isp: liveAudit.isp,
          activity: 'LOGIN',
          timestamp: new Date().toISOString()
        });

        const updatedFound = {
          ...found,
          lastLoginIp: liveIp,
          lastLoginDevice: devInfo.deviceSummary,
          lastLoginLocation: liveLoc.displayLocation,
          lastLoginLatitude: liveAudit.latitude,
          lastLoginLongitude: liveAudit.longitude,
          lastLoginIsp: liveAudit.isp,
          lastLoginAt: new Date().toISOString(),
          lastLoginMethod: 'PASSWORD'
        };
        saveStoredUser(updatedFound);
        try {
          const logEntry = {
            id: 'aud-' + Date.now(),
            timestamp: new Date().toISOString(),
            userId: found.id,
            userName: found.name,
            userRole: found.role,
            action: 'LOGIN_SUCCESS',
            details: `User ${found.name} (${found.role}) authenticated securely from IP ${liveIp} [${liveLoc.displayLocation}] via ${devInfo.deviceSummary}`,
            authorizedBy: 'Credential-Auth',
            amount: 0,
            ipAddress: liveIp,
            deviceInfo: devInfo.deviceSummary,
            location: liveLoc.displayLocation,
            loginMethod: 'PASSWORD'
          };
          saveStoredAuditLogs([logEntry, ...getStoredAuditLogs()]);
        } catch (e) {}

        // Non-blocking background sync with backend if online
        try {
          fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: found.email,
              password: p,
              ipAddress: liveIp,
              deviceInfo: devInfo.deviceSummary,
              location: liveLoc.displayLocation,
              latitude: liveAudit.latitude,
              longitude: liveAudit.longitude,
              isp: liveAudit.isp,
              speed: liveAudit.speed,
              accuracy: liveAudit.accuracy
            })
          }).catch(() => {});
        } catch (e) {}

        return { success: true, user: updatedFound, token: 'local-token-' + found.id, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
      }

      try {
        const failLog = {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toISOString(),
          userId: found.id,
          userName: found.name,
          userRole: found.role,
          action: 'LOGIN_FAILED',
          details: `Incorrect password attempt for user ${found.email} from IP ${liveIp} [${liveLoc.displayLocation}]`,
          authorizedBy: 'Security-Shield',
          amount: 0,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          loginMethod: 'PASSWORD'
        };
        saveStoredAuditLogs([failLog, ...getStoredAuditLogs()]);
      } catch (e) {}
      throw new Error('Incorrect password. Please enter your valid credentials.');
    }

    // 2. Fallback to server if account is not found in local cache
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          latitude: liveAudit.latitude,
          longitude: liveAudit.longitude,
          isp: liveAudit.isp,
          speed: liveAudit.speed,
          accuracy: liveAudit.accuracy
        })
      });
      if (res.ok) {
        const data = await res.json();
        await recordLoginSession(data.user, 'PASSWORD', liveIp, devInfo, liveLoc);
        saveStoredUser(data.user);
        return { success: true, user: data.user, token: data.token, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
      }
    } catch (err) {}

    throw new Error('No registered staff account found with this email.');
  },

  async pinLogin(pin) {
    const p = (pin || '').trim();
    const liveAudit = await getFullDeviceAuditSnapshot();
    const liveIp = liveAudit.ipAddress;
    const devInfo = { ...liveAudit, deviceSummary: `${liveAudit.os} (${liveAudit.browser})` };
    const liveLoc = { ...liveAudit, displayLocation: liveAudit.location };
    const staffList = getStoredStaff();
    const found = staffList.find((u) => 
      (u.pin && u.pin === p) || 
      (u.pinCode && u.pinCode === p)
    );
    if (found) {
      await recordLoginSession(found, 'PIN', liveIp, devInfo, liveLoc);
      addStoredDeviceTravelBreadcrumb({
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        deviceId: liveAudit.terminalId || 'POS-DEV',
        deviceInfo: devInfo.deviceSummary,
        ipAddress: liveIp,
        location: liveAudit.location,
        latitude: liveAudit.latitude,
        longitude: liveAudit.longitude,
        speed: liveAudit.speed || 0,
        accuracy: liveAudit.accuracy || 10,
        isp: liveAudit.isp,
        activity: 'PIN_LOGIN',
        timestamp: new Date().toISOString()
      });

      const updatedFound = {
        ...found,
        lastLoginIp: liveIp,
        lastLoginDevice: devInfo.deviceSummary,
        lastLoginLocation: liveLoc.displayLocation,
        lastLoginLatitude: liveAudit.latitude,
        lastLoginLongitude: liveAudit.longitude,
        lastLoginIsp: liveAudit.isp,
        lastLoginAt: new Date().toISOString(),
        lastLoginMethod: 'PIN'
      };
      saveStoredUser(updatedFound);
      try {
        const logEntry = {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toISOString(),
          userId: found.id,
          userName: found.name,
          userRole: found.role,
          action: 'PIN_LOGIN_SUCCESS',
          details: `POS Terminal unlocked with PIN by ${found.name} (${found.role}) from IP ${liveIp} [${liveLoc.displayLocation}]`,
          authorizedBy: 'Station-PIN',
          amount: 0,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          loginMethod: 'PIN'
        };
        saveStoredAuditLogs([logEntry, ...getStoredAuditLogs()]);
      } catch (e) {}

      try {
        fetch(`${BASE_URL}/auth/pin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin: p,
            ipAddress: liveIp,
            deviceInfo: devInfo.deviceSummary,
            location: liveLoc.displayLocation,
            latitude: liveAudit.latitude,
            longitude: liveAudit.longitude,
            isp: liveAudit.isp,
            speed: liveAudit.speed,
            accuracy: liveAudit.accuracy
          })
        }).catch(() => {});
      } catch (e) {}
      return { success: true, user: updatedFound, token: 'local-token-' + found.id, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/pin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: p,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          latitude: liveAudit.latitude,
          longitude: liveAudit.longitude,
          isp: liveAudit.isp,
          speed: liveAudit.speed,
          accuracy: liveAudit.accuracy
        })
      });
      if (res.ok) {
        const data = await res.json();
        await recordLoginSession(data.user, 'PIN', liveIp, devInfo, liveLoc);
        saveStoredUser(data.user);
        return { success: true, user: data.user, token: data.token, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
      }
    } catch (e) {}

    throw new Error('Invalid 4-digit PIN code.');
  },

  async managerOverride({ managerPin, action, details, cashierId, cashierName, amount = 0 }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/manager-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerPin, action, details, cashierId, cashierName, amount })
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        return data;
      }
      throw new Error(data.message || 'Manager authorization rejected.');
    } catch (e) {
      if (e.message && e.message.includes('Manager authorization rejected')) throw e;
    }

    // Local fallback
    const staffList = getStoredStaff();
    const mp = managerPin.trim();
    const authorizer = staffList.find((u) => 
      (u.pin && u.pin === mp) || 
      (u.pinCode && u.pinCode === mp)
    );
    if (!authorizer) {
      throw new Error('Invalid Manager PIN. Access Denied.');
    }
    if (authorizer.role !== 'MANAGER' && authorizer.role !== 'ADMIN' && authorizer.role !== 'SECURITY') {
      throw new Error(`Unauthorized Role: ${authorizer.role}. Only Managers, Admins, and Security Officers can authorize overrides.`);
    }

    const logEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: cashierId || 'usr-4',
      userName: cashierName || 'Cashier',
      userRole: 'CASHIER',
      action: action || 'MANAGER_OVERRIDE',
      details: details || 'Manager override authorized',
      authorizedBy: `${authorizer.name} (${authorizer.role})`,
      amount: amount || 0
    };
    const existingLogs = getStoredAuditLogs();
    saveStoredAuditLogs([logEntry, ...existingLogs]);

    return {
      authorized: true,
      managerName: authorizer.name,
      managerRole: authorizer.role,
      timestamp: logEntry.timestamp,
      message: `Action authorized by ${authorizer.name} (${authorizer.role})`,
      auditId: logEntry.id
    };
  },

  async faceLogin(staffId) {
    const liveAudit = await getFullDeviceAuditSnapshot();
    const liveIp = liveAudit.ipAddress;
    const devInfo = { ...liveAudit, deviceSummary: `${liveAudit.os} (${liveAudit.browser})` };
    const liveLoc = { ...liveAudit, displayLocation: liveAudit.location };
    try {
      const res = await fetch(`${BASE_URL}/auth/face-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          latitude: liveAudit.latitude,
          longitude: liveAudit.longitude,
          isp: liveAudit.isp,
          speed: liveAudit.speed,
          accuracy: liveAudit.accuracy
        })
      });
      if (res.ok) {
        const data = await res.json();
        await recordLoginSession(data.user, 'FACE_BIOMETRIC', liveIp, devInfo, liveLoc);
        saveStoredUser(data.user);
        return { success: true, user: data.user, token: data.token, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
      }
    } catch (e) {}

    const staffList = getStoredStaff();
    const found = staffList.find((u) => u.id === staffId || u.name.toLowerCase() === (staffId || '').toLowerCase());
    if (found) {
      await recordLoginSession(found, 'FACE_BIOMETRIC', liveIp, devInfo, liveLoc);
      addStoredDeviceTravelBreadcrumb({
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        deviceId: liveAudit.terminalId || 'POS-DEV',
        deviceInfo: devInfo.deviceSummary,
        ipAddress: liveIp,
        location: liveAudit.location,
        latitude: liveAudit.latitude,
        longitude: liveAudit.longitude,
        speed: liveAudit.speed || 0,
        accuracy: liveAudit.accuracy || 10,
        isp: liveAudit.isp,
        activity: 'FACE_LOGIN',
        timestamp: new Date().toISOString()
      });

      const updatedFound = {
        ...found,
        lastLoginIp: liveIp,
        lastLoginDevice: devInfo.deviceSummary,
        lastLoginLocation: liveLoc.displayLocation,
        lastLoginLatitude: liveAudit.latitude,
        lastLoginLongitude: liveAudit.longitude,
        lastLoginIsp: liveAudit.isp,
        lastLoginAt: new Date().toISOString(),
        lastLoginMethod: 'FACE_BIOMETRIC'
      };
      saveStoredUser(updatedFound);
      try {
        const logEntry = {
          id: 'aud-' + Date.now(),
          timestamp: new Date().toISOString(),
          userId: found.id,
          userName: found.name,
          userRole: found.role,
          action: 'FACE_LOGIN_SUCCESS',
          details: `Touchless Face ID biometrics verified for ${found.name} (${found.role}) from IP ${liveIp} [${liveLoc.displayLocation}]`,
          authorizedBy: 'Biometric-FaceID',
          amount: 0,
          ipAddress: liveIp,
          deviceInfo: devInfo.deviceSummary,
          location: liveLoc.displayLocation,
          loginMethod: 'FACE_BIOMETRIC'
        };
        saveStoredAuditLogs([logEntry, ...getStoredAuditLogs()]);
      } catch (e) {}
      return { success: true, user: updatedFound, token: 'local-token-' + found.id, ipAddress: liveIp, deviceInfo: devInfo, location: liveLoc };
    }

    throw new Error('No enrolled Face ID profile found matching this identity.');
  },

  async faceOverride({ managerId, action, details, cashierId, cashierName, amount = 0 }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/face-override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId, action, details, cashierId, cashierName, amount })
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        return data;
      }
      throw new Error(data.message || 'Face override rejected.');
    } catch (e) {
      if (e.message && e.message.includes('rejected')) throw e;
    }

    const staffList = getStoredStaff();
    const authorizer = staffList.find((u) => u.id === managerId);
    if (!authorizer || (authorizer.role !== 'MANAGER' && authorizer.role !== 'ADMIN')) {
      throw new Error('Only Managers and Admins can authorize overrides.');
    }

    const logEntry = {
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: cashierId || 'usr-4',
      userName: cashierName || 'Cashier',
      userRole: 'CASHIER',
      action: action || 'FACE_OVERRIDE',
      details: (details || 'Manager override') + ' [Biometric Face ID Scan]',
      authorizedBy: `${authorizer.name} (${authorizer.role}) [Face ID]`,
      amount: amount || 0
    };
    const existingLogs = getStoredAuditLogs();
    saveStoredAuditLogs([logEntry, ...existingLogs]);

    return {
      authorized: true,
      managerName: authorizer.name,
      managerRole: authorizer.role,
      timestamp: logEntry.timestamp,
      message: `Action authorized via Face ID by ${authorizer.name} (${authorizer.role})`,
      auditId: logEntry.id
    };
  },

  async enrollFace(staffId, facePhoto, faceHash = '', faceBiometrics = null) {
    try {
      const res = await fetch(`${BASE_URL}/auth/staff/${staffId}/enroll-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facePhoto,
          faceHash,
          faceBiometrics: faceBiometrics ? (typeof faceBiometrics === 'string' ? faceBiometrics : JSON.stringify(faceBiometrics)) : ''
        })
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        const conflictErr = new Error(data?.message || 'This face is already registered to another account. One face can only be used by 1 account.');
        conflictErr.conflict = true;
        conflictErr.existingStaffName = data?.existingStaffName;
        conflictErr.existingStaffRole = data?.existingStaffRole;
        throw conflictErr;
      }
      if (res.ok && data) {
        return data;
      }
    } catch (e) {
      if (e.conflict) throw e;
    }

    const staffList = getStoredStaff();
    // Enforce strict 1 face = 1 account check in local storage fallback
    const features = faceBiometrics || (faceHash ? { hash: faceHash } : null);
    if (features) {
      const uniqueness = checkFaceUniqueness(features, staffId, staffList);
      if (!uniqueness.isUnique && uniqueness.conflictingStaff) {
        const conflict = uniqueness.conflictingStaff;
        const conflictErr = new Error(`This face is already registered to ${conflict.name} (${conflict.role}). One face can only be used by 1 account.`);
        conflictErr.conflict = true;
        conflictErr.existingStaffName = conflict.name;
        conflictErr.existingStaffRole = conflict.role;
        throw conflictErr;
      }
    }

    const updated = staffList.map((u) =>
      u.id === staffId ? {
        ...u,
        faceEnrolled: true,
        facePhoto: facePhoto || u.avatar,
        faceHash: faceHash || u.faceHash,
        faceBiometrics: faceBiometrics || u.faceBiometrics
      } : u
    );
    saveStoredStaff(updated);
    return { success: true, message: 'Face ID enrolled locally' };
  },

  async fetchStaff() {
    try {
      const res = await fetch(`${BASE_URL}/auth/staff`);
      if (res.ok) {
        const staff = await res.json();
        saveStoredStaff(staff);
        return staff;
      }
    } catch (e) {}
    return getStoredStaff();
  },

  async createStaff(staffData) {
    const payload = {
      ...staffData,
      pinCode: staffData.pinCode || staffData.pin
    };
    try {
      const res = await fetch(`${BASE_URL}/auth/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const saved = await res.json();
        const current = getStoredStaff().filter((u) => u.id !== saved.id);
        saveStoredStaff([...current, saved]);
        return saved;
      }
    } catch (e) {}

    const current = getStoredStaff();
    const newStaff = {
      ...payload,
      id: 'usr-' + Date.now(),
      status: payload.status || 'ACTIVE',
      avatar: payload.avatar || payload.facePhoto || '',
      faceEnrolled: false,
      facePhoto: null,
      faceBiometrics: null,
      faceHash: null
    };
    saveStoredStaff([...current, newStaff]);
    return newStaff;
  },

  async updateStaff(id, staffData) {
    const payload = {
      ...staffData,
      pinCode: staffData.pinCode || staffData.pin
    };
    try {
      const res = await fetch(`${BASE_URL}/auth/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        const current = getStoredStaff().map((u) => (u.id === id ? updated : u));
        saveStoredStaff(current);
        return updated;
      }
    } catch (e) {}

    const current = getStoredStaff();
    const updated = current.map((u) => (u.id === id ? { ...u, ...payload } : u));
    saveStoredStaff(updated);
    return updated.find((u) => u.id === id);
  },

  async deleteStaff(id) {
    try {
      const res = await fetch(`${BASE_URL}/auth/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const current = getStoredStaff().filter((u) => u.id !== id);
        saveStoredStaff(current);
        return true;
      }
    } catch (e) {}
    const current = getStoredStaff().filter((u) => u.id !== id);
    saveStoredStaff(current);
    return true;
  },

  // Aliases for User Management terminology
  async fetchUsers() { return this.fetchStaff(); },
  async createUser(userData) { return this.createStaff(userData); },
  async updateUser(id, userData) { return this.updateStaff(id, userData); },
  async deleteUser(id) { return this.deleteStaff(id); },

  async fetchAuditLogs() {
    try {
      const res = await fetch(`${BASE_URL}/auth/audit-logs`);
      if (res.ok) {
        const logs = await res.json();
        saveStoredAuditLogs(logs);
        return logs;
      }
    } catch (e) {}
    return getStoredAuditLogs();
  },

  async fetchProducts() {
    try {
      const res = await fetch(`${BASE_URL}/products`);
      if (res.ok) {
        const products = await res.json();
        saveStoredProducts(products);
        return products;
      }
    } catch (err) {}
    return getStoredProducts();
  },

  async fetchIngredients() {
    try {
      const res = await fetch(`${BASE_URL}/ingredients`);
      if (res.ok) {
        const ingredients = await res.json();
        saveStoredIngredients(ingredients);
        return ingredients;
      }
    } catch (err) {}
    return getStoredIngredients();
  },

  async restockIngredient(id, delta = 500) {
    try {
      const res = await fetch(`${BASE_URL}/ingredients/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      if (res.ok) {
        const updated = await res.json();
        const current = getStoredIngredients().map((i) => (i.id === id ? updated : i));
        saveStoredIngredients(current);
        return updated;
      }
    } catch (err) {}

    const current = getStoredIngredients();
    const updated = current.map((i) =>
      i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i
    );
    saveStoredIngredients(updated);
    return updated.find((i) => i.id === id);
  },

  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Backend upload skipped/failed, using client-side reader', e);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          success: true,
          imageUrl: e.target.result,
          filename: file.name,
          size: file.size
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  async uploadBase64Image(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') {
      return { success: false, imageUrl: '' };
    }
    try {
      const res = await fetch(`${BASE_URL}/upload/base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Backend base64 upload failed, using client-side dataUrl', e);
    }
    return { success: true, imageUrl: base64Data };
  },

  async fetchCategories() {
    return getStoredCategories();
  },

  async createCategory(categoryData) {
    const current = getStoredCategories();
    const id = categoryData.id || categoryData.name.trim();
    if (current.some((c) => c.id.toLowerCase() === id.toLowerCase())) {
      throw new Error(`Category "${categoryData.name}" already exists!`);
    }
    const newCat = {
      id,
      name: categoryData.name.trim(),
      nameKm: categoryData.nameKm ? categoryData.nameKm.trim() : categoryData.name.trim(),
      icon: categoryData.icon || 'Coffee',
      color: categoryData.color || 'amber'
    };
    const updated = [...current, newCat];
    saveStoredCategories(updated);
    return newCat;
  },

  async updateCategory(id, categoryData) {
    const current = getStoredCategories();
    const updated = current.map((c) => (c.id === id ? { ...c, ...categoryData } : c));
    saveStoredCategories(updated);
    return updated.find((c) => c.id === id);
  },

  async deleteCategory(id) {
    if (id === 'all') throw new Error('Cannot delete default "All Items" category');
    const current = getStoredCategories();
    const updated = current.filter((c) => c.id !== id);
    saveStoredCategories(updated);
    return true;
  },

  async createProduct(productData) {
    try {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        const saved = await res.json();
        const current = getStoredProducts();
        saveStoredProducts([saved, ...current.filter((p) => p.id !== saved.id)]);
        return saved;
      }
    } catch (err) {}

    const current = getStoredProducts();
    const newProduct = {
      ...productData,
      id: 'prod-' + Date.now(),
      sku: productData.sku || `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
      stock: Number(productData.stock) || 0,
      price: Number(productData.price) || 0.0,
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      recipe: productData.recipe || []
    };
    const updated = [newProduct, ...current];
    saveStoredProducts(updated);
    return newProduct;
  },

  async updateProduct(id, productData) {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        const updated = await res.json();
        const current = getStoredProducts().map((p) => (p.id === id ? updated : p));
        saveStoredProducts(current);
        return updated;
      }
    } catch (err) {}

    const current = getStoredProducts();
    const updatedList = current.map((p) => (p.id === id ? { ...p, ...productData } : p));
    saveStoredProducts(updatedList);
    return updatedList.find((p) => p.id === id);
  },

  async restockProduct(id, delta = 10) {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
      if (res.ok) {
        const updated = await res.json();
        const current = getStoredProducts().map((p) => (p.id === id ? updated : p));
        saveStoredProducts(current);
        return updated;
      }
    } catch (err) {}

    const current = getStoredProducts();
    const updatedList = current.map((p) =>
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    );
    saveStoredProducts(updatedList);
    return updatedList.find((p) => p.id === id);
  },

  async deleteProduct(id) {
    try {
      await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
    } catch (err) {}
    const current = getStoredProducts().filter((p) => p.id !== id);
    saveStoredProducts(current);
    return true;
  },

  async checkout(checkoutPayload, cashierName = 'Liam Vance') {
    try {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cashier-Name': cashierName
        },
        body: JSON.stringify(checkoutPayload)
      });
      if (res.ok) {
        const order = await res.json();
        const currentOrders = getStoredOrders();
        saveStoredOrders([order, ...currentOrders]);
        return order;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Checkout failed on server');
      }
    } catch (err) {
      // Re-throw validation or store-closed errors
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('Failed to fetch')) {
        throw err;
      }

      // In offline / local fallback mode, enforce store open check
      const localShifts = await this.fetchShifts();
      const hasOpenShift = localShifts.some((s) => s.status === 'OPEN');
      if (!hasOpenShift) {
        throw new Error('Store is currently closed. Please open store first before processing sales.');
      }
    }

    const currentProducts = getStoredProducts();
    const currentIngredients = getStoredIngredients();

    const updatedProducts = currentProducts.map((p) => {
      const item = checkoutPayload.items.find((i) => i.productId === p.id);
      if (item) {
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      }
      return p;
    });
    saveStoredProducts(updatedProducts);

    const updatedIngredients = currentIngredients.map((ing) => {
      let deductAmount = 0;
      checkoutPayload.items.forEach((item) => {
        const prod = currentProducts.find((p) => p.id === item.productId);
        if (prod?.recipe) {
          const recItem = prod.recipe.find((r) => r.ingredientId === ing.id);
          if (recItem) {
            deductAmount += recItem.quantity * item.quantity;
          }
        }
      });
      return {
        ...ing,
        stock: Math.max(0, Math.round((ing.stock - deductAmount) * 100) / 100)
      };
    });
    saveStoredIngredients(updatedIngredients);

    const subtotal = checkoutPayload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const discount = checkoutPayload.discount || 0;
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100;
    const total = Math.round((subtotal - discount + tax) * 100) / 100;
    const amountPaid =
      checkoutPayload.amountPaid >= total ? checkoutPayload.amountPaid : total;
    const change = Math.round((amountPaid - total) * 100) / 100;

    const newOrder = {
      id: 'ord-' + Date.now(),
      orderNumber: '#ORD-' + (Math.floor(Math.random() * 800) + 1040),
      items: checkoutPayload.items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: checkoutPayload.paymentMethod || 'CASH',
      amountPaid,
      change,
      orderType: checkoutPayload.orderType || 'DINE_IN',
      cashierName,
      customerName: checkoutPayload.customerName || 'Walk-in Guest',
      createdAt: new Date().toISOString(),
      status: 'COMPLETED'
    };

    const currentOrders = getStoredOrders();
    saveStoredOrders([newOrder, ...currentOrders]);
    return newOrder;
  },

  async fetchOrders(cashierName) {
    try {
      const url = cashierName && cashierName !== 'ALL' 
        ? `${BASE_URL}/orders?cashier=${encodeURIComponent(cashierName)}` 
        : `${BASE_URL}/orders`;
      const res = await fetch(url);
      if (res.ok) {
        const orders = await res.json();
        if (!cashierName || cashierName === 'ALL') {
          const currentLocal = getStoredOrders();
          const localOnlyOnline = currentLocal.filter(
            (lo) => (lo.channel === 'ONLINE_ECOMMERCE' || lo.orderType === 'DELIVERY') && 
                    !orders.some((bo) => bo.id === lo.id || bo.orderNumber === lo.orderNumber)
          );
          const merged = [...orders, ...localOnlyOnline];
          saveStoredOrders(merged);
          return merged;
        }
        return orders;
      }
    } catch (err) {}
    const stored = getStoredOrders();
    if (cashierName && cashierName !== 'ALL') {
      const target = cashierName.trim().toLowerCase();
      return stored.filter(o => o.cashierName && o.cashierName.trim().toLowerCase() === target);
    }
    return stored;
  },

  async refundOrder(orderId, reason = 'Customer requested refund') {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        const updated = await res.json();
        const current = getStoredOrders();
        saveStoredOrders(current.map((o) => (o.id === orderId ? updated : o)));
        return updated;
      }
    } catch (e) {}

    const current = getStoredOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, status: 'REFUNDED', refundReason: reason } : o));
    saveStoredOrders(updated);
    return updated.find((o) => o.id === orderId);
  },

  // Staff Register Shift Open & Close Ledger
  async fetchShifts() {
    try {
      const res = await fetch(`${BASE_URL}/shifts`);
      if (res.ok) {
        const data = await res.json();
        storage.setItem('aromapos_shifts', JSON.stringify(data));
        return data;
      }
    } catch (e) {}
    try {
      const local = storage.getItem('aromapos_shifts');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return [];
  },

  async fetchActiveShift() {
    try {
      const res = await fetch(`${BASE_URL}/shifts/active`);
      if (res.status === 204) {
        return null;
      }
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const shifts = await this.fetchShifts();
    return shifts.find((s) => s.status === 'OPEN') || null;
  },

  async fetchStoreStatus() {
    try {
      const res = await fetch(`${BASE_URL}/shifts/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const active = await this.fetchActiveShift();
    return {
      storeOpen: !!active,
      hasActiveShift: !!active,
      activeShift: active
    };
  },

  async openShift(payload) {
    try {
      const res = await fetch(`${BASE_URL}/shifts/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const shift = await res.json();
        const current = await this.fetchShifts();
        const updated = [shift, ...current.filter((s) => s.id !== shift.id)];
        storage.setItem('aromapos_shifts', JSON.stringify(updated));
        return shift;
      }
    } catch (e) {
      console.error('Failed to open shift on server', e);
    }

    // Local fallback
    const shift = {
      id: 'shf-' + Date.now(),
      shiftNumber: 'SHIFT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-01',
      staffId: payload.staffId || 'usr-staff',
      staffName: payload.staffName || 'Cashier',
      staffRole: payload.staffRole || 'CASHIER',
      registerName: payload.registerName || 'Register #1 - Main Bar',
      openedAt: new Date().toISOString(),
      startingFloat: payload.startingFloat || 100.0,
      status: 'OPEN',
      openingNotes: payload.notes || 'Register drawer opened.',
      expectedCash: payload.startingFloat || 100.0,
      totalGrossSales: 0,
      cashSales: 0,
      cardSales: 0,
      qrSales: 0,
      totalOrders: 0
    };
    const current = await this.fetchShifts();
    const updated = [shift, ...current];
    storage.setItem('aromapos_shifts', JSON.stringify(updated));
    return shift;
  },

  async closeShift(payload) {
    try {
      const res = await fetch(`${BASE_URL}/shifts/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const closedShift = await res.json();
        const current = await this.fetchShifts();
        const updated = current.map((s) => s.id === closedShift.id ? closedShift : s);
        storage.setItem('aromapos_shifts', JSON.stringify(updated));
        return closedShift;
      }
    } catch (e) {
      console.error('Failed to close shift on server', e);
    }

    // Local fallback
    const current = await this.fetchShifts();
    const target = current.find((s) => s.id === payload.shiftId || s.status === 'OPEN') || current[0];
    if (!target) throw new Error('No shift found to close');

    const expected = target.expectedCash || (target.startingFloat + target.cashSales);
    const variance = Math.round(((payload.physicalCashCount || 0) - expected) * 100) / 100;
    const closed = {
      ...target,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: payload.closedBy || target.staffName,
      actualCashCount: payload.physicalCashCount || 0,
      variance,
      varianceStatus: variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE',
      closingNotes: payload.notes || 'Shift closed.',
      denominations: payload.denominations || {}
    };
    const updated = current.map((s) => s.id === closed.id ? closed : s);
    storage.setItem('aromapos_shifts', JSON.stringify(updated));
    return closed;
  },

  async recordCashMovement(payload) {
    try {
      const res = await fetch(`${BASE_URL}/shifts/cash-movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedShift = await res.json();
        const current = await this.fetchShifts();
        const updated = current.map((s) => s.id === updatedShift.id ? updatedShift : s);
        storage.setItem('aromapos_shifts', JSON.stringify(updated));
        return updatedShift;
      }
    } catch (e) {
      console.error('Failed to record cash movement on server', e);
    }

    // Local fallback
    const current = await this.fetchShifts();
    const target = current.find((s) => s.id === payload.shiftId || s.status === 'OPEN') || current[0];
    if (!target) throw new Error('No active shift found');

    const amt = Number(payload.amount) || 0;
    const isPayIn = payload.type === 'CASH_IN' || payload.type === 'PAY_IN';
    const payIns = (target.payIns || 0) + (isPayIn ? amt : 0);
    const payOuts = (target.payOuts || 0) + (!isPayIn ? amt : 0);
    const movements = target.cashMovements || [];
    movements.push({
      id: 'mov-' + Date.now(),
      type: payload.type,
      amount: amt,
      reason: payload.reason || '',
      performedBy: payload.performedBy || 'Staff',
      timestamp: new Date().toISOString()
    });

    const expected = Math.round((target.startingFloat + (target.cashSales || 0) + payIns - payOuts - (target.refunds || 0)) * 100) / 100;
    const updatedShift = {
      ...target,
      payIns,
      payOuts,
      cashMovements: movements,
      expectedCash: expected
    };
    const updated = current.map((s) => s.id === updatedShift.id ? updatedShift : s);
    storage.setItem('aromapos_shifts', JSON.stringify(updated));
    return updatedShift;
  },

  async generateZReport(physicalCashCount, cashierName, startingFloat = 200.0) {
    try {
      const res = await fetch(`${BASE_URL}/shift/z-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ physicalCashCount })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}

    const orders = getStoredOrders();
    const cashSales = orders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.total, 0);
    const cardSales = orders
      .filter((o) => o.paymentMethod === 'CARD')
      .reduce((sum, o) => sum + o.total, 0);
    const qrSales = orders
      .filter((o) => o.paymentMethod === 'KHQR' || o.paymentMethod === 'QR_CODE')
      .reduce((sum, o) => sum + o.total, 0);
    const totalGrossSales = orders.reduce((sum, o) => sum + o.total, 0);
    const expectedCash = Math.round((startingFloat + cashSales) * 100) / 100;
    const variance = Math.round((physicalCashCount - expectedCash) * 100) / 100;

    return {
      reportNumber: 'Z-REP-' + Date.now(),
      shiftStartedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      shiftClosedAt: new Date().toISOString(),
      operator: cashierName || 'Liam Vance',
      startingFloat,
      cashSales: Math.round(cashSales * 100) / 100,
      cardSales: Math.round(cardSales * 100) / 100,
      qrSales: Math.round(qrSales * 100) / 100,
      totalGrossSales: Math.round(totalGrossSales * 100) / 100,
      refunds: 0.0,
      expectedCash,
      physicalCashCount: Math.round(physicalCashCount * 100) / 100,
      variance,
      status: variance === 0 ? 'BALANCED' : variance > 0 ? 'OVERAGE' : 'SHORTAGE',
      totalTickets: orders.length
    };
  },

  async shiftHandover(cashierName) {
    try {
      await fetch(`${BASE_URL}/shift/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashierName })
      });
    } catch (e) {}
  },

  // Management Reporting Engine APIs
  async fetchManagementReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate && filters.startDate !== 'all') params.append('startDate', filters.startDate);
    if (filters.endDate && filters.endDate !== 'all') params.append('endDate', filters.endDate);
    if (filters.cashier && filters.cashier !== 'all') params.append('cashier', filters.cashier);
    if (filters.paymentMethods && filters.paymentMethods !== 'all') params.append('paymentMethods', filters.paymentMethods);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.startHour !== undefined && filters.startHour !== null && filters.startHour !== '' && filters.startHour !== 'all') {
      params.append('startHour', filters.startHour);
    }
    if (filters.endHour !== undefined && filters.endHour !== null && filters.endHour !== '' && filters.endHour !== 'all') {
      params.append('endHour', filters.endHour);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const storedUser = getStoredUser();
      const role = storedUser?.role || 'ADMIN';
      const perms = (storedUser?.permissions || []).join(',');
      const res = await fetch(`${BASE_URL}/reports/full${queryString}`, {
        headers: {
          'X-User-Role': role,
          'X-User-Permissions': perms
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Offline local calculation fallback with dynamic filters
    let orders = getStoredOrders();
    let products = getStoredProducts();
    const ingredients = getStoredIngredients();

    // 1. Filter by Date
    if (filters.startDate && filters.startDate !== 'all') {
      const start = new Date(filters.startDate).getTime();
      orders = orders.filter((o) => new Date(o.createdAt).getTime() >= start);
    }
    if (filters.endDate && filters.endDate !== 'all') {
      const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
      orders = orders.filter((o) => new Date(o.createdAt).getTime() <= end);
    }

    // 2. Filter by Hour
    if (filters.startHour !== undefined && filters.startHour !== null && filters.startHour !== '' && filters.startHour !== 'all') {
      const sh = parseInt(filters.startHour, 10);
      orders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) ? d.getHours() >= sh : true;
      });
    }
    if (filters.endHour !== undefined && filters.endHour !== null && filters.endHour !== '' && filters.endHour !== 'all') {
      const eh = parseInt(filters.endHour, 10);
      orders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return !isNaN(d.getTime()) ? d.getHours() <= eh : true;
      });
    }

    // 3. Filter by Cashier / Staff
    if (filters.cashier && filters.cashier !== 'all') {
      orders = orders.filter((o) => (o.cashierName || '').toLowerCase() === filters.cashier.toLowerCase());
    }

    // 4. Filter by Payment Methods
    if (filters.paymentMethods && filters.paymentMethods !== 'all') {
      const allowedMethods = filters.paymentMethods.split(',').map((m) => m.trim().toUpperCase());
      orders = orders.filter((o) => {
        let m = (o.paymentMethod || 'CASH').toUpperCase();
        if (m === 'QR_CODE') m = 'KHQR';
        return allowedMethods.includes(m);
      });
    }

    // 5. Filter by Category
    if (filters.category && filters.category !== 'all') {
      products = products.filter((p) => (p.category || '').toLowerCase() === filters.category.toLowerCase());
      const catProductNames = new Set(products.map((p) => p.name.toLowerCase()));
      orders = orders.filter((o) => 
        (o.items || []).some((item) => catProductNames.has((item.productName || '').toLowerCase()))
      );
    }

    const grossSales = orders.reduce((sum, o) => sum + (o.subtotal || o.total || 0), 0);
    const totalDiscounts = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalTax = orders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const netSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const payMap = { CASH: 0, KHQR: 0, CARD: 0 };
    orders.forEach((o) => {
      let m = o.paymentMethod === 'QR_CODE' ? 'KHQR' : o.paymentMethod || 'CASH';
      if (!payMap[m] && payMap[m] !== 0) m = 'CARD';
      payMap[m] = (payMap[m] || 0) + (o.total || 0);
    });

    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const peakHours = hours.map((hour, idx) => ({
      hour,
      tickets: Math.max(1, Math.round((14 + idx * 4) * (orders.length > 0 ? orders.length / 4 : 0.6))),
      sales: Math.round((65 + idx * 22) * (netSales > 0 ? netSales / 50 : 0.6) * 100) / 100,
      recommendedStaff: idx === 4 || idx === 3 ? 3 : idx > 1 ? 2 : 1
    }));

    const itemProfitability = products.map((p, idx) => {
      let cost = 0;
      if (p.recipe) {
        p.recipe.forEach((r) => {
          const ing = ingredients.find((i) => i.id === r.ingredientId);
          if (ing) cost += r.quantity * (ing.costPerUnit || 0.02);
        });
      }
      if (cost === 0) cost = p.price * 0.22;
      const margin = p.price - cost;
      const marginPct = p.price > 0 ? (margin / p.price) * 100 : 0;
      const unitsSold = Math.max(1, 28 - idx * 2);
      const revenue = Math.round(p.price * unitsSold * 100) / 100;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        retailPrice: p.price,
        unitPrice: p.price,
        unitPriceKhr: Math.round(p.price * 4100),
        unitsSold,
        revenue,
        revenueKhr: Math.round(revenue * 4100),
        unitCost: Math.round(cost * 100) / 100,
        bomCost: Math.round(cost * 100) / 100,
        grossMargin: Math.round(margin * 100) / 100,
        grossProfit: Math.round((revenue - cost * unitsSold) * 100) / 100,
        profitMarginPct: Math.round(marginPct * 10) / 10,
        marginPercentage: Math.round(marginPct * 10) / 10,
        cogsPercentage: Math.round((100 - marginPct) * 10) / 10,
        stock: p.stock
      };
    });

    const reorderForecast = ingredients
      .filter((i) => i.stock <= i.minThreshold * 1.5)
      .map((i) => ({
        id: i.id,
        ingredientName: i.name,
        currentStock: i.stock,
        unit: i.unit,
        safetyThreshold: i.minThreshold,
        suggestedReorder: Math.max(50, Math.round(i.minThreshold * 2.5 - i.stock)),
        estimatedPoCost: Math.round(Math.max(50, (i.minThreshold * 2.5 - i.stock)) * i.costPerUnit * 100) / 100,
        urgency: i.stock <= i.minThreshold ? 'CRITICAL' : 'REORDER_SOON'
      }));

    return {
      grossSales: Math.round(grossSales * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      customerCount: orders.length,
      averageSpendPerGuest: orders.length > 0 ? Math.round((netSales / orders.length) * 100) / 100 : 0,
      peakHourData: peakHours,
      paymentBreakdown: payMap,
      topSellingItems: itemProfitability.slice(0, 5),
      worstSellingItems: itemProfitability.slice(-5),
      allProductPerformance: itemProfitability,
      overallCogsPercentage: 27.4,
      totalIngredientCost: Math.round(grossSales * 0.274 * 100) / 100,
      totalGrossProfit: Math.round(grossSales * 0.726 * 100) / 100,
      itemProfitability,
      reorderForecast,
      staffPerformance: [
        { name: 'Liam Vance', role: 'Barista', ticketsHandled: 8, salesGenerated: 142.50, avgTicketValue: 17.81, voidCount: 1, discountCount: 2, discountTotal: 3.50, hoursWorked: 6.5, laborCost: 91.00, laborCostPct: 63.8, flaggedAudit: false },
        { name: 'Sophia Bennett', role: 'Store Manager', ticketsHandled: 5, salesGenerated: 98.00, avgTicketValue: 19.60, voidCount: 0, discountCount: 4, discountTotal: 12.00, hoursWorked: 7.0, laborCost: 154.00, laborCostPct: 157.1, flaggedAudit: false },
        { name: 'Marcus Thorne', role: 'Administrator', ticketsHandled: 4, salesGenerated: 75.00, avgTicketValue: 18.75, voidCount: 0, discountCount: 1, discountTotal: 2.00, hoursWorked: 5.0, laborCost: 140.00, laborCostPct: 186.6, flaggedAudit: false },
        { name: 'Chloe Chen', role: 'Junior Barista', ticketsHandled: 7, salesGenerated: 110.00, avgTicketValue: 15.71, voidCount: 4, discountCount: 3, discountTotal: 6.75, hoursWorked: 6.0, laborCost: 72.00, laborCostPct: 65.4, flaggedAudit: true }
      ].filter((s) => !filters.cashier || filters.cashier === 'all' || s.name.toLowerCase() === filters.cashier.toLowerCase()),
      storeLaborCostPercentage: 24.8,
      filterMetadata: {
        startDate: filters.startDate || 'ALL',
        endDate: filters.endDate || 'ALL',
        startHour: filters.startHour || 'ALL',
        endHour: filters.endHour || 'ALL',
        cashier: filters.cashier || 'ALL',
        paymentMethods: filters.paymentMethods || 'ALL',
        category: filters.category || 'ALL',
        matchingOrdersCount: orders.length
      }
    };
  },

  async calculateSpoilage(physicalCounts = {}) {
    try {
      const res = await fetch(`${BASE_URL}/reports/spoilage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(physicalCounts)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    const ingredients = getStoredIngredients();
    return ingredients.map((ing) => {
      const theo = ing.stock;
      const actual = physicalCounts[ing.id] !== undefined
        ? physicalCounts[ing.id]
        : Math.round((theo - (ing.unit === 'g' ? 35 : ing.unit === 'ml' ? 90 : 1)) * 100) / 100;
      const varQty = Math.round((actual - theo) * 100) / 100;
      const varPct = theo > 0 ? Math.round((varQty / theo) * 1000) / 10 : 0;
      const loss = Math.round(Math.abs(varQty) * (ing.costPerUnit || 0.03) * 100) / 100;
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        theoreticalStock: theo,
        actualStock: actual,
        varianceQuantity: varQty,
        variancePercentage: varPct,
        financialLoss: loss,
        status: varQty === 0 ? 'EXACT' : varQty < 0 ? 'SPOILAGE_OR_THEFT' : 'SURPLUS'
      };
    });
  },

  async fetchTopProductsReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate && filters.startDate !== 'all') params.append('startDate', filters.startDate);
    if (filters.endDate && filters.endDate !== 'all') params.append('endDate', filters.endDate);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.limit) params.append('limit', filters.limit);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const storedUser = getStoredUser();
      const role = storedUser?.role || 'ADMIN';
      const perms = (storedUser?.permissions || []).join(',');
      const res = await fetch(`${BASE_URL}/reports/top-products${queryString}`, {
        headers: { 
          'X-User-Role': role,
          'X-User-Permissions': perms
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const report = await this.fetchManagementReport(filters);
    return {
      topByUnits: (report.allProductPerformance || []).slice(0, filters.limit || 10),
      topByRevenue: [...(report.allProductPerformance || [])].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, filters.limit || 10),
      topByProfit: [...(report.allProductPerformance || [])].sort((a, b) => (b.grossProfit || 0) - (a.grossProfit || 0)).slice(0, filters.limit || 10),
      worstSelling: report.worstSellingItems || [],
      summary: {
        totalUnitsSold: (report.allProductPerformance || []).reduce((s, p) => s + (p.unitsSold || 0), 0),
        totalRevenue: report.grossSales || 0,
        totalRevenueKhr: Math.round((report.grossSales || 0) * 4100),
        totalProfit: report.totalGrossProfit || 0
      }
    };
  },

  async fetchTopStaffReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate && filters.startDate !== 'all') params.append('startDate', filters.startDate);
    if (filters.endDate && filters.endDate !== 'all') params.append('endDate', filters.endDate);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    try {
      const storedUser = getStoredUser();
      const role = storedUser?.role || 'ADMIN';
      const perms = (storedUser?.permissions || []).join(',');
      const res = await fetch(`${BASE_URL}/reports/top-staff${queryString}`, {
        headers: { 
          'X-User-Role': role,
          'X-User-Permissions': perms
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const report = await this.fetchManagementReport(filters);
    const staff = report.staffPerformance || [];
    return {
      rankedBySales: [...staff].sort((a, b) => (b.salesGenerated || 0) - (a.salesGenerated || 0)),
      rankedByTickets: [...staff].sort((a, b) => (b.ticketsHandled || 0) - (a.ticketsHandled || 0)),
      rankedByAvgTicket: [...staff].sort((a, b) => (b.avgTicketValue || 0) - (a.avgTicketValue || 0)),
      mvpStaff: staff[0] || null,
      allStaff: staff,
      summary: {
        totalStaffCount: staff.length,
        totalTicketsHandled: staff.reduce((s, st) => s + (st.ticketsHandled || 0), 0),
        totalStaffSales: staff.reduce((s, st) => s + (st.salesGenerated || 0), 0)
      }
    };
  },

  getExportUrl(reportType, filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate && filters.startDate !== 'all') params.append('startDate', filters.startDate);
    if (filters.endDate && filters.endDate !== 'all') params.append('endDate', filters.endDate);
    if (filters.cashier && filters.cashier !== 'all') params.append('cashier', filters.cashier);
    if (filters.paymentMethods && filters.paymentMethods !== 'all') params.append('paymentMethods', filters.paymentMethods);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.startHour !== undefined && filters.startHour !== null && filters.startHour !== '' && filters.startHour !== 'all') {
      params.append('startHour', filters.startHour);
    }
    if (filters.endHour !== undefined && filters.endHour !== null && filters.endHour !== '' && filters.endHour !== 'all') {
      params.append('endHour', filters.endHour);
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return `${BASE_URL}/reports/export/${reportType.toLowerCase()}${queryString}`;
  },

  // NBC Bakong KHQR Real-Time Integration
  async getBakongConfig() {
    try {
      const res = await fetch(`${BASE_URL}/bakong/config`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to load Bakong config from backend', e);
    }
    return {
      merchantId: 'sophara_len@bkrt',
      merchantName: 'COFFEE POS',
      merchantCity: 'Phnom Penh',
      acquiringBank: 'Bakong',
      telegramEnabled: true
    };
  },

  async generateBakongQr({ billNumber, amount, currency = 'USD' }) {
    try {
      const res = await fetch(`${BASE_URL}/bakong/generate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billNumber, amount, currency })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to generate Bakong KHQR', e);
    }
    return null;
  },

  async checkBakongPayment(md5) {
    try {
      const res = await fetch(`${BASE_URL}/bakong/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md5 })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to query Bakong payment status', e);
    }
    return { paid: false, status: 'ERROR' };
  },

  async fetchLoginSessions() {
    try {
      const res = await fetch(`${BASE_URL}/auth/sessions`);
      if (res.ok) {
        const serverSessions = await res.json();
        if (Array.isArray(serverSessions) && serverSessions.length > 0) {
          const localSessions = getStoredLoginSessions();
          const map = new Map();
          // Server sessions are authority
          serverSessions.forEach((s) => map.set(s.id, s));
          localSessions.forEach((s) => {
            if (!map.has(s.id)) map.set(s.id, s);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          saveStoredLoginSessions(merged);
          return merged;
        }
      }
    } catch (e) {}
    return getStoredLoginSessions();
  },

  async terminateLoginSession(sessionId) {
    try {
      fetch(`${BASE_URL}/auth/sessions/${sessionId}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {}
    return terminateLoginSession(sessionId);
  },

  async clearLoginSessions() {
    clearLoginSessions();
    return [];
  },

  async clearDemoLoginSessions() {
    return clearDemoLoginSessions();
  },

  async restoreDemoLoginSessions() {
    return restoreDemoLoginSessions();
  },

  async recordLogin(user, method = 'PASSWORD') {
    return await recordLoginSession(user, method);
  },

  async getClientSecuritySnapshot() {
    const ip = await resolveClientIp();
    const dev = getDeviceInfo();
    return { ...dev, ipAddress: ip, classification: classifyIp(ip) };
  },

  async fetchDeviceTravel(userId = null) {
    try {
      const endpoint = userId && userId !== 'ALL' ? `${BASE_URL}/auth/device-travel/${userId}` : `${BASE_URL}/auth/device-travel`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {}
    const local = getStoredDeviceTravelBreadcrumbs();
    if (userId && userId !== 'ALL') {
      return local.filter((b) => b.userId === userId || b.userName === userId);
    }
    return local;
  },

  async pingDeviceLocation(crumb) {
    addStoredDeviceTravelBreadcrumb(crumb);
    try {
      fetch(`${BASE_URL}/auth/device-travel/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crumb)
      }).catch(() => {});
    } catch (e) {}
  },

  async fetchActiveAlarms() {
    try {
      const res = await fetch(`${BASE_URL}/auth/alarm/active`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return [];
  },

  async broadcastSoundAlarm(alarmData) {
    const alarm = {
      id: `alarm-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      targetSessionId: alarmData?.targetSessionId || 'ALL',
      targetUserName: alarmData?.targetUserName || 'All Staff',
      senderName: alarmData?.senderName || 'Manager Admin',
      message: alarmData?.message || 'Urgent Staff Attention Required at Register!',
      soundType: alarmData?.soundType || 'SIREN',
      timestamp: new Date().toISOString()
    };

    // 1. Local BroadcastChannel for live tabs/windows
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('aromapos_alarms');
        bc.postMessage({ type: 'TRIGGER_ALARM', alarm });
        setTimeout(() => bc.close(), 1000);
      }
    } catch (e) {}

    // 2. Storage event for cross-tab sync
    try {
      storage.setItem('aromapos_incoming_alarm', JSON.stringify({ ...alarm, trigger: Date.now() }));
    } catch (e) {}

    // 3. Server-wide broadcast for multi-device sync
    try {
      fetch(`${BASE_URL}/auth/alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alarm)
      }).catch(() => {});
    } catch (e) {}

    return alarm;
  },

  async silenceSoundAlarm(alarmId = 'ALL') {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('aromapos_alarms');
        bc.postMessage({ type: 'SILENCE_ALARM', alarmId });
        setTimeout(() => bc.close(), 1000);
      }
    } catch (e) {}

    try {
      storage.removeItem('aromapos_incoming_alarm');
    } catch (e) {}

    try {
      fetch(`${BASE_URL}/auth/alarm/silence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmId })
      }).catch(() => {});
    } catch (e) {}
  }
};

export default api;
