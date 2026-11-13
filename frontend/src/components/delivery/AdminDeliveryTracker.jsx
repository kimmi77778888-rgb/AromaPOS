import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Navigation, 
  Coffee, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Play, 
  Pause, 
  User, 
  SlidersHorizontal,
  ChevronRight,
  Battery,
  Wifi,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { soundService } from '../../services/soundService';

// Phnom Penh Delivery Waypoint Routes
const DELIVERY_ROUTES = {
  'ord-6': {
    orderNumber: '#ORD-1041',
    customerName: 'Phara',
    customerPhone: '096 927 6538',
    deliveryAddress: '#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh',
    rider: { name: 'Sokha Rith', phone: '010 777 888', bike: 'Honda Wave 110i (Phnom Penh 1AK-4892)', battery: '92%' },
    items: ['2x Iced Vanilla Oat Latte', '1x Avocado Sourdough Toast'],
    total: 16.74,
    status: 'IN_TRANSIT',
    waypoints: [
      { lat: 11.5508, lon: 104.9242, name: 'Aroma BKK1 Roastery' },
      { lat: 11.5525, lon: 104.9228, name: 'St. 288 Junction' },
      { lat: 11.5539, lon: 104.9212, name: 'Pasteur Street Corner' },
      { lat: 11.5552, lon: 104.9198, name: 'Customer Destination (BKK1)' }
    ]
  },
  'ord-7': {
    orderNumber: '#ORD-1042',
    customerName: 'Sophea Kem',
    customerPhone: '012 888 999',
    deliveryAddress: '#12, Preah Sisowath Quay, Daun Penh (Riverside)',
    rider: { name: 'Dara Chan', phone: '085 222 333', bike: 'Yamaha Fazzio 125 (Phnom Penh 1BL-9301)', battery: '84%' },
    items: ['1x Artisan Pour Over', '1x Pain au Chocolat'],
    total: 9.72,
    status: 'IN_TRANSIT',
    waypoints: [
      { lat: 11.5508, lon: 104.9242, name: 'Aroma BKK1 Roastery' },
      { lat: 11.5565, lon: 104.9280, name: 'Sihanouk Blvd Circle' },
      { lat: 11.5620, lon: 104.9310, name: 'Independence Monument' },
      { lat: 11.5685, lon: 104.9335, name: 'Riverside Walkway (Daun Penh)' }
    ]
  }
};

