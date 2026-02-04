import StaticMaps from 'staticmaps';
import sharp from 'sharp';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import type { ServerConfig } from '../types/config.js';
import type { Marker, Polyline, Polygon } from '../types/geo.js';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const MARKER_DIR = resolve(tmpdir(), 'mcp-map-markers');

async function ensureMarkerIcon(color: string = '#FF0000'): Promise<string> {
  if (!existsSync(MARKER_DIR)) mkdirSync(MARKER_DIR, { recursive: true });

  const safe = color.replace('#', '');
  const filePath = resolve(MARKER_DIR, `marker-${safe}.png`);

  if (!existsSync(filePath)) {
    const svg = `<svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="28" rx="5" ry="3" fill="rgba(0,0,0,0.3)"/>
      <path d="M12 0C6 0 1 5 1 11c0 8 11 20 11 20s11-12 11-20C23 5 18 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4" fill="white"/>
    </svg>`;
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(filePath, pngBuffer);
  }

  return filePath;
}

interface RenderOptions {
  center: [number, number]; // [lat, lng]
  zoom: number;
  width: number;
  height: number;
  markers?: Marker[];
  polylines?: Polyline[];
  polygons?: Polygon[];
}

export class MapRenderer {
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  private getTileUrl(): string {
    if (this.config.mapProvider === 'mapbox' && this.config.mapboxToken) {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${this.config.mapboxToken}`;
    }
    return OSM_TILE_URL;
  }

  async render(options: RenderOptions): Promise<Buffer> {
    const map = new StaticMaps({
      width: options.width,
      height: options.height,
      tileUrl: this.getTileUrl(),
      tileSize: 256,
      tileRequestHeader: {
        'User-Agent': 'travel-mcp-map-server/1.0',
      },
    });

    // Add markers
    if (options.markers && options.markers.length > 0) {
      for (const marker of options.markers) {
        const iconPath = await ensureMarkerIcon(marker.color || '#FF0000');
        map.addMarker({
          coord: [marker.position[1], marker.position[0]], // staticmaps uses [lng, lat]
          img: iconPath,
          height: 32,
          width: 24,
          offsetX: 12,
          offsetY: 32,
        });

        // Add label as text if provided
        if (marker.label) {
          map.addText({
            coord: [marker.position[1], marker.position[0]],
            text: marker.label,
            size: 12,
            color: '#000000',
            anchor: 'middle',
          });
        }
      }
    }

    // Add polylines
    if (options.polylines && options.polylines.length > 0) {
      for (const polyline of options.polylines) {
        map.addLine({
          coords: polyline.points.map((p) => [p[1], p[0]]), // [lng, lat]
          color: polyline.color || '#0000FF',
          width: polyline.width || 3,
        });
      }
    }

    // Add polygons
    if (options.polygons && options.polygons.length > 0) {
      for (const polygon of options.polygons) {
        map.addPolygon({
          coords: polygon.points.map((p) => [p[1], p[0]]), // [lng, lat]
          color: polygon.strokeColor || '#0000FF',
          fill: polygon.fillColor || '#0000FF33',
          width: polygon.strokeWidth || 2,
        });
      }
    }

    // Render the map - center is [lng, lat] for staticmaps
    await map.render([options.center[1], options.center[0]], options.zoom);

    // Return as PNG buffer
    const buffer = await map.image.buffer('image/png');
    return buffer;
  }
}
