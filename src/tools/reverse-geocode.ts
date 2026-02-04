import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeocodingService } from '../services/geocoding.js';
import type { ServerConfig } from '../types/config.js';

export function registerReverseGeocodeTool(server: McpServer, config: ServerConfig): void {
  const geocoding = new GeocodingService(config);

  server.registerTool('reverse_geocode', {
    description: 'Convert geographic coordinates (latitude/longitude) to a human-readable address.',
    inputSchema: {
      latitude: z.number().min(-90).max(90).describe('Latitude coordinate'),
      longitude: z.number().min(-180).max(180).describe('Longitude coordinate'),
    },
  }, async (args) => {
    try {
      const result = await geocoding.reverseGeocode(args.latitude, args.longitude);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                latitude: result.latitude,
                longitude: result.longitude,
                displayName: result.displayName,
                type: result.type,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Error reverse geocoding: ${message}` }],
        isError: true,
      };
    }
  });
}
