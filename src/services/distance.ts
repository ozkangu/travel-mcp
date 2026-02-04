import type { DistanceResult } from '../types/geo.js';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the distance between two points using the Haversine formula.
 */
export function calculateDistance(
  point1: [number, number],
  point2: [number, number],
  unit: 'km' | 'mi' | 'm' = 'km',
): DistanceResult {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = EARTH_RADIUS_KM * c;

  switch (unit) {
    case 'mi':
      distance = distance * 0.621371;
      break;
    case 'm':
      distance = distance * 1000;
      break;
    case 'km':
    default:
      break;
  }

  return {
    distance: Math.round(distance * 100) / 100,
    unit,
    point1,
    point2,
  };
}

/**
 * Check if a coordinate is within a bounding box.
 */
export function isInBoundingBox(
  lat: number,
  lon: number,
  bbox: { north: number; south: number; east: number; west: number },
): boolean {
  return lat >= bbox.south && lat <= bbox.north && lon >= bbox.west && lon <= bbox.east;
}
