/**
 * Fetches human-readable location using the browser Geolocation API.
 * Falls back to coordinates if reverse geocoding is unavailable.
 */
function formatLocation(data) {
  const city =
    data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.informative?.[0]?.name;
  const state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name;
  const country = data.countryName;

  return [city, state, country].filter(Boolean).join(', ');
}

async function reverseGeocode(latitude, longitude) {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );

  if (!response.ok) {
    throw new Error('reverse-geocode-failed');
  }

  const data = await response.json();
  const location = formatLocation(data);

  if (!location) {
    throw new Error('address-not-found');
  }

  return location;
}

export function fetchCurrentLocation(options = {}) {
  const { timeout = 15000, enableHighAccuracy = true } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        try {
          resolve(await reverseGeocode(latitude, longitude));
          return;
        } catch {
          /* use coordinates below */
        }

        resolve(fallback);
      },
      (error) => {
        const messages = {
          1: 'Location permission denied. Please allow access in your browser.',
          2: 'Location unavailable. Try again or enter manually.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || 'Could not fetch your location.'));
      },
      { enableHighAccuracy, timeout, maximumAge: 0 },
    );
  });
}
