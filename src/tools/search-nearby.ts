import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeocodingService } from '../services/geocoding.js';
import { calculateDistance } from '../services/distance.js';
import type { ServerConfig } from '../types/config.js';

export function registerSearchNearbyTool(server: McpServer, config: ServerConfig): void {
  const geocoding = new GeocodingService(config);

  server.registerTool('search_nearby', {
    description: 'Search for places near a given coordinate within a specified radius. Uses OpenStreetMap Nominatim for place search.',
    inputSchema: {
      latitude: z.number().min(-90).max(90).describe('Center latitude'),
      longitude: z.number().min(-180).max(180).describe('Center longitude'),
      query: z.string().describe('Search query (e.g., "restaurant", "hotel", "museum")'),
      radiusKm: z.number().min(0.1).max(50).default(5).describe('Search radius in kilometers'),
    },
  }, async (args) => {
    try {
      // Search using geocoding with a viewbox constraint
      const delta = args.radiusKm / 111; // rough degrees per km
      const results = await geocoding.geocode(args.query);

      // Filter results by distance
      const nearby = results
        .map((r) => ({
          ...r,
          distance: calculateDistance(
            [args.latitude, args.longitude],
            [r.latitude, r.longitude],
            'km',
          ).distance,
        }))
        .filter((r) => r.distance <= args.radiusKm)
        .sort((a, b) => a.distance - b.distance);

      if (nearby.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No results found for "${args.query}" within ${args.radiusKm}km of [${args.latitude}, ${args.longitude}]`,
          }],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              nearby.map((r) => ({
                displayName: r.displayName,
                latitude: r.latitude,
                longitude: r.longitude,
                distanceKm: r.distance,
                type: r.type,
              })),
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error searching nearby: ${message}` }],
        isError: true,
      };
    }
  });
}
