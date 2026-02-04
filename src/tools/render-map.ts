import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MapRenderer } from '../services/map-renderer.js';
import type { ServerConfig } from '../types/config.js';
import type { Marker, Polyline, Polygon } from '../types/geo.js';

const markerSchema = z.object({
  position: z.tuple([z.number(), z.number()]).describe('Marker position as [latitude, longitude]'),
  label: z.string().optional().describe('Label text for the marker'),
  color: z.string().optional().describe('Marker color (hex)'),
  size: z.number().optional().describe('Marker size in pixels'),
});

const polylineSchema = z.object({
  points: z.array(z.tuple([z.number(), z.number()])).describe('Array of [lat, lng] coordinates'),
  color: z.string().optional().describe('Line color (hex)'),
  width: z.number().optional().describe('Line width in pixels'),
});

const polygonSchema = z.object({
  points: z.array(z.tuple([z.number(), z.number()])).describe('Array of [lat, lng] coordinates'),
  fillColor: z.string().optional().describe('Fill color (hex with alpha)'),
  strokeColor: z.string().optional().describe('Stroke color (hex)'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
});

export function registerRenderMapTool(server: McpServer, config: ServerConfig): void {
  const renderer = new MapRenderer(config);

  server.registerTool('render_map', {
    description: 'Renders a static map image with markers, polylines, and polygon overlays. Returns a base64-encoded PNG image.',
    inputSchema: {
      center: z.tuple([z.number(), z.number()]).describe('Map center as [latitude, longitude]'),
      zoom: z.number().int().min(1).max(20).describe('Zoom level (1-20)'),
      width: z.number().int().min(100).max(2048).default(800).describe('Image width in pixels'),
      height: z.number().int().min(100).max(2048).default(600).describe('Image height in pixels'),
      markers: z.array(markerSchema).optional().describe('Array of map markers'),
      polylines: z.array(polylineSchema).optional().describe('Array of polylines to draw'),
      polygons: z.array(polygonSchema).optional().describe('Array of polygons to draw'),
    },
  }, async (args) => {
    try {
      const buffer = await renderer.render({
        center: args.center as [number, number],
        zoom: args.zoom,
        width: args.width,
        height: args.height,
        markers: args.markers as Marker[] | undefined,
        polylines: args.polylines as Polyline[] | undefined,
        polygons: args.polygons as Polygon[] | undefined,
      });

      const base64 = buffer.toString('base64');

      return {
        content: [
          {
            type: 'image' as const,
            data: base64,
            mimeType: 'image/png',
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error rendering map: ${message}` }],
        isError: true,
      };
    }
  });
}
