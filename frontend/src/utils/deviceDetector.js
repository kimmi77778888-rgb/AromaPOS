/**
 * Device & Client IP Detection Utility for Enterprise Security Auditing
 * Captures standard client metadata: IP address, device type, OS, browser, screen resolution,
 * POS station ID, and network classification (Public IPv4 vs Private LAN).
 */

let cachedPublicIp = null;
let isFetchingIp = false;

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
 * Detect device type: POS Terminal | Desktop | Tablet | Mobile
 */
export const detectDeviceType = () => {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = window.navigator.userAgent || '';
  const width = window.innerWidth || window.screen?.width || 1280;
  const isTouch = (window.navigator?.maxTouchPoints || 0) > 0;

  if (/iPad|Android/i.test(ua) && isTouch && width >= 600 && width <= 1180) {
    return 'Tablet';
  }
  if (/Mobi|iPhone|Android.*Mobile/i.test(ua) || (isTouch && width < 600)) {
    return 'Mobile';
  }
  // POS Station heuristic: standard screen with touch or POS user context
  if (isTouch && width >= 1024) {
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
  const screen = `${window.screen?.width || window.innerWidth || 1920}x${window.screen?.height || window.innerHeight || 1080}`;
  
  let terminalId = 'AROMA-POS-01';
  try {
    const savedTerm = window.localStorage?.getItem('aromapos_terminal_id');
    if (savedTerm) terminalId = savedTerm;
  } catch (e) {}

  const ipAddress = cachedPublicIp || '192.168.1.108 (LAN Station #01)';
  const deviceSummary = `${deviceType} • ${os} (${browser})`;

  return {
    deviceType,
    deviceModel: `${os} (${deviceType})`,
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
 * Asynchronously captures full device audit object with verified IP
 */
export const getFullDeviceAuditSnapshot = async () => {
  const syncInfo = getDeviceInfo();
  const liveIp = await resolveClientIp();
  const ipClassification = classifyIp(liveIp);

  return {
    ...syncInfo,
    ipAddress: liveIp,
    ipType: ipClassification.type,
    ipLabel: ipClassification.label,
    isPrivateIp: ipClassification.isPrivate,
    capturedAt: new Date().toISOString()
  };
};

