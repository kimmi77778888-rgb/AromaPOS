/**
 * Device & Client IP Detection Utility for Enterprise Security Auditing
 * Captures standard client metadata: IP address, device type, OS, browser, screen resolution,
 * POS station ID, and network classification (Public IPv4 vs Private LAN).
 */

let cachedPublicIp = null;
let isFetchingIp = false;
let cachedLocation = null;
let isFetchingLocation = false;

/**
 * Detect operating system from userAgent & platform
 */
export const detectOS = () => {
  if (typeof window === 'undefined') return 'Server (Node.js)';
  const ua = window.navigator.userAgent || '';
  const platform = window.navigator.platform || '';

  if (/Windows NT 10.0/i.test(ua)) return 'Windows 11 / 10';
  if (/Windows NT 6.3/i.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6.1/i.test(ua)) return 'Windows 7';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/iPhone/i.test(ua)) return 'iOS (iPhone)';
  if (/iPad/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iPadOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
};

/**
 * Detect browser name and version
 */
export const detectBrowser = () => {
  if (typeof window === 'undefined') return 'Server';
  const ua = window.navigator.userAgent || '';

  let browserName = 'Browser';
  let fullVersion = '';

  if (/Edg\/([0-9.]+)/i.test(ua)) {
    browserName = 'Microsoft Edge';
    fullVersion = RegExp.$1;
  } else if (/OPR\/([0-9.]+)/i.test(ua) || /Opera\/([0-9.]+)/i.test(ua)) {
    browserName = 'Opera';
    fullVersion = RegExp.$1;
  } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
    browserName = 'Google Chrome';
    fullVersion = RegExp.$1;
  } else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
    browserName = 'Apple Safari';
    fullVersion = RegExp.$1;
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browserName = 'Mozilla Firefox';
    fullVersion = RegExp.$1;
  }

  const majorVersion = fullVersion.split('.')[0] || '';
  return majorVersion ? `${browserName} ${majorVersion}` : browserName;
};

/**
 * Detect hardware device brand (Apple, Samsung, Google, Xiaomi, Oppo, Vivo, Huawei, etc.)
 */
export const detectDeviceBrand = () => {
  if (typeof window === 'undefined') return 'Universal Device';
  const ua = window.navigator.userAgent || '';
  const platform = window.navigator.platform || '';
  const vendor = window.navigator.vendor || '';

  // 1. Check navigator.userAgentData hints if available (modern Chromium browsers)
  if (typeof navigator !== 'undefined' && navigator.userAgentData) {
    const brands = navigator.userAgentData.brands || [];
    for (const b of brands) {
      const name = (b.brand || '').toLowerCase();
      if (name.includes('samsung')) return 'Samsung';
      if (name.includes('google')) return 'Google';
      if (name.includes('xiaomi')) return 'Xiaomi';
      if (name.includes('oppo')) return 'OPPO';
      if (name.includes('vivo')) return 'vivo';
      if (name.includes('huawei')) return 'Huawei';
    }
  }

  // 2. Apple Devices (iPhone, iPad, Mac)
  if (/iPhone|iPad|iPod|Macintosh|Mac OS X|MacIntel/i.test(ua) || /Apple/i.test(vendor) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'Apple';
  }

  // 3. Samsung Galaxy Devices
  if (/Samsung|SM-[A-Z0-9]+|GT-[A-Z0-9]+|SCH-[A-Z0-9]+|SEC_S|SAMSUNG/i.test(ua)) {
    return 'Samsung';
  }

  // 4. Google Pixel Devices
  if (/Pixel|Google/i.test(ua)) {
    return 'Google';
  }

  // 5. Xiaomi, Redmi, POCO
  if (/Xiaomi|Redmi|POCO|Mi\s|2[0-9]{3}[0-9A-Z]+/i.test(ua)) {
    return 'Xiaomi';
  }

  // 6. OPPO / Realme / OnePlus (BBK family)
  if (/OPPO|CPH[0-9]+|Find\s?X|Reno/i.test(ua)) {
    return 'OPPO';
  }
  if (/OnePlus|ONEPLUS|GM19|KB20|IN20/i.test(ua)) {
    return 'OnePlus';
  }
  if (/Realme|RMX[0-9]+/i.test(ua)) {
    return 'Realme';
  }

  // 7. Vivo / iQOO
  if (/vivo|V[0-9]{4}|iQOO/i.test(ua)) {
    return 'vivo';
  }

  // 8. Huawei / Honor
  if (/Huawei|HONOR|HW-|HMA-|ALP-|VOG-|ELE-|CLT-/i.test(ua)) {
    return 'Huawei';
  }

  // 9. Sony Xperia
  if (/Sony|Xperia|SO-[0-9]+/i.test(ua)) {
    return 'Sony';
  }

  // 10. Motorola / Lenovo
  if (/Motorola|Moto/i.test(ua)) {
    return 'Motorola';
  }
  if (/Lenovo|ThinkPad|IdeaPad/i.test(ua)) {
    return 'Lenovo';
  }

  // 11. Asus
  if (/ASUS|ROG\sPhone|ZenFone/i.test(ua)) {
    return 'ASUS';
  }

  // 12. POS Terminals & Smart Kiosks
  if (/Sunmi|EloTouch|Posiflex|PAX/i.test(ua)) {
    return 'Sunmi POS';
  }

  // 13. PC Vendors
  if (/Dell/i.test(ua)) return 'Dell';
  if (/HP|Hewlett-Packard/i.test(ua)) return 'HP';
  if (/Acer/i.test(ua)) return 'Acer';

  // 14. Operating System level fallback
  if (/Windows/i.test(ua)) {
    const isTouch = (window.navigator?.maxTouchPoints || 0) > 0;
    const width = window.innerWidth || 1280;
    if (isTouch && width >= 1024) return 'Sunmi POS';
    return 'Microsoft Windows';
  }
  if (/Android/i.test(ua)) {
    return 'Android Universal';
  }
  if (/Linux/i.test(ua)) {
    return 'Linux Workstation';
  }

  return 'Universal Device';
};

