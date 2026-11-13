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
  ArrowUpRight,
  Radio,
  LocateFixed
} from 'lucide-react';
import { soundService } from '../../services/soundService';
import { 
  ROASTERY_HQ, 
  geocodeDeliveryAddress, 
  fetchOsrmRoute, 
  getLiveDeviceLocation 
} from '../../services/routingService';

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

  // Real OSRM Road Routes for each order: { [orderId]: { coordinates, distanceKm, durationMins, summary } }
  const [routesMap, setRoutesMap] = useState({});

  // Rider Telemetry Simulation Steps
  const [steps, setSteps] = useState({
    'ord-6': { step: 1, speed: 32, eta: 7 },
    'ord-7': { step: 2, speed: 28, eta: 12 }
  });

  // Extract online orders that have delivery addresses or from seed data
  const deliveryOrders = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Process active orders from AppContext
    orders.forEach((o) => {
      const isOnlineDelivery = (o.orderType === 'DELIVERY' || o.channel === 'ONLINE_ECOMMERCE');
      if (isOnlineDelivery && !seenIds.has(o.id)) {
        seenIds.add(o.id);
        list.push({
          id: o.id,
          orderNumber: o.orderNumber || '#ORD-LIVE',
          customerName: o.customerName || 'Online Customer',
          customerPhone: o.customerPhone || '096 927 6538',
          deliveryAddress: o.deliveryAddress || '#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh',
          customerDistrict: o.customerDistrict || 'Boeng Keng Kang',
          rider: { 
            name: o.riderName || 'Sokha Rith', 
            phone: '010 777 888', 
            bike: 'Honda Wave 110i (Phnom Penh 1AK-4892)', 
            battery: '94%' 
          },
          items: (o.items || []).map((i) => `${i.quantity}x ${i.name || i.productName || 'Coffee'}`),
          total: o.total || 16.74,
          status: o.status || 'IN_TRANSIT'
        });
      }
    });

    // 2. Guarantee default authentic orders if list is empty
    if (list.length === 0) {
      list.push(
        {
          id: 'ord-6',
          orderNumber: '#ORD-1041',
          customerName: 'Phara',
          customerPhone: '096 927 6538',
          deliveryAddress: '#45, Street 288, Sangkat Boeng Keng Kang 1, Phnom Penh',
          customerDistrict: 'Boeng Keng Kang',
          rider: { name: 'Sokha Rith', phone: '010 777 888', bike: 'Honda Wave 110i (Phnom Penh 1AK-4892)', battery: '92%' },
          items: ['2x Iced Vanilla Oat Latte', '1x Avocado Sourdough Toast'],
          total: 16.74,
          status: 'IN_TRANSIT'
        },
        {
          id: 'ord-7',
          orderNumber: '#ORD-1042',
          customerName: 'Sophea Kem',
          customerPhone: '012 888 999',
          deliveryAddress: '#12, Preah Sisowath Quay, Daun Penh (Riverside)',
          customerDistrict: 'Daun Penh',
          rider: { name: 'Dara Chan', phone: '085 222 333', bike: 'Yamaha Fazzio 125 (Phnom Penh 1BL-9301)', battery: '84%' },
          items: ['1x Artisan Pour Over', '1x Pain au Chocolat'],
          total: 9.72,
          status: 'IN_TRANSIT'
        }
      );
    }

    return list;
  }, [orders]);

  // Dynamically calculate Real OSRM Road Route for each delivery order
  useEffect(() => {
    let isMounted = true;

    const fetchAllRoutes = async () => {
      const newRoutes = {};

      for (const order of deliveryOrders) {
        if (routesMap[order.id]) continue; // already fetched

        const destination = geocodeDeliveryAddress(order.deliveryAddress, order.customerDistrict);
        const routeResult = await fetchOsrmRoute(ROASTERY_HQ, destination);

        if (routeResult && routeResult.coordinates.length > 0) {
          newRoutes[order.id] = routeResult;
        }
      }

      if (isMounted && Object.keys(newRoutes).length > 0) {
        setRoutesMap((prev) => ({ ...prev, ...newRoutes }));
      }
    };

    fetchAllRoutes();

    return () => {
      isMounted = false;
    };
  }, [deliveryOrders]);

  // Telemetry Movement Timer along real road points
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSteps((prev) => {
        const next = { ...prev };
        deliveryOrders.forEach((o) => {
          const route = routesMap[o.id];
          const maxSteps = route?.coordinates?.length || 5;
          const current = next[o.id] || { step: 0, speed: 28, eta: 8 };
          const nextStep = (current.step + 1) % maxSteps;
          const randomSpeed = Math.floor(25 + Math.random() * 12);
          const nextEta = Math.max(1, current.eta > 2 ? current.eta - 1 : (route?.durationMins || 8));
          next[o.id] = { step: nextStep, speed: randomSpeed, eta: nextEta };
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating, deliveryOrders, routesMap]);

  // Leaflet Map Initialization & Real-Time Road Route Rendering
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
        L.marker([ROASTERY_HQ.lat, ROASTERY_HQ.lon], { icon: L.divIcon({ html: originHtml, className: 'hq-pin' }) })
          .addTo(map)
          .bindPopup(`<b>${ROASTERY_HQ.name}</b><br>${ROASTERY_HQ.address}`);
      }

      const map = mapInstanceRef.current;

      // Draw Routes and Rider Markers for each delivery order
      deliveryOrders.forEach((d, idx) => {
        const routeData = routesMap[d.id];
        const routePts = routeData?.coordinates || [];
        if (routePts.length === 0) return;

        // 1. Draw Real Road Polyline if not already drawn
        if (!polylinesRef.current[d.id]) {
          const polyColor = idx % 2 === 0 ? '#10b981' : '#3b82f6';
          const poly = L.polyline(routePts, {
            color: polyColor,
            weight: 5,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
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
          L.marker(dest, { icon: L.divIcon({ html: destHtml, className: 'dest-pin' }) })
            .addTo(map)
            .bindPopup(`<b>${d.orderNumber} - ${d.customerName}</b><br>${d.deliveryAddress}<br><b>Distance:</b> ${routeData.distanceKm} km (~${routeData.durationMins} mins)`);
        }

        // 2. Update Moving Rider Pin along real road coordinates
        const curStepIdx = steps[d.id]?.step || 0;
        const curPt = routePts[curStepIdx] || routePts[0];

        if (!markersRef.current[d.id]) {
          const riderHtml = `
            <div style="transform: translate(-50%, -50%); position: relative;">
              <div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; background: #047857; border: 2px solid #ffffff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(4,120,87,0.7); font-size: 17px; color: white;">
                🛵
              </div>
            </div>
          `;
          const m = L.marker(curPt, {
            icon: L.divIcon({ html: riderHtml, className: `rider-${d.id}` }),
            zIndexOffset: 1000
          }).addTo(map);
          m.bindPopup(`<b>Courier: ${d.rider.name}</b><br>${d.rider.bike}<br>Delivering ${d.orderNumber}`);
          markersRef.current[d.id] = m;
        } else {
          markersRef.current[d.id].setLatLng(curPt);
        }
      });
    }).catch(err => console.error('Leaflet load error', err));

    return () => {
      isMounted = false;
    };
  }, [deliveryOrders, routesMap, steps]);

  const handleCenterOrder = (order) => {
    setSelectedOrderId(order.id);
    const map = mapInstanceRef.current;
    const route = routesMap[order.id];
    if (map && route?.coordinates?.length) {
      import('leaflet').then((L) => {
        map.fitBounds(L.latLngBounds(route.coordinates), { padding: [60, 60], maxZoom: 16 });
      });
    }
  };

  const filteredList = useMemo(() => {
    return deliveryOrders.filter((o) => {
      if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.deliveryAddress.toLowerCase().includes(q) ||
          o.rider.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deliveryOrders, filterStatus, searchQuery]);

  const selectedOrder = deliveryOrders.find((o) => o.id === selectedOrderId) || deliveryOrders[0];
  const curTelemetry = steps[selectedOrder?.id] || { speed: 30, eta: 8 };
  const curRoute = routesMap[selectedOrder?.id];

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900/60 overflow-hidden font-sans">
      {/* Top Banner Bar */}
      <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bike className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">
                {isKhmer ? 'ប្រព័ន្ធតាមដានការដឹកជញ្ជូនបន្តផ្ទាល់ (Live Fleet Radar)' : 'Live Delivery Fleet Radar'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>OSRM REAL ROAD GPS</span>
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Phnom Penh Autonomous Courier Telemetry & Live OpenStreetMap Routing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              isSimulating
                ? 'bg-amber-950/70 border-amber-800/80 text-amber-300 hover:bg-amber-900/80'
                : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pause Radar' : 'Resume Radar'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Map Viewport + Active Deliveries Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Left Side: Full Leaflet Map Viewport */}
        <div className="flex-1 relative w-full h-full min-h-[350px] bg-stone-950">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Selected Courier Telemetry Card */}
          {selectedOrder && (
            <div className="absolute top-4 left-4 z-10 p-4 rounded-3xl bg-stone-950/92 backdrop-blur-md border border-stone-800 shadow-2xl max-w-sm w-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-800">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Active Delivery
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  ${Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  <span>{selectedOrder.customerName}</span>
                </h4>
                <p className="text-xs text-stone-400 flex items-start gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedOrder.deliveryAddress}</span>
                </p>
              </div>

              {/* Courier Profile */}
              <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-850 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                  🛵
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-white truncate">{selectedOrder.rider?.name}</p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      🔋 {selectedOrder.rider?.battery}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate">{selectedOrder.rider?.bike}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-850 text-center font-mono">
                <div className="p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  <span className="text-[9px] text-stone-500 block uppercase font-sans">Distance</span>
                  <span className="font-black text-amber-400 text-xs">{curRoute?.distanceKm || 2.4} km</span>
                </div>
                <div className="p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  <span className="text-[9px] text-stone-500 block uppercase font-sans">Speed</span>
                  <span className="font-black text-emerald-400 text-xs">{curTelemetry.speed} km/h</span>
                </div>
                <div className="p-1.5 rounded-xl bg-stone-900/80 border border-stone-800">
                  <span className="text-[9px] text-stone-500 block uppercase font-sans">ETA</span>
                  <span className="font-black text-amber-400 text-xs">~{curTelemetry.eta} mins</span>
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
              const route = routesMap[order.id];

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
                      <span className="text-stone-400 text-[10px]">{route ? `${route.distanceKm}km` : `${telemetry.speed}km/h`}</span>
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
                      className="flex-1 py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-emerald-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition"
                    >
                      <Phone className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Call Rider</span>
                    </a>
                    <a
                      href={`tel:${order.customerPhone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-amber-300 text-[10px] font-bold text-center flex items-center justify-center gap-1 transition"
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
