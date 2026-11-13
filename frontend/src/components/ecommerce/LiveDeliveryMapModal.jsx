import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, 
  Bike, 
  MapPin, 
  Phone, 
  Coffee, 
  Clock, 
  ShieldCheck, 
  Navigation, 
  Compass, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';

/**
 * Route Waypoints in Phnom Penh from Aroma BKK1 Roastery to Customer
 */
const DEFAULT_ROUTE_POINTS = [
  { lat: 11.5508, lon: 104.9242, name: 'Aroma BKK1 Roastery (St. 57)' },
  { lat: 11.5530, lon: 104.9230, name: 'Monivong Blvd Junction' },
  { lat: 11.5565, lon: 104.9215, name: 'Independence Monument Circle' },
  { lat: 11.5598, lon: 104.9240, name: 'Norodom Blvd Expressway' },
  { lat: 11.5625, lon: 104.9265, name: 'Customer Destination (Sangkat Chaktomuk)' }
];

export const LiveDeliveryMapModal = ({
  isOpen,
  onClose,
  order = null
}) => {
  const { isKhmer } = useLanguage();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);

  // Rider Telemetry Simulation
  const [riderStep, setRiderStep] = useState(1);
  const [speed, setSpeed] = useState(32);
  const [etaMinutes, setEtaMinutes] = useState(12);

  // Step movement simulation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setRiderStep((prev) => {
        const next = (prev + 1) % DEFAULT_ROUTE_POINTS.length;
        // Random speed jitter between 26 and 38 km/h
        setSpeed(Math.floor(26 + Math.random() * 12));
        setEtaMinutes((m) => Math.max(3, m > 4 ? m - 1 : 12));
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Leaflet Map Initialization
  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const storePos = [DEFAULT_ROUTE_POINTS[0].lat, DEFAULT_ROUTE_POINTS[0].lon];
      const customerPos = [
        DEFAULT_ROUTE_POINTS[DEFAULT_ROUTE_POINTS.length - 1].lat,
        DEFAULT_ROUTE_POINTS[DEFAULT_ROUTE_POINTS.length - 1].lon
      ];

      const map = L.map(mapContainerRef.current, {
        center: [11.5565, 104.9230],
        zoom: 14,
        zoomControl: false
      });

      mapInstanceRef.current = map;

      // Dark Theme Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // 1. Store Origin Pin (Aroma Roastery)
      const storeHtml = `
        <div style="transform: translate(-50%, -50%);">
          <div style="background: #1c1917; border: 2px solid #f59e0b; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px;">
            ☕
          </div>
        </div>
      `;
      L.marker(storePos, { icon: L.divIcon({ html: storeHtml, className: 'store-pin' }) })
        .addTo(map)
        .bindPopup('<b>Aroma Coffee Roastery</b><br>Origin Kitchen (St. 57, BKK1)');

      // 2. Customer Destination Pin
      const custHtml = `
        <div style="transform: translate(-50%, -50%);">
          <div style="background: #e11d48; border: 2px solid #ffffff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(225,29,72,0.5); font-size: 14px; color: white;">
            📍
          </div>
        </div>
      `;
      L.marker(customerPos, { icon: L.divIcon({ html: custHtml, className: 'cust-pin' }) })
        .addTo(map)
        .bindPopup(`<b>${order?.customerName || 'Customer Delivery'}</b><br>${order?.deliveryAddress || 'Phnom Penh'}`);

      // 3. Polyline Route
      const latlngs = DEFAULT_ROUTE_POINTS.map(p => [p.lat, p.lon]);
      L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      // 4. Moving Rider Marker
      const currentPt = DEFAULT_ROUTE_POINTS[riderStep];
      const riderHtml = `
        <div style="transform: translate(-50%, -50%); position: relative;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; background: #047857; border: 2px solid #ffffff; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4,120,87,0.6); font-size: 18px; color: white;">
            🛵
          </div>
        </div>
      `;

      const riderMarker = L.marker([currentPt.lat, currentPt.lon], {
        icon: L.divIcon({ html: riderHtml, className: 'rider-pin' }),
        zIndexOffset: 1000
      }).addTo(map);

      riderMarkerRef.current = riderMarker;

      map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    }).catch(err => console.error('Leaflet load error', err));

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update Rider position smoothly on step change
  useEffect(() => {
    if (!riderMarkerRef.current || !mapInstanceRef.current) return;
    const pt = DEFAULT_ROUTE_POINTS[riderStep];
    riderMarkerRef.current.setLatLng([pt.lat, pt.lon]);
  }, [riderStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {isKhmer ? 'តាមដានអ្នកដឹកជញ្ជូនផ្ទាល់' : 'Live Delivery Radar'}
                </h3>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  #{order?.orderNumber || 'ORD-ONL-9042'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Aroma Express Logistics • Phnom Penh Fast City Delivery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative w-full h-full min-h-[300px] bg-stone-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Live Telemetry HUD */}
          <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-stone-950/90 backdrop-blur-md border border-stone-800 shadow-xl flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE GPS</span>
            </div>
            <span className="text-stone-600">|</span>
            <div className="font-mono text-stone-200">
              Speed: <strong className="text-amber-400">{speed} km/h</strong>
            </div>
            <span className="text-stone-600">|</span>
            <div className="font-mono text-stone-200">
              ETA: <strong className="text-emerald-400">~{etaMinutes} mins</strong>
            </div>
          </div>
        </div>

        {/* Rider & Delivery Footer Details */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          {/* Driver Profile */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0 shadow">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-white">Dara Express Rider</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Verified Barista Courier
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Honda Click 160cc • Insulated Thermal Coffee Bag (65°C)
              </p>
            </div>
          </div>

          {/* Delivery Destination Snapshot */}
          <div className="text-left md:text-right text-xs text-stone-400 w-full md:w-auto">
            <p className="font-bold text-stone-200 truncate max-w-xs">
              📍 {order?.deliveryAddress || 'Sangkat Chaktomuk, Khan Daun Penh, Phnom Penh'}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Recipient: {order?.customerName || 'Customer'} ({order?.customerPhone || '012 888 999'})
            </p>
          </div>

          {/* Action Buttons: Call Rider, Call Store */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <a
              href="tel:+85512345678"
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{isKhmer ? 'ទូរស័ព្ទទៅអ្នកដឹក' : 'Call Rider'}</span>
            </a>

            <a
              href="tel:+85523999888"
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isKhmer ? 'ទាក់ទងហាង' : 'Store'}</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition cursor-pointer"
            >
              {isKhmer ? 'បិទ' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