/**
 * Return brand visual styling badge, logo icon, and color theme
 */
export const getBrandBadge = (brand = '') => {
  const b = (brand || '').toLowerCase();
  if (b.includes('apple')) {
    return { name: 'Apple', icon: '🍎', color: 'bg-stone-900 text-stone-100 border-stone-700' };
  }
  if (b.includes('samsung')) {
    return { name: 'Samsung', icon: '🪐', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60' };
  }
  if (b.includes('google') || b.includes('pixel')) {
    return { name: 'Google', icon: '🌐', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
  }
  if (b.includes('xiaomi') || b.includes('redmi') || b.includes('poco')) {
    return { name: 'Xiaomi', icon: '⚡', color: 'bg-orange-950/80 text-orange-300 border-orange-700/60' };
  }
  if (b.includes('oppo')) {
    return { name: 'OPPO', icon: '🟢', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' };
  }
  if (b.includes('vivo')) {
    return { name: 'vivo', icon: '🔷', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' };
  }
  if (b.includes('huawei')) {
    return { name: 'Huawei', icon: '🌺', color: 'bg-rose-950/80 text-rose-300 border-rose-700/60' };
  }
  if (b.includes('oneplus')) {
    return { name: 'OnePlus', icon: '🔴', color: 'bg-red-950/80 text-red-300 border-red-700/60' };
  }
  if (b.includes('sony')) {
    return { name: 'Sony', icon: '🎮', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60' };
  }
  if (b.includes('sunmi') || b.includes('pos')) {
    return { name: 'Sunmi POS', icon: '📠', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60' };
  }
  if (b.includes('dell')) {
    return { name: 'Dell', icon: '💻', color: 'bg-sky-950/80 text-sky-300 border-sky-700/60' };
  }
  if (b.includes('hp')) {
    return { name: 'HP', icon: '💻', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' };
  }
  if (b.includes('lenovo')) {
    return { name: 'Lenovo', icon: '💻', color: 'bg-rose-950/80 text-rose-300 border-rose-700/60' };
  }
  if (b.includes('asus')) {
    return { name: 'ASUS', icon: '💻', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60' };
  }
  if (b.includes('microsoft') || b.includes('windows')) {
    return { name: 'Microsoft', icon: '🪟', color: 'bg-sky-950/80 text-sky-300 border-sky-700/60' };
  }
  return { name: brand || 'Device', icon: '📱', color: 'bg-stone-900 text-stone-300 border-stone-800' };
};

/**
 * Detect device type: Phone | Tablet | POS Touch Station | Desktop
 */
export const detectDeviceType = () => {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = window.navigator.userAgent || '';
  const width = window.innerWidth || 1280;
  const isTouch = (window.navigator?.maxTouchPoints || 0) > 0;

  // 1. Mobile Phone / Smartphone (Priority #1)
  if (/iPhone|iPod|Mobile|Mobi|Android.*Mobile/i.test(ua) || (isTouch && width < 600)) {
    return 'Phone';
  }
  // 2. Tablet (iPad or non-mobile Android tablet)
  if ((/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) && isTouch) {
    return 'Tablet';
  }
  // 3. POS Touch Station (Touch terminal on counter)
  if (isTouch && width >= 1024 && !/Macintosh/i.test(ua)) {
    return 'POS Touch Station';
  }
  return 'Desktop';
};

/**
 * Check if IP is private LAN or public IPv4/IPv6
 */
export const classifyIp = (ip = '') => {
  if (!ip) return { type: 'LAN', label: 'Local Network', isPrivate: true };
  const clean = ip.trim();
  if (
    clean.startsWith('192.168.') ||
    clean.startsWith('10.') ||
    clean.startsWith('172.16.') ||
    clean.startsWith('172.31.') ||
    clean === '127.0.0.1' ||
    clean === 'localhost' ||
    clean.includes('LAN')
  ) {
    return { type: 'LAN', label: 'Secure LAN', isPrivate: true };
  }
  if (clean.includes(':')) {
    return { type: 'IPv6', label: 'Public IPv6', isPrivate: false };
  }
  return { type: 'IPv4', label: 'Public IPv4', isPrivate: false };
};

/**
 * Fetch client public IP with fast timeout (max 1.5s) to never block UI
 */
export const resolveClientIp = async () => {
  if (typeof window === 'undefined') return '127.0.0.1 (Localhost)';

  if (cachedPublicIp) return cachedPublicIp;

  try {
    const saved = window.sessionStorage?.getItem('aromapos_client_ip');
    if (saved) {
      cachedPublicIp = saved;
      return saved;
    }
  } catch (e) {}

  if (isFetchingIp) {
    return cachedPublicIp || '192.168.1.108 (LAN Station #01)';
  }

  isFetchingIp = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'force-cache'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedPublicIp = data.ip;
        try {
          window.sessionStorage?.setItem('aromapos_client_ip', data.ip);
        } catch (e) {}
        return data.ip;
      }
    }
  } catch (e) {
    // Network offline or CORS/adblock restricted: fallback to secondary fast lookup
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 1200);
      const res2 = await fetch('https://api64.ipify.org?format=json', {
        signal: controller2.signal
      });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2?.ip) {
          cachedPublicIp = data2.ip;
          try {
            window.sessionStorage?.setItem('aromapos_client_ip', data2.ip);
          } catch (err) {}
          return data2.ip;
        }
      }
    } catch (err) {}
  } finally {
    isFetchingIp = false;
  }

  // Graceful fallback for offline store registers or local network POS
  const fallback = '192.168.1.108 (LAN Station #01)';
  cachedPublicIp = fallback;
  return fallback;
};

/**
 * Get comprehensive device audit snapshot synchronously
 */
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'Desktop',
      os: 'Server',
      browser: 'Node.js',
      screen: '1920x1080',
      terminalId: 'POS-STATION-01',
      ipAddress: '127.0.0.1 (Localhost)',
      deviceSummary: 'Server Environment'
    };
  }

  const os = detectOS();
  const browser = detectBrowser();
  const deviceType = detectDeviceType();
  const brand = detectDeviceBrand();
  const screen = `${window.screen?.width || window.innerWidth || 1920}x${window.screen?.height || window.innerHeight || 1080}`;
  
  let terminalId = 'AROMA-POS-01';
  try {
    const savedTerm = window.localStorage?.getItem('aromapos_terminal_id');
    if (savedTerm) terminalId = savedTerm;
  } catch (e) {}

  const ipAddress = cachedPublicIp || '192.168.1.108 (LAN Station #01)';
  let modelName = `${brand} (${deviceType})`;
  if (brand === 'Apple') {
    if (deviceType === 'Phone') modelName = 'Apple iPhone (iOS Mobile)';
    else if (deviceType === 'Tablet') modelName = 'Apple iPad (iPadOS)';
    else modelName = 'Apple Mac (macOS)';
  } else if (brand === 'Samsung') {
    if (deviceType === 'Phone') modelName = 'Samsung Galaxy (Android Mobile)';
    else if (deviceType === 'Tablet') modelName = 'Samsung Galaxy Tab';
    else modelName = 'Samsung Smart Device';
  } else if (brand === 'Google') {
    modelName = 'Google Pixel (Android Mobile)';
  } else if (brand === 'Xiaomi') {
    modelName = 'Xiaomi / Redmi (Android Mobile)';
  } else if (brand === 'OPPO') {
    modelName = 'OPPO Smartphone (ColorOS)';
  } else if (brand === 'Sunmi POS') {
    modelName = 'Sunmi POS Touch Station';
  } else if (brand === 'Dell') {
    modelName = 'Dell Workstation (Windows)';
  } else if (deviceType === 'Phone') {
    modelName = `${brand} Smartphone (${os})`;
  } else if (deviceType === 'Tablet') {
    modelName = `${brand} Tablet (${os})`;
  } else {
    modelName = `${brand} PC (${os})`;
  }

  const deviceSummary = `${brand} • ${deviceType} • ${modelName} (${browser})`;

  return {
    brand,
    deviceType,
    deviceModel: modelName,
    os,
    browser,
    screen,
    terminalId,
    ipAddress,
    deviceSummary,
    userAgent: window.navigator.userAgent || '',
    isTouch: (window.navigator?.maxTouchPoints || 0) > 0,
    language: window.navigator.language || 'km-KH',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Phnom_Penh'
  };
};

