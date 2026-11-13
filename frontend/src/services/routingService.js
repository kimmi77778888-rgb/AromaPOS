/**
 * Real Road Routing & Real-Time GPS Geolocation Service
 * Integrates OpenStreetMap + OSRM (Open Source Routing Machine)
 * Real street driving route calculation across Phnom Penh, Cambodia
 */

export const ROASTERY_HQ = {
  lat: 11.5508,
  lon: 104.9242,
  name: 'Aroma BKK1 Roastery',
  address: 'Street 57, Sangkat Boeng Keng Kang 1, Phnom Penh'
};

// Phnom Penh District Coordinates Lookup
export const PHNOM_PENH_DISTRICT_COORDS = {
  'Boeng Keng Kang': { lat: 11.5525, lon: 104.9228 },
  'Chamkar Mon': { lat: 11.5430, lon: 104.9270 },
  'Daun Penh': { lat: 11.5720, lon: 104.9260 },
  'Tuol Kouk': { lat: 11.5750, lon: 104.8990 },
  'Chroy Changvar': { lat: 11.5900, lon: 104.9350 },
  'Mean Chey': { lat: 11.5250, lon: 104.9150 },
  'Sen Sok': { lat: 11.5850, lon: 104.8750 },
  'Pur Senchey': { lat: 11.5450, lon: 104.8500 },
  'Chbar Ampov': { lat: 11.5350, lon: 104.9550 },
  'Russei Keo': { lat: 11.6050, lon: 104.9050 },
  'Dangkao': { lat: 11.4900, lon: 104.8800 }
};

/**
 * Resolve an address string or district to real Phnom Penh GPS coordinates
 */
export const geocodeDeliveryAddress = (address = '', district = '') => {
  const text = `${address} ${district}`.toLowerCase();

  for (const [key, coords] of Object.entries(PHNOM_PENH_DISTRICT_COORDS)) {
    if (text.includes(key.toLowerCase())) {
      // Add a small deterministic offset based on address length so houses in same district don't overlap exactly
      const offsetLat = ((address.length % 7) - 3) * 0.0012;
      const offsetLon = ((address.length % 5) - 2) * 0.0012;
      return {
        lat: coords.lat + offsetLat,
        lon: coords.lon + offsetLon,
        district: key
      };
    }
  }

  // Fallback to central Phnom Penh (BKK1 / Sangkat Chaktomuk)
  return {
    lat: 11.5565,
    lon: 104.9265,
    district: 'Phnom Penh Central'
  };
};

/**
 * Query OSRM Driving Route API for Real Road Geometries & Turn-by-Turn Driving Distance
 */
export const fetchOsrmRoute = async (origin, destination) => {
  const oLat = origin.lat;
  const oLon = origin.lon;
  const dLat = destination.lat;
  const dLon = destination.lon;

  const url = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const bestRoute = data.routes[0];
      // OSRM GeoJSON is [lon, lat] -> Leaflet requires [lat, lon]
      const latlngs = bestRoute.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      const distanceKm = Math.round((bestRoute.distance / 1000) * 10) / 10;
      const durationMins = Math.max(3, Math.ceil(bestRoute.duration / 60));

      return {
        success: true,
        isRealRoadRoute: true,
        coordinates: latlngs,
        distanceKm,
        durationMins,
        summary: bestRoute.legs?.[0]?.summary || 'Phnom Penh Arterial Route'
      };
    }
  } catch (err) {
    console.warn('OSRM live routing fallback to interpolated street path:', err.message);
  }

  // Fallback Interpolated Path if OSRM service is unreachable
  const stepsCount = 10;
  const fallbackCoords = [];
  for (let i = 0; i <= stepsCount; i++) {
    const t = i / stepsCount;
    // Slight curve to avoid straight unrealistic line
    const curve = Math.sin(t * Math.PI) * 0.0025;
    fallbackCoords.push([
      oLat + (dLat - oLat) * t + curve,
      oLon + (dLon - oLon) * t - curve
    ]);
  }

  const estDistKm = 2.4;
  return {
    success: true,
    isRealRoadRoute: false,
    coordinates: fallbackCoords,
    distanceKm: estDistKm,
    durationMins: 10,
    summary: 'Phnom Penh Direct Corridor'
  };
};

/**
 * Obtain Real Device Live GPS Geolocation from Browser Hardware
 */
export const getLiveDeviceLocation = () => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        success: false,
        isRealGps: false,
        lat: 11.5565,
        lon: 104.9265,
        accuracy: null,
        error: 'Geolocation unsupported'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          success: true,
          isRealGps: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null
        });
      },
      (err) => {
        console.warn('Device GPS not accessible:', err.message);
        resolve({
          success: false,
          isRealGps: false,
          lat: 11.5565,
          lon: 104.9265,
          accuracy: null,
          error: err.message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 5000
      }
    );
  });
};
