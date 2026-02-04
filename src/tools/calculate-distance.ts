import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { calculateDistance } from '../services/distance.js';

export function registerCalculateDistanceTool(server: McpServer): void {
  server.registerTool('calculate_distance', {
    description: 'Calculate the distance between two geographic points using the Haversine formula. Supports km, miles, and meters.',
    inputSchema: {
      point1: z.tuple([z.number(), z.number()]).describe('First point as [latitude, longitude]'),
      point2: z.tuple([z.number(), z.number()]).describe('Second point as [latitude, longitude]'),
      unit: z.enum(['km', 'mi', 'm']).default('km').describe('Distance unit: km, mi, or m'),
    },
  }, async (args) => {
    try {
      const result = calculateDistance(
        args.point1 as [number, number],
        args.point2 as [number, number],
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
