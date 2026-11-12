import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { startLiveDeviceTracking, getBrandBadge } from '../../utils/deviceDetector';
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
  Compass,
  Play,
  Pause,
  RotateCcw,
  Route,
  Activity,
  Gauge,
  Clock,
  Car,
  BellRing
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

// Haversine distance calculator between 2 GPS coordinates in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const LiveDeviceMap = ({
  sessions = [],
  focusedSessionId = null,
  isModal = false,
  isOpen = true,
  onClose = () => {},
  onOpenRemoteDevice = null,
  className = ''
}) => {
  const { isKhmer } = useLanguage();
  const { triggerDeviceAlarm } = useApp();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);
  const routeMarkersRef = useRef([]);
  const movingTracerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  const [activeLayer, setActiveLayer] = useState('dark');
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Travel Route State
  const [showTravelRoute, setShowTravelRoute] = useState(true);
  const [selectedStaffRoute, setSelectedStaffRoute] = useState('ALL');
  const [travelBreadcrumbs, setTravelBreadcrumbs] = useState([]);
  const [isPlayingRoute, setIsPlayingRoute] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLiveBeaconActive, setIsLiveBeaconActive] = useState(false);

  // Load Travel Breadcrumbs from API / Local Storage
  const loadTravelData = useCallback(async () => {
    try {
      const data = await api.fetchDeviceTravel(selectedStaffRoute);
      if (Array.isArray(data) && data.length > 0) {
        setTravelBreadcrumbs(data);
      }
    } catch (e) {}
    setLastRefreshed(new Date());
  }, [selectedStaffRoute]);

  useEffect(() => {
    loadTravelData();
  }, [loadTravelData]);

  // Live Beacon Watcher
  useEffect(() => {
    if (!isLiveBeaconActive) return;
    const stopWatcher = startLiveDeviceTracking((pos) => {
      const newCrumb = {
        id: 'live-' + Date.now(),
        userId: 'current-user',
        userName: isKhmer ? 'ឧបករណ៍បច្ចុប្បន្ន' : 'Current Active Station',
        location: `GPS: ${pos.latitude.toFixed(4)}°, ${pos.longitude.toFixed(4)}° 📍`,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed || 0,
        accuracy: pos.accuracyMeters || 10,
        isp: 'Live Device GPS Beacon',
        activity: pos.speed > 5 ? 'MOVING' : 'STATIONARY',
        timestamp: new Date().toISOString()
      };
      api.pingDeviceLocation(newCrumb);
      setTravelBreadcrumbs((prev) => [...prev, newCrumb]);
    });
    return () => {
      if (stopWatcher) stopWatcher();
    };
  }, [isLiveBeaconActive, isKhmer]);

  // Filter valid sessions with coordinates
  const mappedSessions = useMemo(() => {
    return (sessions || []).map((s, idx) => {
      let lat = typeof s.latitude === 'number' ? s.latitude : 11.5564;
      let lon = typeof s.longitude === 'number' ? s.longitude : 104.9282;

      const jitterLat = lat + ((idx % 3) - 1) * 0.0025;
      const jitterLon = lon + ((Math.floor(idx / 3) % 3) - 1) * 0.0025;

      return {
        ...s,
        effectiveLat: lat || jitterLat,
        effectiveLon: lon || jitterLon
      };
    });
  }, [sessions]);

  // Route points sorted chronologically
  const activeRoutePoints = useMemo(() => {
    let list = travelBreadcrumbs;
    if (selectedStaffRoute !== 'ALL') {
      list = list.filter((b) => b.userId === selectedStaffRoute || b.userName === selectedStaffRoute);
    }
    return [...list].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [travelBreadcrumbs, selectedStaffRoute]);

  // Compute Total Travel Distance & Stats
  const travelStats = useMemo(() => {
    let dist = 0;
    for (let i = 1; i < activeRoutePoints.length; i++) {
      dist += calculateDistanceKm(
        activeRoutePoints[i - 1].latitude,
        activeRoutePoints[i - 1].longitude,
        activeRoutePoints[i].latitude,
        activeRoutePoints[i].longitude
      );
    }
    const currentSpeed = activeRoutePoints.length > 0
      ? activeRoutePoints[activeRoutePoints.length - 1].speed || 0
      : 0;

    return {
      totalDistanceKm: Math.round(dist * 10) / 10,
      totalStops: activeRoutePoints.length,
      currentSpeed,
      isMoving: currentSpeed > 5
    };
  }, [activeRoutePoints]);

  const activeCount = useMemo(() => {
    return mappedSessions.filter((s) => s.status === 'ACTIVE').length;
  }, [mappedSessions]);

  // Clear travel route helper
  const clearTravelRoute = (map) => {
    if (routeLayerRef.current && map) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (map) {
      routeMarkersRef.current.forEach((m) => map.removeLayer(m));
    }
    routeMarkersRef.current = [];
    if (movingTracerRef.current && map) {
      map.removeLayer(movingTracerRef.current);
      movingTracerRef.current = null;
    }
  };

  // Render Travel Route Path and Milestone Pins
  const renderTravelRoute = (L, map, points) => {
    clearTravelRoute(map);
    if (!points || points.length === 0) return;

    const latlngs = points.map((p) => [p.latitude, p.longitude]);

    // 1. Draw Polyline Path with amber glow and dash
    const polyline = L.polyline(latlngs, {
      color: '#f59e0b',
      weight: 4,
      opacity: 0.9,
      dashArray: '10, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    routeLayerRef.current = polyline;

    // 2. Render Checkpoint Milestone Pins (①, ②, ③, ④)
    points.forEach((pt, idx) => {
      const isStart = idx === 0;
      const isLatest = idx === points.length - 1;
      const stopNum = idx + 1;
      const timeStr = pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      const milestoneHtml = `
        <div class="relative cursor-pointer group" style="transform: translate(-50%, -50%);">
          <div class="relative w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] border-2 shadow-lg transition-transform group-hover:scale-125 ${
            isLatest
              ? 'bg-rose-600 border-white text-white animate-pulse shadow-rose-950'
              : isStart
              ? 'bg-emerald-600 border-white text-white shadow-emerald-950'
              : 'bg-stone-900 border-amber-400 text-amber-300'
          }">
            ${isLatest ? '📍' : stopNum}
          </div>
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-stone-950/95 border border-stone-800 text-[9px] font-mono font-bold text-amber-200 pointer-events-none shadow">
            ${timeStr}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: milestoneHtml,
        className: 'route-milestone-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([pt.latitude, pt.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs font-sans text-stone-900">
            <p class="font-extrabold text-sm mb-1">${pt.location || 'Store Checkpoint'}</p>
            <p class="text-[11px] text-stone-600">Time: <strong>${new Date(pt.timestamp).toLocaleString()}</strong></p>
            <p class="text-[11px] text-stone-600">Speed: <strong>${pt.speed || 0} km/h</strong> • Accuracy: ±${pt.accuracy || 10}m</p>
            <p class="text-[11px] text-stone-600">Network: <strong>${pt.isp || 'Broadband Network'}</strong></p>
          </div>
        `);

      routeMarkersRef.current.push(marker);
    });

    try {
      map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 15 });
    } catch (e) {}
  };

  // Render Static Stations Markers
  const renderMarkers = (L, map, items) => {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    items.forEach((s) => {
      const isActive = s.status === 'ACTIVE';
      const isSelected = selectedSession?.id === s.id;

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
            <span class="text-[11px] font-black tracking-tight">${(s.deviceType === 'Phone' || s.deviceType === 'Mobile') ? '📱' : (s.flag || '🇰🇭')}</span>
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current) return;
    if (isModal && !isOpen) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter = mappedSessions.length > 0 && mappedSessions[0].effectiveLat
        ? [mappedSessions[0].effectiveLat, mappedSessions[0].effectiveLon]
        : [11.5564, 104.9282];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      const cfg = MAP_LAYERS[activeLayer];
      const tiles = L.tileLayer(cfg.url, {
        attribution: cfg.attribution,
        subdomains: cfg.subdomains,
        maxZoom: cfg.maxZoom
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      renderMarkers(L, map, mappedSessions);

      if (showTravelRoute && activeRoutePoints.length > 0) {
        renderTravelRoute(L, map, activeRoutePoints);
      }

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

  // Update Stations Markers
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

  // Re-draw Travel Route when Route Points or Toggle Changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      if (showTravelRoute && activeRoutePoints.length > 0) {
        renderTravelRoute(L, mapInstanceRef.current, activeRoutePoints);
      } else {
        clearTravelRoute(mapInstanceRef.current);
      }
    });
  }, [showTravelRoute, activeRoutePoints]);

  // Animated Route Playback Controller
  useEffect(() => {
    if (!isPlayingRoute) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }

    if (activeRoutePoints.length === 0) return;

    const intervalTime = Math.max(800, 2000 / playbackSpeed);

    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= activeRoutePoints.length) {
          setIsPlayingRoute(false);
          return activeRoutePoints.length - 1;
        }

        const currentPoint = activeRoutePoints[nextIdx];
        if (mapInstanceRef.current && currentPoint) {
          import('leaflet').then((L) => {
            const tracerHtml = `
              <div class="relative flex items-center justify-center cursor-pointer" style="transform: translate(-50%, -50%);">
                <div class="absolute -inset-3 rounded-full bg-amber-500/40 animate-ping"></div>
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border-2 border-white text-white flex items-center justify-center shadow-xl shadow-amber-950 font-bold text-xs">
                  🚗
                </div>
              </div>
            `;
            const tracerIcon = L.divIcon({
              html: tracerHtml,
              className: 'travel-tracer-icon',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            });

            if (movingTracerRef.current) {
              movingTracerRef.current.setLatLng([currentPoint.latitude, currentPoint.longitude]);
            } else {
              movingTracerRef.current = L.marker([currentPoint.latitude, currentPoint.longitude], { icon: tracerIcon })
                .addTo(mapInstanceRef.current);
            }

            mapInstanceRef.current.panTo([currentPoint.latitude, currentPoint.longitude], { animate: true, duration: 0.8 });
          });
        }
        return nextIdx;
      });
    }, intervalTime);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlayingRoute, activeRoutePoints, playbackSpeed]);

  const handleResetPlayback = () => {
    setIsPlayingRoute(false);
    setPlaybackIndex(0);
    if (activeRoutePoints.length > 0 && mapInstanceRef.current) {
      const first = activeRoutePoints[0];
      mapInstanceRef.current.panTo([first.latitude, first.longitude]);
      if (movingTracerRef.current) {
        movingTracerRef.current.setLatLng([first.latitude, first.longitude]);
      }
    }
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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([11.5564, 104.9282], 14);
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className={`relative flex flex-col bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl ${className} ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-0' : 'h-[660px]'}`}>
      
      {/* Top Map Toolbar */}
      <div className="z-10 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title, Live Stats & Beacon Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/50">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-stone-100 tracking-tight">
                {isKhmer ? 'ផែនទីផ្ទៀងផ្ទាត់ទីតាំង & ផ្លូវធ្វើដំណើរផ្ទាល់' : 'Real-Time Device Location & Travel Tracker'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeCount} {isKhmer ? 'ស្ថានីយ Online' : 'Stations Online'}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
              <Route className="w-3.5 h-3.5 text-amber-400" />
              <span>{isKhmer ? 'ចម្ងាយធ្វើសរុប:' : 'Total Distance:'} <strong className="text-amber-300 font-mono">{travelStats.totalDistanceKm} km</strong> ({travelStats.totalStops} {isKhmer ? 'ទីតាំង' : 'Checkpoints'})</span>
              <span>•</span>
              <span className="font-mono text-[10px] text-stone-500">{lastRefreshed.toLocaleTimeString()}</span>
            </p>
          </div>
        </div>

        {/* Right: Controls & Layer Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Travel Route Toggle */}
          <button
            type="button"
            onClick={() => setShowTravelRoute(!showTravelRoute)}
            className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              showTravelRoute
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title={isKhmer ? 'បង្ហាញ ឬលាក់ផ្លូវធ្វើដំណើរ' : 'Toggle Device Travel Path'}
          >
            <Route className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKhmer ? 'ផ្លូវធ្វើដំណើរ' : 'Travel Path'}</span>
          </button>

          {/* Real-time Beacon Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveBeaconActive(!isLiveBeaconActive)}
            className={`px-2.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isLiveBeaconActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-pulse'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
            title={isKhmer ? 'បើកការចាប់យក GPS ពេលធ្វើដំណើរ' : 'Toggle Live GPS Beacon'}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isLiveBeaconActive ? (isKhmer ? 'Beacon កំពុងដើរ' : 'Beacon Active') : (isKhmer ? 'Beacon GPS' : 'Live Beacon')}</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveLayer('dark')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'dark' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('street')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'street' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg transition ${activeLayer === 'satellite' ? 'bg-stone-800 text-amber-300 shadow' : 'text-stone-400 hover:text-stone-200'}`}
            >
              Satellite
            </button>
          </div>

          {/* Locate My GPS Device */}
          <button
            type="button"
            onClick={handleLocateMyDevice}
            disabled={isLocatingUser}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title={isKhmer ? 'ស្វែងរកទីតាំងឧបករណ៍បច្ចុប្បន្ន' : 'Locate My Station (GPS)'}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isKhmer ? 'ទីតាំងខ្ញុំ' : 'My GPS'}</span>
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={loadTravelData}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 hover:text-stone-100 transition cursor-pointer"
            title={isKhmer ? 'ទាញយកទិន្នន័យឡើងវិញ' : 'Refresh Data'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
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

      {/* Main Map Body + Floating Overlays */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Leaflet Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full bg-stone-950" />

        {/* Floating Travel Route Playback Bar (bottom center) */}
        {showTravelRoute && activeRoutePoints.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-stone-950/95 backdrop-blur-xl border border-stone-800 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 pointer-events-auto">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlayingRoute(!isPlayingRoute)}
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-lg transition cursor-pointer active:scale-95"
              title={isPlayingRoute ? 'Pause Route' : 'Play Travel Animation'}
            >
              {isPlayingRoute ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-stone-950 ml-0.5" />}
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetPlayback}
              className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-200 border border-stone-800 transition cursor-pointer"
              title="Reset Travel Animation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Multiplier */}
            <button
              type="button"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              className="px-2 py-1 rounded-lg bg-stone-900 border border-stone-800 text-[10px] font-mono font-bold text-amber-300 hover:bg-stone-850 transition"
              title="Playback Speed"
            >
              {playbackSpeed}x Speed
            </button>

            {/* Current Stop Indicator */}
            <div className="hidden sm:flex items-center gap-2 border-l border-stone-800 pl-3">
              <span className="text-[11px] font-bold text-stone-200">
                {isKhmer ? 'ចំណតទី' : 'Stop'} {playbackIndex + 1} / {activeRoutePoints.length}
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                {activeRoutePoints[playbackIndex]?.speed || 0} km/h
              </span>
            </div>
          </div>
        )}

        {/* Floating Quick Stations & Route Filter Chips (top-left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[85%] pointer-events-auto">
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
                <span className="text-[11px]">
                  {s.deviceType === 'Phone' || s.deviceType === 'Mobile' ? '📱' : s.deviceType === 'Tablet' ? '📟' : s.deviceType?.includes('POS') ? '📠' : '🖥️'}
                </span>
                <span className="truncate max-w-[110px]">{s.userName}</span>
                <span className="text-[10px] opacity-75">{s.flag || '🇰🇭'}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Session Inspector Overlay Card */}
        {selectedSession && (
          <div className="absolute top-14 right-4 sm:w-96 z-10 bg-stone-950/95 backdrop-blur-xl border border-stone-800 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200 pointer-events-auto">
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
                    {selectedSession.isDemo ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-800 text-stone-400 border border-stone-700">
                        🧪 Demo Sample
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        🟢 Real Live
                      </span>
                    )}
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
                  {isKhmer ? 'ម៉ាកយីហោ (Brand)' : 'Device Brand'}
                </span>
                {(() => {
                  const b = getBrandBadge(selectedSession.brand || selectedSession.deviceModel);
                  return (
                    <span className="font-extrabold text-amber-300 text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                      <span>{b.icon}</span>
                      <strong className="text-stone-100">{b.name}</strong>
                    </span>
                  );
                })()}
              </div>

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
                <span className="font-semibold text-stone-200 text-[11px] truncate block mt-0.5 flex items-center gap-1">
                  <span>{selectedSession.deviceType === 'Phone' || selectedSession.deviceType === 'Mobile' ? '📱' : selectedSession.deviceType === 'Tablet' ? '📟' : '🖥️'}</span>
                  <span className="truncate">{selectedSession.deviceModel || selectedSession.os || 'Windows 11'}</span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-900/80 border border-stone-850 col-span-2">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  {isKhmer ? 'អ្នកផ្គត់ផ្គង់ ISP' : 'ISP Provider'}
                </span>
                <span className="font-semibold text-emerald-300 text-[11px] truncate block mt-0.5">
                  {selectedSession.isp || 'Smart / CamNet'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 pt-2.5 border-t border-stone-850 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-stone-500">
                Status: <strong className={selectedSession.status === 'ACTIVE' ? 'text-emerald-400' : 'text-stone-400'}>{selectedSession.status}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                {/* Sound Alarm Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (triggerDeviceAlarm) {
                      triggerDeviceAlarm({
                        targetSessionId: selectedSession.id,
                        targetUserName: selectedSession.userName,
                        message: `Urgent staff call from manager on ${selectedSession.deviceModel || 'device'}!`,
                        soundType: 'SIREN'
                      });
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow"
                  title={isKhmer ? 'បន្លឺសំឡេងរោទ៍ Alarm' : 'Send Sound Alarm'}
                >
                  <BellRing className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">{isKhmer ? 'រោទ៍' : 'Alarm'}</span>
                </button>

                {onOpenRemoteDevice && (
                  <button
                    type="button"
                    onClick={() => onOpenRemoteDevice(selectedSession)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                    title={isKhmer ? 'បើកមើលអេក្រង់ឧបករណ៍នេះ' : 'Open Remote Device Screen'}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បើកឧបករណ៍' : 'Open Device'}</span>
                  </button>
                )}

                <a
                  href={selectedSession.mapsUrl || `https://www.google.com/maps?q=${selectedSession.effectiveLat},${selectedSession.effectiveLon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
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
