(function () {
  if (window.__assistPoliceMapInit) {
    return;
  }
  window.__assistPoliceMapInit = true;

  const TOP_COUNT = 4;
  const STATION_COLORS = ['#16a34a', '#0ea5e9', '#8b5cf6', '#f59e0b'];

  const mapEl = document.getElementById('policeMap');
  const statusEl = document.getElementById('policeStatus');
  const listEl = document.getElementById('policeStationList');
  const dataEl = document.getElementById('policeStationsData');

  if (!mapEl || typeof L === 'undefined' || !dataEl || !listEl) {
    return;
  }

  let stations = [];

  try {
    stations = JSON.parse(dataEl.textContent || '[]');
  } catch {
    stations = [];
  }

  if (!stations.length) {
    if (statusEl) {
      statusEl.textContent = 'Police station data is missing.';
      statusEl.classList.add('error');
    }
    return;
  }

  let userLocation = null;
  let mapInitialized = false;
  let userPositionPromise = null;
  let nearestStations = [];
  let selectedId = null;
  let userMarker = null;
  let routeLine = null;
  const stationMarkers = {};
  const stationMarkerLayer = L.layerGroup();

  const map = L.map('policeMap', { zoomControl: true }).setView(
    [stations[0].latitude, stations[0].longitude],
    13,
  );

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
    className: 'map-tiles-green',
  }).addTo(map);

  stationMarkerLayer.addTo(map);

  function startMarkerHtml() {
    return (
      '<div class="marker-blink-wrap marker-blink-start" aria-label="Your location">' +
      '<span class="marker-blink-ring"></span>' +
      '<span class="marker-blink-ring marker-blink-ring--2"></span>' +
      '<span class="marker-blink-dot"></span>' +
      '<span class="marker-blink-label">You</span>' +
      '</div>'
    );
  }

  function endMarkerHtml(color) {
    return (
      '<div class="marker-blink-wrap marker-blink-end" aria-label="Police station">' +
      '<span class="marker-blink-ring marker-blink-ring--end"></span>' +
      '<span class="marker-blink-ring marker-blink-ring--end marker-blink-ring--2"></span>' +
      '<span class="marker-blink-dot" style="background:' + color + '"></span>' +
      '<span class="marker-blink-label marker-blink-label--end">Station</span>' +
      '</div>'
    );
  }

  function stationMarkerHtml(color) {
    return '<span class="marker-blink-dot marker-blink-dot--small" style="background:' + color + '"></span>';
  }

  const userIcon = L.divIcon({
    className: 'route-marker route-marker-start',
    html: startMarkerHtml(),
    iconSize: [48, 56],
    iconAnchor: [24, 28],
  });

  function stationIcon(color, isEnd) {
    if (isEnd) {
      return L.divIcon({
        className: 'route-marker route-marker-police route-marker-end',
        html: endMarkerHtml(color),
        iconSize: [48, 56],
        iconAnchor: [24, 28],
      });
    }

    return L.divIcon({
      className: 'route-marker route-marker-police',
      html: stationMarkerHtml(color),
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  function updateEndpointBlinkMarkers() {
    nearestStations.forEach(function (entry, index) {
      const marker = stationMarkers[entry.id];
      if (!marker) {
        return;
      }
      const color = STATION_COLORS[index % STATION_COLORS.length];
      marker.setIcon(stationIcon(color, entry.id === selectedId));
    });
  }

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

  function stationId(station) {
    return 'police-' + station.name.replace(/\s+/g, '-').toLowerCase();
  }

  function roundCoord(value) {
    return Math.round(value * 1e6) / 1e6;
  }

  function formatDistance(meters) {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km away';
    }
    return Math.round(meters) + ' m away';
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

  function findTopNearest(userLat, userLng) {
    return stations
      .map(function (station) {
        return {
          station: station,
          distanceMeters: haversineDistanceMeters(
            userLat,
            userLng,
            station.latitude,
            station.longitude,
          ),
        };
      })
      .sort(function (a, b) {
        return a.distanceMeters - b.distanceMeters;
      })
      .slice(0, TOP_COUNT);
  }

  /** Single Geolocation API read per page load — avoids position jumping from repeat calls. */
  function getUserPositionOnce() {
    if (userPositionPromise) {
      return userPositionPromise;
    }

    userPositionPromise = new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            lat: roundCoord(position.coords.latitude),
            lng: roundCoord(position.coords.longitude),
          });
        },
        function (error) {
          userPositionPromise = null;
          const messages = {
            1: 'Location permission denied. Allow access to find nearest stations.',
            2: 'Location unavailable. Try again.',
            3: 'Location request timed out. Try again.',
          };
          reject(new Error(messages[error.code] || 'Could not fetch your location.'));
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    });

    return userPositionPromise;
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
      throw new Error('Could not load route.');
    }

    const data = await response.json();

    if (!data.routes || !data.routes.length) {
      throw new Error('No route found to this station.');
    }

    return data.routes[0];
  }

  function clearRoute() {
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
  }

  async function drawRouteToStation(entry) {
    if (!userLocation) {
      return;
    }

    clearRoute();

    try {
      const route = await fetchRoute(userLocation, {
        lat: entry.station.latitude,
        lng: entry.station.longitude,
      });

      const coordinates = route.geometry.coordinates.map(function (coord) {
        return [coord[1], coord[0]];
      });

      routeLine = L.polyline(coordinates, {
        color: '#4ade80',
        weight: 5,
        opacity: 0.95,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);
    } catch {
      routeLine = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [entry.station.latitude, entry.station.longitude],
        ],
        {
          color: '#4ade80',
          weight: 4,
          opacity: 0.7,
          dashArray: '8, 8',
        },
      ).addTo(map);
    }
  }

  function selectStation(id) {
    const entry = nearestStations.find(function (item) {
      return item.id === id;
    });

    if (!entry) {
      return;
    }

    selectedId = id;

    listEl.querySelectorAll('.police-station-card').forEach(function (card) {
      card.classList.toggle('selected', card.dataset.stationId === id);
    });

    const marker = stationMarkers[id];

    updateEndpointBlinkMarkers();

    if (marker && userLocation) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        marker.getLatLng(),
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
      marker.openPopup();
    }

    drawRouteToStation(entry);
  }

  function renderStationList() {
    listEl.innerHTML = '';

    nearestStations.forEach(function (entry, index) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'police-station-card' + (entry.id === selectedId ? ' selected' : '');
      card.dataset.stationId = entry.id;

      const rank = document.createElement('span');
      rank.className = 'police-station-rank';
      rank.textContent = String(index + 1);

      const body = document.createElement('div');
      body.className = 'police-station-body';

      const name = document.createElement('div');
      name.className = 'police-station-name';
      name.textContent = entry.station.name;

      const address = document.createElement('div');
      address.className = 'police-station-meta';
      address.textContent = entry.station.address;

      const officer = document.createElement('div');
      officer.className = 'police-station-meta';
      officer.textContent = entry.station.officer + ' · ' + entry.station.contact;

      const distance = document.createElement('div');
      distance.className = 'police-station-distance';
      distance.textContent = formatDistance(entry.distanceMeters);

      body.appendChild(name);
      body.appendChild(address);
      body.appendChild(officer);
      body.appendChild(distance);

      card.appendChild(rank);
      card.appendChild(body);

      card.addEventListener('click', function () {
        selectStation(entry.id);
      });

      listEl.appendChild(card);
    });
  }

  function renderMapMarkers() {
    stationMarkerLayer.clearLayers();
    Object.keys(stationMarkers).forEach(function (key) {
      delete stationMarkers[key];
    });

    nearestStations.forEach(function (entry, index) {
      const color = STATION_COLORS[index % STATION_COLORS.length];
      const marker = L.marker([entry.station.latitude, entry.station.longitude], {
        icon: stationIcon(color),
      }).bindPopup(
        '<strong>' +
          entry.station.name +
          '</strong><br>' +
          entry.station.address +
          '<br>' +
          entry.station.officer +
          '<br>Contact: ' +
          entry.station.contact,
      );

      marker.on('click', function () {
        selectStation(entry.id);
      });

      stationMarkers[entry.id] = marker;
      stationMarkerLayer.addLayer(marker);
    });

    if (!userMarker && userLocation) {
      userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('Your location');
    }

    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);

    nearestStations.forEach(function (entry) {
      bounds.extend([entry.station.latitude, entry.station.longitude]);
    });

    map.fitBounds(bounds, { padding: [50, 50] });
  }

  async function initPoliceMap() {
    if (mapInitialized) {
      return;
    }
    mapInitialized = true;

    try {
      setStatus('Getting your location…');
      userLocation = await getUserPositionOnce();

      nearestStations = findTopNearest(userLocation.lat, userLocation.lng).map(function (item) {
        return {
          id: stationId(item.station),
          station: item.station,
          distanceMeters: item.distanceMeters,
        };
      });

      if (!nearestStations.length) {
        throw new Error('No police stations found nearby.');
      }

      renderStationList();
      renderMapMarkers();

      selectedId = nearestStations[0].id;
      selectStation(selectedId);

      hideStatus();
    } catch (error) {
      mapInitialized = false;
      setStatus(error.message || 'Failed to load police stations.', true);
    }
  }

  const style = document.createElement('style');
  style.textContent =
    '.map-tiles-green { filter: hue-rotate(12deg) saturate(1.15) brightness(0.88); }' +
    '.route-marker { background: transparent !important; border: none !important; }' +
    '.marker-blink-wrap { position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }' +
    '.marker-blink-ring { position: absolute; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #4ade80; box-sizing: border-box; animation: police-marker-pulse 1.6s ease-out infinite; pointer-events: none; }' +
    '.marker-blink-ring--2 { animation-delay: 0.8s; }' +
    '.marker-blink-ring--end { border-color: #38bdf8; }' +
    '.marker-blink-dot { position: relative; z-index: 2; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ecfdf5; box-shadow: 0 0 14px rgba(74,222,128,0.75); }' +
    '.marker-blink-start .marker-blink-dot { background: #22c55e; animation: police-marker-dot-blink 1.2s ease-in-out infinite; }' +
    '.marker-blink-end .marker-blink-dot { animation: police-marker-dot-blink-end 1.2s ease-in-out infinite; }' +
    '.marker-blink-dot--small { display: block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 2px 6px rgba(0,0,0,0.35); }' +
    '.marker-blink-label { position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); z-index: 3; font: 700 9px/1 "Quicksand", sans-serif; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 5px; border-radius: 4px; white-space: nowrap; pointer-events: none; }' +
    '.marker-blink-start .marker-blink-label { background: rgba(22,163,74,0.95); color: #ecfdf5; box-shadow: 0 0 10px rgba(34,197,94,0.5); }' +
    '.marker-blink-label--end { background: rgba(14,116,144,0.95); color: #e0f2fe; box-shadow: 0 0 10px rgba(56,189,248,0.45); }' +
    '@keyframes police-marker-pulse { 0% { transform: scale(0.6); opacity: 0.95; } 100% { transform: scale(2.4); opacity: 0; } }' +
    '@keyframes police-marker-dot-blink { 0%, 100% { box-shadow: 0 0 8px rgba(74,222,128,0.5); transform: scale(1); } 50% { box-shadow: 0 0 22px rgba(74,222,128,1); transform: scale(1.12); } }' +
    '@keyframes police-marker-dot-blink-end { 0%, 100% { box-shadow: 0 0 8px rgba(56,189,248,0.45); transform: scale(1); } 50% { box-shadow: 0 0 22px rgba(56,189,248,0.95); transform: scale(1.12); } }' +
    '.leaflet-popup-content-wrapper { background: #0a120e; color: #d1fae5; border: 1px solid rgba(34,197,94,0.45); border-radius: 10px; }' +
    '.leaflet-popup-tip { background: #0a120e; }';
  document.head.appendChild(style);

  initPoliceMap();
})();
