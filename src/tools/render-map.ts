import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MapRenderer } from '../services/map-renderer.js';
import type { ServerConfig } from '../types/config.js';

const coordSchema = z.object({
  latitude: z.number().describe('Latitude'),
  longitude: z.number().describe('Longitude'),
});

const markerSchema = z.object({
  latitude: z.number().describe('Marker latitude'),
  longitude: z.number().describe('Marker longitude'),
  label: z.string().optional().describe('Label text for the marker'),
  color: z.string().optional().describe('Marker color (hex)'),
  size: z.number().optional().describe('Marker size in pixels'),
});

const polylineSchema = z.object({
  points: z.array(coordSchema).describe('Array of coordinate points'),
  color: z.string().optional().describe('Line color (hex)'),
  width: z.number().optional().describe('Line width in pixels'),
});

const polygonSchema = z.object({
  points: z.array(coordSchema).describe('Array of coordinate points'),
  fillColor: z.string().optional().describe('Fill color (hex with alpha)'),
  strokeColor: z.string().optional().describe('Stroke color (hex)'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
});

export function registerRenderMapTool(server: McpServer, config: ServerConfig): void {
  const renderer = new MapRenderer(config);

  server.registerTool('render_map', {
    description: 'Renders a static map image with markers, polylines, and polygon overlays. Returns a base64-encoded PNG image.',
    inputSchema: {
      center: coordSchema.describe('Map center coordinates'),
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
        center: [args.center.latitude, args.center.longitude],
        zoom: args.zoom,
        width: args.width,
        height: args.height,
        markers: args.markers?.map((m) => ({
          position: [m.latitude, m.longitude] as [number, number],
          label: m.label,
          color: m.color,
          size: m.size,
        })),
        polylines: args.polylines?.map((p) => ({
          points: p.points.map((c) => [c.latitude, c.longitude] as [number, number]),
          color: p.color,
          width: p.width,
        })),
        polygons: args.polygons?.map((p) => ({
          points: p.points.map((c) => [c.latitude, c.longitude] as [number, number]),
          fillColor: p.fillColor,
          strokeColor: p.strokeColor,
          strokeWidth: p.strokeWidth,
        })),
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
