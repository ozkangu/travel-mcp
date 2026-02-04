import StaticMaps from 'staticmaps';
import type { ServerConfig } from '../types/config.js';
import type { Marker, Polyline, Polygon } from '../types/geo.js';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

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
        map.addMarker({
          coord: [marker.position[1], marker.position[0]], // staticmaps uses [lng, lat]
          img: marker.color ? undefined : undefined, // use default marker
          height: marker.size || 24,
          width: marker.size || 24,
        });
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
