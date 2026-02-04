import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { calculateDistance } from '../services/distance.js';

const coordSchema = z.object({
  latitude: z.number().describe('Latitude'),
  longitude: z.number().describe('Longitude'),
});

export function registerCalculateDistanceTool(server: McpServer): void {
  server.registerTool('calculate_distance', {
    description: 'Calculate the distance between two geographic points using the Haversine formula. Supports km, miles, and meters.',
    inputSchema: {
      point1: coordSchema.describe('First point coordinates'),
      point2: coordSchema.describe('Second point coordinates'),
      unit: z.enum(['km', 'mi', 'm']).default('km').describe('Distance unit: km, mi, or m'),
    },
  }, async (args) => {
    try {
      const result = calculateDistance(
        [args.point1.latitude, args.point1.longitude],
        [args.point2.latitude, args.point2.longitude],
        args.unit,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                distance: result.distance,
                unit: result.unit,
                from: { latitude: result.point1[0], longitude: result.point1[1] },
                to: { latitude: result.point2[0], longitude: result.point2[1] },
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
        content: [{ type: 'text' as const, text: `Error calculating distance: ${message}` }],
        isError: true,
      };
    }
  });
}
