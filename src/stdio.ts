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

  registerRenderMapTool(server, config);
  registerGeocodeTool(server, config);
  registerReverseGeocodeTool(server, config);
  registerCalculateDistanceTool(server);
  registerSearchNearbyTool(server, config);
  registerSearchFlightsTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP Map Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
