import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GeocodingService } from '../services/geocoding.js';
import type { ServerConfig } from '../types/config.js';

export function registerGeocodeTool(server: McpServer, config: ServerConfig): void {
  const geocoding = new GeocodingService(config);

  server.registerTool('geocode', {
    description: 'Convert an address or place name to geographic coordinates (latitude/longitude). Supports fuzzy search and Turkish characters.',
    inputSchema: {
      address: z.string().describe('Address or place name to geocode'),
      country: z.string().default('TR').describe('ISO country code to limit results (e.g., TR, US, DE)'),
    },
  }, async (args) => {
    try {
      const results = await geocoding.geocode(args.address, args.country);

      if (results.length === 0) {
        return {
          content: [{ type: 'text' as const, text: `No results found for address: "${args.address}"` }],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              results.map((r) => ({
                latitude: r.latitude,
                longitude: r.longitude,
                displayName: r.displayName,
                type: r.type,
                importance: r.importance,
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
        content: [{ type: 'text' as const, text: `Error geocoding address: ${message}` }],
        isError: true,
      };
    }
  });
}
