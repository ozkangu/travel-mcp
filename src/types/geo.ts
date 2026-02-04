export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Marker {
  position: [number, number]; // [lat, lng]
  label?: string;
  color?: string;
  size?: number;
}

export interface Polygon {
  points: [number, number][]; // [[lat, lng], ...]
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface Polyline {
  points: [number, number][]; // [[lat, lng], ...]
  color?: string;
  width?: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  type?: string;
  importance?: number;
  boundingBox?: BoundingBox;
}

export interface DistanceResult {
  distance: number;
  unit: 'km' | 'mi' | 'm';
  point1: [number, number];
  point2: [number, number];
}

export interface MapRenderResult {
  imageBase64: string;
  width: number;
  height: number;
  center: [number, number];
  zoom: number;
}
