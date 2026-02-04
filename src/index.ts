#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './types/config.js';
import {
  registerRenderMapTool,
  registerGeocodeTool,
  registerReverseGeocodeTool,
  registerCalculateDistanceTool,
  registerSearchNearbyTool,
  registerSearchFlightsTool,
} from './tools/index.js';

async function main(): Promise<void> {
  const config = loadConfig();

  const server = new McpServer({
    name: 'travel-mcp-map-server',
    version: '1.0.0',
  });

  // Register all tools
  registerRenderMapTool(server, config);
  registerGeocodeTool(server, config);
  registerReverseGeocodeTool(server, config);
  registerCalculateDistanceTool(server);
  registerSearchNearbyTool(server, config);
  registerSearchFlightsTool(server);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used by MCP protocol)
  console.error('MCP Map Server is running on stdio transport');
  console.error(`Map provider: ${config.mapProvider}`);
  console.error(`Geocoding provider: ${config.geocodingProvider}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
