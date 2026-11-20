import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { soundService } from '../../services/soundService';
import confetti from 'canvas-confetti';
import { 
  X, 
  Bike, 
  Phone, 
  CheckCircle2, 
  PackageCheck,
  RotateCw
} from 'lucide-react';
import { 
  ROASTERY_HQ, 
  geocodeDeliveryAddress, 
  fetchOsrmRoute, 
  getLiveDeviceLocation 
} from '../../services/routingService';

export const LiveDeliveryMapModal = ({
  isOpen,
  onClose,
  order = null
}) => {
  const { isKhmer } = useLanguage();
  const { customerUser, setOrders, showToast } = useApp();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Dynamic Real Route & Telemetry State
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(2.4);
  const [etaMinutes, setEtaMinutes] = useState(12);
  const [isRealGps, setIsRealGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [routeRoadName, setRouteRoadName] = useState('Phnom Penh Delivery Corridor');
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

  // Real Order Properties
  const recipientName = order?.customerName || customerUser?.name || 'Customer';
  const recipientPhone = order?.customerPhone || customerUser?.phone || '+855 23 999 881';
  const recipientAddress = order?.deliveryAddress || customerUser?.address || 'Sangkat Boeng Keng Kang 1, Phnom Penh';
  const recipientDistrict = order?.customerDistrict || customerUser?.district || 'Boeng Keng Kang';
  const orderNum = order?.orderNumber || order?.id || 'ORD-ONL';

  // Delivery status state
  const isOrderCompleted = order?.status === 'COMPLETED' || order?.status === 'DELIVERED';
  const [isDelivered, setIsDelivered] = useState(isOrderCompleted);

  useEffect(() => {
    if (order) {
      setIsDelivered(order.status === 'COMPLETED' || order.status === 'DELIVERED');
    }
  }, [order]);

  // Determine stage description
  const getDeliveryStage = () => {
    if (isDelivered || order?.status === 'COMPLETED' || order?.status === 'DELIVERED') {
      return {
        step: 3,
        text: isKhmer ? 'បានមកដល់គោលដៅ (Arrived)' : 'Arrived at Destination',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      };
    }
    if (order?.status === 'OUT_FOR_DELIVERY') {
      return {
        step: 2,
        text: isKhmer ? 'អ្នកដឹកកំពុងធ្វើដំណើរ (On the Way)' : 'Courier En Route',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    return {
      step: 1,
      text: isKhmer ? 'ហាងកំពុងឆុង & រៀបចំ (Brewing & Preparing)' : 'Brewing & Packing at Roastery',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    };
  };

  // Load Real Device GPS & Calculate Real OSRM Road Route
  const setupRealRoute = useCallback(async () => {
    // 1. Resolve Customer Destination from Actual Address
    let destination = geocodeDeliveryAddress(recipientAddress, recipientDistrict);

    // 2. Try acquiring real device hardware GPS (if permitted by browser)
    try {
      const deviceLoc = await getLiveDeviceLocation();
      if (deviceLoc?.success && deviceLoc?.isRealGps) {
        setIsRealGps(true);
        setGpsAccuracy(deviceLoc.accuracy);
        if (deviceLoc.lat >= 10 && deviceLoc.lat <= 15 && deviceLoc.lon >= 102 && deviceLoc.lon <= 108) {
          destination = { lat: deviceLoc.lat, lon: deviceLoc.lon, district: 'Live Device GPS' };
        }
      }
    } catch {
      // ignore gps permissions
    }

    // 3. Fetch Real OSRM Road Driving Route
    const routeData = await fetchOsrmRoute(ROASTERY_HQ, destination);

    if (routeData && routeData.coordinates.length > 0) {
      const coords = routeData.coordinates;
      setRouteCoordinates(coords);
      setRouteDistanceKm(routeData.distanceKm);
      setRouteRoadName(routeData.summary || 'Phnom Penh Arterial Route');

      // Realistic rider location based strictly on real order status:
      if (isDelivered || order?.status === 'COMPLETED' || order?.status === 'DELIVERED') {
        // At Customer Destination
        setActiveStepIndex(coords.length - 1);
        setSpeed(0);
        setEtaMinutes(0);
      } else if (order?.status === 'OUT_FOR_DELIVERY') {
        // En route
        const midPoint = Math.min(Math.floor(coords.length * 0.5), coords.length - 1);
        setActiveStepIndex(midPoint);
        setSpeed(24);
        setEtaMinutes(Math.max(3, Math.round(routeData.durationMins * 0.6)));
      } else {
        // At store preparing: Rider is AT ROASTERY HQ, not moving on the road!
        setActiveStepIndex(0);
        setSpeed(0);
        setEtaMinutes(routeData.durationMins + 10);
      }
    }
  }, [recipientAddress, recipientDistrict, isDelivered, order]);

  useEffect(() => {
    if (!isOpen) return;
    setupRealRoute();
  }, [isOpen, setupRealRoute]);

  const handleManualRefresh = async () => {
    setIsRefreshingGps(true);
    await setupRealRoute();
    setTimeout(() => setIsRefreshingGps(false), 600);
  };

  // Leaflet Map Initialization with OpenStreetMap Tiles
  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [11.5565, 104.9242],
        zoom: 14,
        zoomControl: false
      });

      mapInstanceRef.current = map;

      // Clean OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Store Origin Marker (Aroma Roastery BKK1)
      const storeHtml = `
        <div style="transform: translate(-50%, -50%);">
          <div style="background: #1c1917; border: 2.5px solid #f59e0b; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6); font-size: 18px;">
            ☕
          </div>
        </div>
      `;
      L.marker([ROASTERY_HQ.lat, ROASTERY_HQ.lon], { icon: L.divIcon({ html: storeHtml, className: 'store-pin' }) })
        .addTo(map)
        .bindPopup(`<b>${ROASTERY_HQ.name}</b><br>${ROASTERY_HQ.address}`);

      // If route coordinates are ready, draw real road polyline and destination
      if (routeCoordinates.length > 0) {
        const destCoord = routeCoordinates[routeCoordinates.length - 1];
        const custHtml = `
          <div style="transform: translate(-50%, -50%);">
            <div style="background: #e11d48; border: 2.5px solid #ffffff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(225,29,72,0.6); font-size: 17px; color: white;">
              📍
            </div>
          </div>
        `;
        L.marker(destCoord, { icon: L.divIcon({ html: custHtml, className: 'cust-pin' }) })
          .addTo(map)
          .bindPopup(`<b>${recipientName}</b><br>${recipientAddress}`);

        // Road Polyline
        const polyline = L.polyline(routeCoordinates, {
          color: '#f59e0b',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }).addTo(map);
        routePolylineRef.current = polyline;

        // Rider Icon positioned at steady actual step index
        const curRiderPos = routeCoordinates[activeStepIndex] || routeCoordinates[0];
        const riderHtml = `
          <div style="transform: translate(-50%, -50%); position: relative;">
            <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background: #047857; border: 2.5px solid #ffffff; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(4,120,87,0.7); font-size: 20px; color: white;">
              🛵
            </div>
          </div>
        `;
        const riderMarker = L.marker(curRiderPos, {
          icon: L.divIcon({ html: riderHtml, className: 'rider-pin' }),
          zIndexOffset: 1000
        }).addTo(map);
        riderMarkerRef.current = riderMarker;

        map.fitBounds(polyline.getBounds(), { padding: [55, 55] });
      }
    }).catch((err) => console.error('Leaflet load error', err));

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, routeCoordinates, recipientName, recipientAddress, activeStepIndex]);

  // Update Rider Marker position dynamically when activeStepIndex changes
  useEffect(() => {
    if (!riderMarkerRef.current || routeCoordinates.length === 0) return;
    const pt = routeCoordinates[activeStepIndex];
    if (pt) {
      riderMarkerRef.current.setLatLng(pt);
    }
  }, [activeStepIndex, routeCoordinates]);

  // Handle "User Got Product / Received Order" Click
  const handleGotProduct = () => {
    setIsDelivered(true);
    setEtaMinutes(0);
    setSpeed(0);
    if (routeCoordinates.length > 0) {
      setActiveStepIndex(routeCoordinates.length - 1);
    }

    try {
      soundService.playKaChing();
      confetti({
        particleCount: 90,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#D97706']
      });
    } catch {
      // ignore sound error
    }

    const targetId = order?.id || order?.orderNumber;
    if (targetId && setOrders) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === targetId || o.orderNumber === order.orderNumber
            ? { ...o, status: 'COMPLETED', isDelivered: true, deliveredAt: new Date().toISOString() }
            : o
        )
      );

      try {
        const stored = JSON.parse(localStorage.getItem('aromapos_orders') || '[]');
        const updated = stored.map((o) =>
          o.id === targetId || o.orderNumber === order.orderNumber
            ? { ...o, status: 'COMPLETED', isDelivered: true, deliveredAt: new Date().toISOString() }
            : o
        );
        localStorage.setItem('aromapos_orders', JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
    }

    if (showToast) {
      showToast(
        isKhmer
          ? '🎉 អរគុណច្រើន! បានបញ្ជាក់ថាទទួលបានកាហ្វេរួចរាល់ សូមពិសារដោយរីករាយ ☕'
          : '🎉 Order confirmed received! Enjoy your fresh coffee ☕',
        'success'
      );
    }
  };

  if (!isOpen) return null;

  const stage = getDeliveryStage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  {isKhmer ? 'តាមដានការដឹកជញ្ជូនជាក់ស្តែង' : 'Live Delivery Tracking'}
                </h3>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 shrink-0">
                  #{orderNum}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${stage.badgeClass}`}>
                  {isDelivered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span>{stage.text}</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5 truncate">
                <span>Aroma Express Logistics</span>
                <span>•</span>
                <span className="text-stone-300 font-medium truncate">{routeRoadName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              className={`p-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                isRefreshingGps ? 'animate-spin text-amber-400' : ''
              }`}
              title="Refresh GPS & Route"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isKhmer ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative w-full h-full min-h-[300px] bg-stone-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Live Telemetry HUD (Stationary, Real Status) */}
          <div className="absolute top-4 left-4 z-10 p-3 rounded-2xl bg-stone-950/92 backdrop-blur-md border border-stone-800 shadow-2xl flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 font-bold font-mono">
              <span className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-emerald-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-emerald-400">
                {isDelivered ? 'DELIVERED' : isRealGps ? '🛰️ REAL GPS' : '🗺️ OSRM ROAD'}
              </span>
              {gpsAccuracy && !isDelivered && (
                <span className="text-[10px] text-stone-400 font-normal">
                  (±{gpsAccuracy}m)
                </span>
              )}
            </div>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="font-mono text-stone-200">
              Dist: <strong className="text-amber-400">{routeDistanceKm} km</strong>
            </div>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="font-mono text-stone-200">
              Speed: <strong className="text-amber-400">{speed} km/h</strong>
            </div>
            <span className="text-stone-700 hidden sm:inline">|</span>
            <div className="font-mono text-stone-200">
              ETA: <strong className="text-emerald-400">{isDelivered ? (isKhmer ? 'បានដល់' : 'Arrived') : `~${etaMinutes} mins`}</strong>
            </div>
          </div>

          {/* Delivered Banner Overlay */}
          {isDelivered && (
            <div className="absolute top-4 right-4 z-10 p-3 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-600/70 shadow-2xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in">
              <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-black text-white">{isKhmer ? 'អតិថិជនបានទទួលកាហ្វេរួចរាល់!' : 'Order Successfully Received!'}</p>
                <p className="text-[11px] text-emerald-200/80">{isKhmer ? 'សូមពិសារកាហ្វេដោយរីករាយ ☕' : 'Enjoy your fresh coffee!'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Real Courier & Delivery Destination Footer */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          {/* Driver Profile */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0 shadow">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm text-white">Kosal Vorn</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Aroma Express Courier #12
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Honda Wave 125i (PP 1KV-8924) • Insulated Coffee Thermos Box (65°C)
              </p>
            </div>
          </div>

          {/* Real Delivery Destination Snapshot */}
          <div className="text-left md:text-right text-xs text-stone-400 w-full md:w-auto">
            <p className="font-bold text-stone-200 truncate max-w-xs md:max-w-sm">
              📍 {recipientAddress}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Recipient: <strong className="text-stone-300">{recipientName}</strong> ({recipientPhone})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
            {!isDelivered ? (
              <button
                type="button"
                onClick={handleGotProduct}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95"
              >
                <PackageCheck className="w-4 h-4 stroke-[2.5]" />
                <span>{isKhmer ? '✅ ខ្ញុំបានទទួលកាហ្វេរួចរាល់' : '✅ I Got My Order'}</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKhmer ? 'បានបញ្ជាក់ទទួលរួចរាល់' : 'Received Confirmed'}</span>
              </div>
            )}

            <a
              href="tel:+85523999881"
              className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              title="Call Roastery Dispatch hotline"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isKhmer ? 'ទូរស័ព្ទទៅបញ្ជរ' : 'Call Dispatch'}</span>
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
