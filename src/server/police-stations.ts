import { db } from "./mongoauth";

const collection = db.collection<PoliceStation>('police-stations')
const resultset = await collection.find().toArray()

export interface PoliceStation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact: string;
  officer: string;
}

export const policeStations: PoliceStation[] = resultset

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

export function findTopNearestPoliceStations(
  userLat: number,
  userLng: number,
  count = 4,
): Array<{ station: PoliceStation; distanceMeters: number }> {
  return policeStations
    .map((station) => ({
      station,
      distanceMeters: distanceMeters(userLat, userLng, station.latitude, station.longitude),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, count);
}