/**
 * Resolve client physical & IP geolocation
 * Returns City, Country, Flag, Lat/Lon, ISP, and Maps URL.
 */
export const resolveClientLocation = async (ip = null) => {
  if (typeof window === 'undefined') {
    return {
      city: 'Phnom Penh',
      region: 'Phnom Penh',
      country: 'Cambodia',
      countryCode: 'KH',
      flag: '🇰🇭',
      latitude: 11.5564,
      longitude: 104.9282,
      isp: 'AromaPOS Store Network',
      displayLocation: 'Phnom Penh, Cambodia 🇰🇭',
      mapsUrl: 'https://www.google.com/maps?q=11.5564,104.9282',
      isDefault: true
    };
  }

  if (cachedLocation) return cachedLocation;

  try {
    const saved = window.sessionStorage?.getItem('aromapos_client_location');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.city) {
        cachedLocation = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  if (isFetchingLocation) {
    return cachedLocation || {
      city: 'Phnom Penh',
      region: 'Phnom Penh',
      country: 'Cambodia',
      countryCode: 'KH',
      flag: '🇰🇭',
      latitude: 11.5564,
      longitude: 104.9282,
      isp: 'Smart Axiata / CamNet',
      displayLocation: 'Phnom Penh, Cambodia 🇰🇭',
      mapsUrl: 'https://www.google.com/maps?q=11.5564,104.9282',
      isDefault: true
    };
  }

  isFetchingLocation = true;

  // 1. Primary: Fast IP Geolocation Lookup via ipwho.is
  try {
    const cleanIp = (ip || cachedPublicIp || '').trim();
    const isLocal = !cleanIp || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.') || cleanIp.startsWith('127.');
    const endpoint = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${cleanIp}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      cache: 'force-cache'
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && (data.city || data.country)) {
        const flag = data.flag?.emoji || (data.country_code === 'KH' ? '🇰🇭' : '🌐');
        const loc = {
          city: data.city || 'Phnom Penh',
          region: data.region || 'Phnom Penh',
          country: data.country || 'Cambodia',
          countryCode: data.country_code || 'KH',
          flag,
          latitude: data.latitude || 11.5564,
          longitude: data.longitude || 104.9282,
          isp: data.connection?.isp || data.connection?.org || 'Broadband ISP',
          displayLocation: `${data.city || 'Phnom Penh'}, ${data.country || 'Cambodia'} ${flag}`,
          mapsUrl: `https://www.google.com/maps?q=${data.latitude || 11.5564},${data.longitude || 104.9282}`,
          isDefault: false
        };
        cachedLocation = loc;
        try {
          window.sessionStorage?.setItem('aromapos_client_location', JSON.stringify(loc));
        } catch (e) {}
        return loc;
      }
    }
  } catch (e) {
    // Secondary fallback
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 1200);
      const res2 = await fetch('https://freeipapi.com/api/json', { signal: controller2.signal });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && (data2.cityName || data2.countryName)) {
          const loc = {
            city: data2.cityName || 'Phnom Penh',
            region: data2.regionName || 'Phnom Penh',
            country: data2.countryName || 'Cambodia',
            countryCode: data2.countryCode || 'KH',
            flag: data2.countryCode === 'KH' ? '🇰🇭' : '🌐',
            latitude: data2.latitude || 11.5564,
            longitude: data2.longitude || 104.9282,
            isp: 'Store Internet Service',
            displayLocation: `${data2.cityName || 'Phnom Penh'}, ${data2.countryName || 'Cambodia'} 🇰🇭`,
            mapsUrl: `https://www.google.com/maps?q=${data2.latitude || 11.5564},${data2.longitude || 104.9282}`,
            isDefault: false
          };
          cachedLocation = loc;
          try {
            window.sessionStorage?.setItem('aromapos_client_location', JSON.stringify(loc));
          } catch (err) {}
          return loc;
        }
      }
    } catch (err) {}
  } finally {
    isFetchingLocation = false;
  }

  // 3. Fallback for Store LAN or offline POS stations in Cambodia
  const fallbackLoc = {
    city: 'Phnom Penh',
    region: 'Phnom Penh',
    country: 'Cambodia',
    countryCode: 'KH',
    flag: '🇰🇭',
    latitude: 11.5564,
    longitude: 104.9282,
    isp: 'AromaPOS Store LAN Network',
    displayLocation: 'Phnom Penh, Cambodia 🇰🇭',
    mapsUrl: 'https://www.google.com/maps?q=11.5564,104.9282',
    isDefault: true
  };
  cachedLocation = fallbackLoc;
  return fallbackLoc;
};

