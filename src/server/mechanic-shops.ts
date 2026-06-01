import { db } from "./mongoauth";

const collection = db.collection('mechanic-shops');
const docs = await collection.find({}).toArray();

export interface MechanicShop {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact: string;
}

export const mechanicShops: MechanicShop[] = docs.map((item) => ({
  name: item['name'],
  address: item['address'],
  latitude: item['latitude'],
  longitude: item['longitude'],
  contact: item['contact'],
}));

/** Great-circle distance in meters (Haversine). */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadius = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestMechanicShop(
  userLat: number,
  userLng: number,
): { shop: MechanicShop; distanceMeters: number } {
  let nearest = mechanicShops[0];
  let minDistance = distanceMeters(userLat, userLng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < mechanicShops.length; i++) {
    const shop = mechanicShops[i];
    const d = distanceMeters(userLat, userLng, shop.latitude, shop.longitude);

    if (d < minDistance) {
      minDistance = d;
      nearest = shop;
    }
  }

  return { shop: nearest, distanceMeters: minDistance };
}