export const AdminDeliveryTracker = () => {
  const { orders = [], showToast } = useApp();
  const { isKhmer } = useLanguage();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylinesRef = useRef({});

  const [selectedOrderId, setSelectedOrderId] = useState('ord-6');
  const [isSimulating, setIsSimulating] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Rider Telemetry Simulation Steps
  const [steps, setSteps] = useState({
    'ord-6': { step: 1, speed: 32, eta: 7 },
    'ord-7': { step: 2, speed: 28, eta: 12 }
  });

  // Extract online orders that have delivery addresses or from seed data
  const deliveryOrders = useMemo(() => {
    const list = [];
    // Seed configured delivery routes
    Object.keys(DELIVERY_ROUTES).forEach((id) => {
      list.push({ id, ...DELIVERY_ROUTES[id] });
    });

    // Also include any dynamically placed delivery orders from AppContext
    orders.forEach((o) => {
      if ((o.orderType === 'DELIVERY' || o.channel === 'ONLINE_ECOMMERCE') && !DELIVERY_ROUTES[o.id]) {
        list.push({
          id: o.id,
          orderNumber: o.orderNumber || '#ORD-LIVE',
          customerName: o.customerName || 'Online Customer',
          customerPhone: o.customerPhone || '012 345 678',
          deliveryAddress: o.deliveryAddress || 'Phnom Penh Delivery',
          rider: { name: 'Virak Bun', phone: '016 444 555', bike: 'Suzuki Smash 115', battery: '89%' },
          items: (o.items || []).map((i) => `${i.quantity}x ${i.name || i.productName || 'Coffee'}`),
          total: o.total || 10.00,
          status: o.status || 'IN_PREPARATION',
          waypoints: [
            { lat: 11.5508, lon: 104.9242, name: 'Aroma BKK1 Roastery' },
            { lat: 11.5580, lon: 104.9150, name: 'Tuol Sleng Avenue' },
            { lat: 11.5640, lon: 104.9100, name: 'Tuol Kork Outer' }
          ]
        });
      }
    });

    return list;
  }, [orders]);

  // Telemetry Movement Timer
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSteps((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          const route = DELIVERY_ROUTES[id];
          if (!route) return;
          const maxSteps = route.waypoints.length;
          const nextStep = (next[id].step + 1) % maxSteps;
          const randomSpeed = Math.floor(25 + Math.random() * 14);
          const nextEta = Math.max(2, next[id].eta > 3 ? next[id].eta - 1 : 10);
          next[id] = { step: nextStep, speed: randomSpeed, eta: nextEta };
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Leaflet Map Initialization & Real-Time Sync
  useEffect(() => {
    let isMounted = true;
    if (!mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [11.5565, 104.9250],
          zoom: 14,
          zoomControl: false
        });

        mapInstanceRef.current = map;

        // Clean, Open Non-Watermarked OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Store Origin Pin (Aroma Coffee Roastery Headquarters)
        const originHtml = `
          <div style="transform: translate(-50%, -50%);">
            <div style="background: #1c1917; border: 2.5px solid #f59e0b; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.6); font-size: 18px;">
              ☕
            </div>
          </div>
        `;
        L.marker([11.5508, 104.9242], { icon: L.divIcon({ html: originHtml, className: 'hq-pin' }) })
          .addTo(map)
          .bindPopup('<b>Aroma Coffee Roastery HQ</b><br>Origin Kitchen & Hub (St. 57, BKK1)');
      }

      const map = mapInstanceRef.current;

      // Draw Routes and Rider Markers
      deliveryOrders.forEach((d) => {
        const routePts = d.waypoints || [];
        if (routePts.length === 0) return;

        // 1. Draw Polyline if not already drawn
        if (!polylinesRef.current[d.id]) {
          const latlngs = routePts.map(p => [p.lat, p.lon]);
          const poly = L.polyline(latlngs, {
            color: d.id === 'ord-6' ? '#10b981' : '#3b82f6',
            weight: 5,
            opacity: 0.8,
            dashArray: '8, 8',
            lineCap: 'round'
          }).addTo(map);
          polylinesRef.current[d.id] = poly;

          // Destination Pin
          const dest = routePts[routePts.length - 1];
          const destHtml = `
            <div style="transform: translate(-50%, -50%);">
              <div style="background: #e11d48; border: 2px solid #ffffff; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(225,29,72,0.6); font-size: 15px; color: white;">
                📍
              </div>
            </div>
          `;
          L.marker([dest.lat, dest.lon], { icon: L.divIcon({ html: destHtml, className: 'dest-pin' }) })
            .addTo(map)
            .bindPopup(`<b>${d.orderNumber} - ${d.customerName}</b><br>${d.deliveryAddress}`);
        }

        // 2. Update Moving Rider Pin
        const curStepIdx = steps[d.id]?.step || 0;
        const curPt = routePts[curStepIdx] || routePts[0];

        if (!markersRef.current[d.id]) {
          const riderHtml = `
            <div style="transform: translate(-50%, -50%); position: relative;">
              <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; background: #047857; border: 2px solid #ffffff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(4,120,87,0.7); font-size: 18px; color: white;">
                🛵
              </div>
            </div>
          `;
          const marker = L.marker([curPt.lat, curPt.lon], {
            icon: L.divIcon({ html: riderHtml, className: `rider-pin-${d.id}` }),
            zIndexOffset: 1000
          }).addTo(map);
          marker.bindPopup(`<b>Rider: ${d.rider?.name || 'Aroma Rider'}</b><br>Delivering ${d.orderNumber} to ${d.customerName}`);
          markersRef.current[d.id] = marker;
        } else {
          markersRef.current[d.id].setLatLng([curPt.lat, curPt.lon]);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [deliveryOrders, steps]);

  const handleCenterOrder = (order) => {
    setSelectedOrderId(order.id);
    if (mapInstanceRef.current && order.waypoints?.length) {
      const stepIdx = steps[order.id]?.step || 0;
      const pt = order.waypoints[stepIdx] || order.waypoints[0];
      mapInstanceRef.current.flyTo([pt.lat, pt.lon], 16, { animate: true, duration: 1.2 });
      if (markersRef.current[order.id]) {
        markersRef.current[order.id].openPopup();
      }
    }
  };

  const filteredList = deliveryOrders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || 
      o.orderNumber?.toLowerCase().includes(q) || 
      o.customerName?.toLowerCase().includes(q) || 
      o.rider?.name?.toLowerCase().includes(q);
    const matchS = filterStatus === 'ALL' || o.status === filterStatus;
    return matchQ && matchS;
  });

  const selectedOrder = deliveryOrders.find((o) => o.id === selectedOrderId) || deliveryOrders[0];
  const curTelemetry = steps[selectedOrderId] || { speed: 30, eta: 8 };

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-950 text-stone-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
            <Bike className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg sm:text-xl text-white tracking-tight">
                {isKhmer ? 'ប្រព័ន្ធតាមដានការដឹកជញ្ជូនផ្ទាល់ (Live GPS Fleet Monitor)' : 'Live Delivery Fleet GPS Monitor'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>PHNOM PENH LIVE</span>
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Aroma Coffee Roastery • Real-time Rider GPS Telemetry & Order Tracking
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSimulating(!isSimulating);
              soundService.playBeepSound();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isSimulating 
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? (isKhmer ? 'ផ្អាក GPS' : 'Pause Simulation') : (isKhmer ? 'បន្ត GPS' : 'Resume Simulation')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playBeepSound();
              showToast(isKhmer ? '🔄 បាន Refresh ទីតាំងអ្នកដឹកជញ្ជូនរួចរាល់' : '🔄 Rider GPS signals synchronized', 'info');
            }}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            title="Force refresh GPS positions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area: Left Map & Right Order Fleet Ledger */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Interactive Map */}
        <div className="flex-1 relative h-64 lg:h-full bg-stone-900">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Floating Live Telemetry HUD Overlay */}
          {selectedOrder && (
            <div className="absolute top-4 left-4 z-20 p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 backdrop-blur-md shadow-2xl max-w-xs space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Rider Telemetry</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  <span>{selectedOrder.rider?.battery || '90%'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-xs text-white">{selectedOrder.rider?.name}</p>
                  <p className="text-[10px] text-stone-400 truncate">{selectedOrder.rider?.bike}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-850 text-center font-mono">
                <div className="p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  <span className="text-[9px] text-stone-500 block uppercase font-sans">Speed</span>
                  <span className="font-black text-emerald-400 text-xs">{curTelemetry.speed} km/h</span>
                </div>
                <div className="p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  <span className="text-[9px] text-stone-500 block uppercase font-sans">Estimated ETA</span>
                  <span className="font-black text-amber-400 text-xs">{curTelemetry.eta} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Delivery Fleet Ledger & Order Directory */}
        <div className="w-full lg:w-96 bg-stone-950 border-t lg:border-t-0 lg:border-l border-stone-800/80 flex flex-col h-1/2 lg:h-full z-20">
          {/* Quick Search & Filter Header */}
          <div className="p-3.5 border-b border-stone-800 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isKhmer ? 'ស្វែងរកតាមលេខវិក្កយបត្រ, អតិថិជន...' : 'Search ticket #, customer, rider...'}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-stone-400 px-1">
              <span>{isKhmer ? 'ការដឹកជញ្ជូនសកម្ម:' : 'Active Deliveries:'}</span>
              <span className="font-mono font-bold text-emerald-400">{filteredList.length} Orders</span>
            </div>
          </div>

          {/* Scrollable Order Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredList.map((order) => {
              const isSelected = selectedOrderId === order.id;
              const telemetry = steps[order.id] || { speed: 30, eta: 10 };

              return (
                <div
                  key={order.id}
                  onClick={() => handleCenterOrder(order)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-stone-900 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-lg'
                      : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-amber-400">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                        🛵 {order.status === 'IN_TRANSIT' ? 'On Route' : 'Prepared'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-white">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Customer & Destination */}
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-stone-300">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>{order.customerName}</span>
                      </span>
                      <span className="font-mono text-[11px] text-stone-400">{order.customerPhone}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 flex items-start gap-1 leading-tight line-clamp-1">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                      <span>{order.deliveryAddress}</span>
                    </p>
                  </div>

                  {/* Rider Details & Telemetry */}
                  <div className="mt-2.5 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-stone-300">
                      <Bike className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium text-emerald-300">{order.rider?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-stone-400 text-[10px]">{telemetry.speed} km/h</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        ~{telemetry.eta}m
                      </span>
                    </div>
                  </div>

                  {/* Action Contact Buttons */}
                  <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center gap-1.5">
                    <a
                      href={`tel:${order.rider?.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-emerald-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <Phone className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Call Rider</span>
                    </a>
                    <a
                      href={`tel:${order.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <User className="w-2.5 h-2.5 text-amber-400" />
                      <span>Call Customer</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