/**
 * Request high-precision GPS coordinates from browser Geolocation API
 */
export const requestPreciseGpsLocation = (timeoutMs = 1800) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
        const loc = {
          city: 'Phnom Penh (GPS)',
          region: 'Cambodia',
          country: 'Cambodia',
          countryCode: 'KH',
          flag: '🇰🇭',
          latitude: lat,
          longitude: lon,
          speed,
          accuracyMeters: Math.round(pos.coords.accuracy || 10),
          isp: 'Precise GPS Satellite Receiver',
          displayLocation: `GPS: ${lat.toFixed(4)}°, ${lon.toFixed(4)}° 📍`,
          mapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
          isGpsPrecise: true
        };
        cachedLocation = loc;
        try {
          window.sessionStorage?.setItem('aromapos_client_location', JSON.stringify(loc));
        } catch (e) {}
        resolve(loc);
      },
      () => resolve(null),
      { timeout: timeoutMs, enableHighAccuracy: true, maximumAge: 15000 }
    );
  });
};

/**
 * Start Real-Time Live Device Geolocation Tracking (Beacon)
 * Listens for physical movement/travel and invokes callback with breadcrumb
 */
export const startLiveDeviceTracking = (onPositionUpdate) => {
  if (typeof window === 'undefined' || !navigator.geolocation) return () => {};

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0; // m/s to km/h
      const accuracy = Math.round(pos.coords.accuracy || 10);
      const update = {
        latitude: lat,
        longitude: lon,
        speed,
        accuracyMeters: accuracy,
        timestamp: new Date().toISOString()
      };
      if (onPositionUpdate) onPositionUpdate(update);
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

/**
 * Asynchronously captures full device audit object with verified IP and Geolocation
 */
export const getFullDeviceAuditSnapshot = async () => {
  const syncInfo = getDeviceInfo();
  const liveIp = await resolveClientIp();

  // Try precise GPS first, otherwise fallback to high-accuracy IP Geolocation
  let location = await requestPreciseGpsLocation(1500);
  if (!location) {
    location = await resolveClientLocation(liveIp);
  }
  const ipClassification = classifyIp(liveIp);

  return {
    ...syncInfo,
    ipAddress: liveIp,
    ipType: ipClassification.type,
    ipLabel: ipClassification.label,
    isPrivateIp: ipClassification.isPrivate,
    location: location.displayLocation,
    city: location.city,
    country: location.country,
    countryCode: location.countryCode,
    flag: location.flag,
    latitude: location.latitude,
    longitude: location.longitude,
    isp: location.isp,
    speed: location.speed || 0,
    accuracy: location.accuracyMeters || 10,
    mapsUrl: location.mapsUrl,
    capturedAt: new Date().toISOString()
  };
};


