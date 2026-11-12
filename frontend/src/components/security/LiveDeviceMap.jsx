import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  MapPin,
  Navigation,
  Globe,
  Radio,
  Layers,
  Crosshair,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  User,
  ExternalLink,
  X,
  Wifi,
  Compass
} from 'lucide-react';

const MAP_LAYERS = {
  dark: {
    name: 'Dark Matter (Night)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 19
  },
  street: {
    name: 'Street Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    subdomains: 'abc',
    maxZoom: 19
  }
};

export const LiveDeviceMap = ({
  sessions = [],
  focusedSessionId = null,
  isModal = false,
  isOpen = true,
  onClose = () => {},
  className = ''
}) => {
  const { isKhmer } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const tileLayerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('dark');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [userGpsPosition, setUserGpsPosition] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Filter valid sessions with coordinates
  const mappedSessions = useMemo(() => {
    return (sessions || []).map((s, idx) => {
      // Fallback coordinate mapping for Cambodia branches
      let lat = typeof s.latitude === 'number' ? s.latitude : 11.5564;
      let lon = typeof s.longitude === 'number' ? s.longitude : 104.9282;

      // Jitter slightly if coordinates overlap exactly so pins don't cover each other
      const jitterLat = lat + ((idx % 3) - 1) * 0.0025;
      const jitterLon = lon + ((Math.floor(idx / 3) % 3) - 1) * 0.0025;

      return {
        ...s,
        effectiveLat: lat || jitterLat,
        effectiveLon: lon || jitterLon
      };
    });
  }, [sessions]);

  // Count active vs idle
  const activeCount = useMemo(() => {
    return mappedSessions.filter((s) => s.status === 'ACTIVE').length;
  }, [mappedSessions]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current) return;
    if (isModal && !isOpen) return;

    let isMounted = true;

    // Dynamically import leaflet
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: Phnom Penh or first session
      const defaultCenter = mappedSessions.length > 0 && mappedSessions[0].effectiveLat
        ? [mappedSessions[0].effectiveLat, mappedSessions[0].effectiveLon]
        : [11.5564, 104.9282];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: false
      });

      // Add Tile Layer
      const cfg = MAP_LAYERS[activeLayer];
      const tiles = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: cfg.maxZoom
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      // Zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Render Session Markers
      renderMarkers(L, map, mappedSessions);

      // Focus session if specified
      if (focusedSessionId) {
        const found = mappedSessions.find((s) => s.id === focusedSessionId);
        if (found) {
          map.setView([found.effectiveLat, found.effectiveLon], 15);
          setSelectedSession(found);
        }
      }
    }).catch((err) => {
      console.error('Failed to load Leaflet:', err);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, isModal]);

  // Re-render markers when sessions change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      if (mapInstanceRef.current) {
        renderMarkers(L, mapInstanceRef.current, mappedSessions);
      }
    });
  }, [mappedSessions]);

  // Switch Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    import('leaflet').then((L) => {
      const cfg = MAP_LAYERS[activeLayer];
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newTiles = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: cfg.maxZoom
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTiles;
    });
  }, [activeLayer]);

  // Handle focused session update
  useEffect(() => {
    if (!mapInstanceRef.current || !focusedSessionId) return;
    const found = mappedSessions.find((s) => s.id === focusedSessionId);
    if (found) {
      mapInstanceRef.current.flyTo([found.effectiveLat, found.effectiveLon], 15, { duration: 1.2 });
      setSelectedSession(found);
    }
  }, [focusedSessionId, mappedSessions]);

  // Render Custom Animated HTML Markers
  const renderMarkers = (L, map, items) => {
    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    items.forEach((s) => {
      const isActive = s.status === 'ACTIVE';
      const isSelected = selectedSession?.id === s.id;

      // Custom HTML Pin
      const pinHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -50%);">
          ${isActive ? `
            <div class="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-ping opacity-75"></div>
            <div class="absolute -inset-1.5 rounded-full bg-emerald-500/20 blur-[2px]"></div>
          ` : ''}
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            isSelected
              ? 'bg-amber-500 border-white text-stone-950 scale-125 shadow-xl shadow-amber-500/50'
              : isActive
              ? 'bg-emerald-600 border-emerald-300 text-white shadow-lg shadow-emerald-950/80'
              : 'bg-stone-800 border-stone-600 text-stone-300 shadow-md'
          } transition-all duration-300 hover:scale-125">
            <span class="text-[11px] font-black tracking-tight">${s.flag || '🇰🇭'}</span>
            ${isActive ? `
              <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border border-stone-900 rounded-full"></span>
            ` : ''}
          </div>
          <div class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-950/90 backdrop-blur-md border border-stone-700/80 shadow-lg text-[10px] font-bold text-stone-100 pointer-events-none flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-stone-500'}"></span>
            <span>${s.userName || 'Station'}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-live-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([s.effectiveLat, s.effectiveLon], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedSession(s);
          map.flyTo([s.effectiveLat, s.effectiveLon], 15, { duration: 0.8 });
        });

      markersRef.current.push(marker);
    });
  };

  // Locate Current Device with GPS
  const handleLocateMyDevice = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert(isKhmer ? 'ឧបករណ៍នេះមិនគាំទ្រ GPS ទេ' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const { latitude, longitude } = pos.coords;
        setUserGpsPosition({ latitude, longitude });

        if (mapInstanceRef.current) {
          import('leaflet').then((L) => {
            const gpsHtml = `
              <div class="relative flex items-center justify-center cursor-pointer" style="transform: translate(-50%, -50%);">
                <div class="absolute -inset-4 rounded-full bg-cyan-500/30 animate-ping"></div>
                <div class="relative w-8 h-8 rounded-full bg-cyan-600 border-2 border-white text-white flex items-center justify-center shadow-xl shadow-cyan-950">
                  <span class="text-xs">📍</span>
                </div>
                <div class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-cyan-950/95 border border-cyan-500 text-[10px] font-bold text-cyan-200">
                  ${isKhmer ? 'ឧបករណ៍បច្ចុប្បន្នរបស់អ្នក' : 'Your Live Device'}
                </div>
              </div>
            `;
            const icon = L.divIcon({
              html: gpsHtml,
              className: 'user-gps-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });
            L.marker([latitude, longitude], { icon }).addTo(mapInstanceRef.current);
            mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.5 });
          });
        }
      },
      () => {
        setIsLocatingUser(false);
        // Fallback to Phnom Penh
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([11.5564, 104.9282], 14);
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // Center on Cambodia bounds
  const handleFitCambodia = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([12.5657, 104.9910], 8, { duration: 1 });
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className={`relative flex flex-col bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl ${className} ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-0' : 'h-[620px]'}`}>
      
      {/* Top Map Toolbar */}
      <div className="z-10 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Live Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/50">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-stone-100 tracking-tight flex items-center gap-1.5">
                <span>{isKhmer ? 'ផែនទីផ្ទៀងផ្ទាត់ទីតាំងឧបករណ៍ផ្ទាល់' : 'Real-Time Device Geolocation Map'}</span>
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeCount} {isKhmer ? 'ឧបករណ៍ Online' : 'Active Online'}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>{isKhmer ? 'ផ្ទៀងផ្ទាត់សុវត្ថិភាព IP, GPS និងបណ្តាញ ISP' : 'Zero-Trust Geolocation & Network Audit'}</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-stone-500">
                {isKhmer ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Updated'}: {lastRefreshed.toLocaleTimeString()}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Controls & Layer Switcher */}
        <div className="flex items-center gap-2">
          {/* Map Layer Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveLayer('dark')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'dark' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
              title="CartoDB Dark Matter"
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('street')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'street' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
              title="Street Voyager"
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'satellite' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
              title="Satellite Imagery"
            >
              Satellite
            </button>
          </div>

          {/* Locate My GPS Device */}
          <button
            type="button"
            onClick={handleLocateMyDevice}
            disabled={isLocatingUser}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title={isKhmer ? 'ស្វែងរកទីតាំងឧបករណ៍បច្ចុប្បន្ន' : 'Locate My Station (GPS)'}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isKhmer ? 'ទីតាំងខ្ញុំ' : 'My GPS'}</span>
          </button>

          {/* Fit Cambodia */}
          <button
            type="button"
            onClick={handleFitCambodia}
            className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            title={isKhmer ? 'ពង្រីកមើលទូទាំងប្រទេសកម្ពុជា' : 'Fit Cambodia View'}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">🇰🇭 {isKhmer ? 'កម្ពុជា' : 'Cambodia'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 hover:text-stone-100 transition cursor-pointer"
            title={isFullscreen ? 'ចាកចេញពីពេញអេក្រង់' : 'ពេញអេក្រង់'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Modal (if in modal mode) */}
          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-500/20 border border-stone-700 hover:border-rose-500/40 text-stone-300 hover:text-rose-300 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Body + Side Drawer */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full bg-stone-950" />

        {/* Floating Quick Jump Stations Selector */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[80%] pointer-events-auto">
          {mappedSessions.map((s) => {
            const isSelected = selectedSession?.id === s.id;
            const isActive = s.status === 'ACTIVE';
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSession(s);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([s.effectiveLat, s.effectiveLon], 15, { duration: 1 });
                  }
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border backdrop-blur-md transition flex items-center gap-1.5 shadow-lg ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 border-amber-400 font-black scale-105'
                    : 'bg-stone-900/90 text-stone-200 border-stone-700/80 hover:bg-stone-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                <span className="truncate max-w-[110px]">{s.userName}</span>
                <span className="text-[10px] opacity-75">{s.flag || '🇰🇭'}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Session Inspector Overlay Card */}
        {selectedSession && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10 bg-stone-950/95 backdrop-blur-xl border border-stone-800 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
            <div className="flex items-start justify-between gap-3 border-b border-stone-850 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-extrabold text-sm">
                  {selectedSession.userName?.slice(0, 2).toUpperCase() || 'POS'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-stone-100">{selectedSession.userName}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      {selectedSession.userRole || 'CASHIER'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="font-semibold text-rose-300 truncate">
                      {selectedSession.location || 'Phnom Penh, Cambodia 🇰🇭'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Audit Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-850">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {isKhmer ? 'អាសយដ្ឋាន IP' : 'IP Address'}
                </span>
                <span className="font-mono font-bold text-cyan-300 text-[11px] truncate block mt-0.5">
                  {selectedSession.ipAddress || '127.0.0.1'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-850">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {isKhmer ? 'កូអរដោនេ GPS' : 'GPS Coordinates'}
                </span>
                <span className="font-mono font-bold text-amber-300 text-[11px] truncate block mt-0.5">
                  {selectedSession.effectiveLat.toFixed(4)}°, {selectedSession.effectiveLon.toFixed(4)}°
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-850">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {isKhmer ? 'ឧបករណ៍ & OS' : 'Device & OS'}
                </span>
                <span className="font-semibold text-stone-200 text-[11px] truncate block mt-0.5">
                  {selectedSession.deviceModel || selectedSession.os || 'Windows 11'}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-850">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {isKhmer ? 'អ្នកផ្គត់ផ្គង់ ISP' : 'ISP Provider'}
                </span>
                <span className="font-semibold text-emerald-300 text-[11px] truncate block mt-0.5">
                  {selectedSession.isp || 'Smart / CamNet'}
                </span>
              </div>
            </div>

            {/* Google Maps External Button */}
            <div className="mt-3 pt-2.5 border-t border-stone-850 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-stone-500">
                Status: <strong className={selectedSession.status === 'ACTIVE' ? 'text-emerald-400' : 'text-stone-400'}>{selectedSession.status}</strong>
              </span>

              <a
                href={selectedSession.mapsUrl || `https://www.google.com/maps?q=${selectedSession.effectiveLat},${selectedSession.effectiveLon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950 transition"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'បើកលើ Google Maps' : 'Open in Google Maps'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-5xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
