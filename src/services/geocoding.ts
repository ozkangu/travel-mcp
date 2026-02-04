import axios from 'axios';
import type { GeocodingResult } from '../types/geo.js';
import type { ServerConfig } from '../types/config.js';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
  boundingbox: [string, string, string, string];
}

export class GeocodingService {
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  async geocode(address: string, country?: string): Promise<GeocodingResult[]> {
    if (this.config.geocodingProvider === 'mapbox' && this.config.mapboxToken) {
      return this.geocodeMapbox(address, country);
    }
    return this.geocodeNominatim(address, country);
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    if (this.config.geocodingProvider === 'mapbox' && this.config.mapboxToken) {
      return this.reverseGeocodeMapbox(latitude, longitude);
    }
    return this.reverseGeocodeNominatim(latitude, longitude);
  }

  private async geocodeNominatim(address: string, country?: string): Promise<GeocodingResult[]> {
    const params: Record<string, string> = {
      q: address,
      format: 'json',
      limit: '5',
      addressdetails: '1',
    };
    if (country) {
      params.countrycodes = country.toLowerCase();
    }

    const response = await axios.get<NominatimResult[]>(`${NOMINATIM_BASE}/search`, {
      params,
      headers: {
        'User-Agent': 'travel-mcp-map-server/1.0',
      },
      timeout: 5000,
    });

    return response.data.map((r) => ({
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      displayName: r.display_name,
      type: r.type,
      importance: r.importance,
      boundingBox: {
        south: parseFloat(r.boundingbox[0]),
        north: parseFloat(r.boundingbox[1]),
        west: parseFloat(r.boundingbox[2]),
        east: parseFloat(r.boundingbox[3]),
      },
    }));
  }

  private async reverseGeocodeNominatim(latitude: number, longitude: number): Promise<GeocodingResult> {
    const response = await axios.get<NominatimResult & { error?: string }>(
      `${NOMINATIM_BASE}/reverse`,
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
        },
        headers: {
          'User-Agent': 'travel-mcp-map-server/1.0',
        },
        timeout: 5000,
      },
    );

    const r = response.data;
    if (r.error) {
      throw new Error(`Reverse geocoding failed: ${r.error}`);
    }

    return {
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      displayName: r.display_name,
      type: r.type,
      importance: r.importance,
      boundingBox: {
        south: parseFloat(r.boundingbox[0]),
        north: parseFloat(r.boundingbox[1]),
        west: parseFloat(r.boundingbox[2]),
        east: parseFloat(r.boundingbox[3]),
      },
    };
  }

  private async geocodeMapbox(address: string, country?: string): Promise<GeocodingResult[]> {
    const token = this.config.mapboxToken;
    const params: Record<string, string> = {
      access_token: token!,
      limit: '5',
    };
    if (country) {
      params.country = country.toLowerCase();
    }

    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      { params, timeout: 5000 },
    );

    return response.data.features.map((f: any) => ({
      latitude: f.center[1],
      longitude: f.center[0],
      displayName: f.place_name,
      type: f.place_type?.[0],
      importance: f.relevance,
      boundingBox: f.bbox
        ? { west: f.bbox[0], south: f.bbox[1], east: f.bbox[2], north: f.bbox[3] }
        : undefined,
    }));
  }

  private async reverseGeocodeMapbox(latitude: number, longitude: number): Promise<GeocodingResult> {
    const token = this.config.mapboxToken;
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
      {
        params: { access_token: token },
        timeout: 5000,
      },
    );

    const f = response.data.features[0];
    if (!f) {
      throw new Error('No results found for reverse geocoding');
    }

    return {
      latitude: f.center[1],
      longitude: f.center[0],
      displayName: f.place_name,
      type: f.place_type?.[0],
      importance: f.relevance,
      boundingBox: f.bbox
        ? { west: f.bbox[0], south: f.bbox[1], east: f.bbox[2], north: f.bbox[3] }
        : undefined,
    };
  }
}
