(function () {
  const mapEl = document.getElementById('map');
  const statusEl = document.getElementById('mapStatus');
  const distanceEl = document.getElementById('routeDistance');
  const durationEl = document.getElementById('routeDuration');
  const shopNameEl = document.getElementById('shopName');
  const shopAddressEl = document.getElementById('shopAddress');
  const shopContactEl = document.getElementById('shopContact');
  const shopsDataEl = document.getElementById('mechanicShopsData');

  if (!mapEl || typeof L === 'undefined' || !shopsDataEl) {
    return;
  }

  let shops = [];

  try {
    shops = JSON.parse(shopsDataEl.textContent || '[]');
  } catch {
    shops = [];
  }

  if (!Array.isArray(shops) || !shops.length) {
    if (statusEl) {
      statusEl.textContent = 'Mechanic shop data is missing.';
      statusEl.classList.add('error');
    }
    return;
  }

  let assignedShop = null;

  const map = L.map('map', { zoomControl: true }).setView(
    [shops[0].latitude, shops[0].longitude],
    13,
  );

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'map-tiles-green',
  }).addTo(map);

  const startIcon = L.divIcon({
    className: 'route-marker route-marker-start',
    html: '<span></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const endIcon = L.divIcon({
    className: 'route-marker route-marker-end',
    html: '<span></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  function setStatus(message, isError) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  function hideStatus() {
    if (statusEl) {
      statusEl.style.display = 'none';
    }
  }

  function updateShopDetails(shop) {
    if (shopNameEl) {
      shopNameEl.textContent = shop.name;
    }

    if (shopAddressEl) {
      shopAddressEl.textContent = shop.address;
    }

    if (shopContactEl) {
      shopContactEl.textContent = 'Contact: ' + shop.contact;
    }
  }

  function getCurrentPosition() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        function (error) {
          const messages = {
            1: 'Location permission denied. Allow access to show your route.',
            2: 'Location unavailable. Try again.',
            3: 'Location request timed out. Try again.',
          };
          reject(new Error(messages[error.code] || 'Could not fetch your location.'));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
    const earthRadius = 6371000;
    const toRad = function (deg) {
      return (deg * Math.PI) / 180;
    };
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearestShop(userLat, userLng) {
    let nearest = shops[0];
    let minDistance = haversineDistanceMeters(
      userLat,
      userLng,
      nearest.latitude,
      nearest.longitude,
    );

    for (let i = 1; i < shops.length; i++) {
      const shop = shops[i];
      const distance = haversineDistanceMeters(userLat, userLng, shop.latitude, shop.longitude);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = shop;
      }
    }

    return { shop: nearest, distanceMeters: minDistance };
  }

  function formatDistance(meters) {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km';
    }
    return Math.round(meters) + ' m';
  }

  function formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) {
      return mins + ' min';
    }
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return hours + ' hr ' + remaining + ' min';
  }

  async function fetchRoute(start, destination) {
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      start.lng +
      ',' +
      start.lat +
      ';' +
      destination.lng +
      ',' +
      destination.lat +
      '?overview=full&geometries=geojson';

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Could not load driving route.');
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
      throw new Error('No route found to the nearest mechanic shop.');
    }

    return data.routes[0];
  }

  function drawRoute(start, destination, route) {
    const coordinates = route.geometry.coordinates.map(function (coord) {
      return [coord[1], coord[0]];
    });

    L.polyline(coordinates, {
      color: '#14532d',
      weight: 11,
      opacity: 0.55,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    const routeLine = L.polyline(coordinates, {
      color: '#4ade80',
      weight: 5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    const shopPopup =
      '<strong>' +
      assignedShop.name +
      '</strong><br>' +
      assignedShop.address +
      '<br>Contact: ' +
      assignedShop.contact;

    L.marker([start.lat, start.lng], { icon: startIcon })
      .addTo(map)
      .bindPopup('Your location');

    L.marker([destination.lat, destination.lng], { icon: endIcon })
      .addTo(map)
      .bindPopup(shopPopup);

    map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });

    if (distanceEl) {
      distanceEl.textContent = 'Distance: ' + formatDistance(route.distance);
    }

    if (durationEl) {
      durationEl.textContent = 'Duration: ' + formatDuration(route.duration);
    }
  }

  function saveAssignedShop(shop) {
    try {
      const existing = sessionStorage.getItem('mechanicRequest');
      const payload = existing ? JSON.parse(existing) : {};
      payload.assignedShop = shop;
      sessionStorage.setItem('mechanicRequest', JSON.stringify(payload));
    } catch {
      /* ignore storage errors */
    }
  }

  async function initRoute() {
    try {
      setStatus('Getting your location…');
      const start = await getCurrentPosition();

      setStatus('Finding nearest mechanic shop…');
      const nearest = findNearestShop(start.lat, start.lng);
      assignedShop = nearest.shop;
      updateShopDetails(assignedShop);
      saveAssignedShop(assignedShop);

      const end = { lat: assignedShop.latitude, lng: assignedShop.longitude };

      setStatus('Drawing shortest route to ' + assignedShop.name + '…');
      const route = await fetchRoute(start, end);
      drawRoute(start, end, route);
      hideStatus();
    } catch (error) {
      setStatus(error.message || 'Failed to load route.', true);
    }
  }

  const style = document.createElement('style');
  style.textContent =
    '.map-tiles-green { filter: hue-rotate(12deg) saturate(1.15) brightness(0.88); }' +
    '.route-marker { background: transparent; border: none; }' +
    '.route-marker span { display: block; border-radius: 50%; border: 2px solid #ecfdf5; }' +
    '.route-marker-start span { width: 20px; height: 20px; background: #22c55e; box-shadow: 0 0 0 5px rgba(34,197,94,0.35), 0 0 18px rgba(74,222,128,0.75); }' +
    '.route-marker-end span { width: 20px; height: 20px; background: #facc15; box-shadow: 0 0 0 5px rgba(250,204,21,0.3), 0 0 16px rgba(74,222,128,0.45); }' +
    '.leaflet-popup-content-wrapper { background: #0a120e; color: #d1fae5; border: 1px solid rgba(34,197,94,0.4); border-radius: 10px; }' +
    '.leaflet-popup-tip { background: #0a120e; }';
  document.head.appendChild(style);

  initRoute();
})();
