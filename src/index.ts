#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { loadConfig } from './types/config.js';
import {
  registerRenderMapTool,
  registerGeocodeTool,
  registerReverseGeocodeTool,
  registerCalculateDistanceTool,
  registerSearchNearbyTool,
  registerSearchFlightsTool,
} from './tools/index.js';

const config = loadConfig();

function createServer(): McpServer {
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

  return server;
}

// Session transport store
const transports: Record<string, StreamableHTTPServerTransport> = {};

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'travel-mcp-map-server', version: '1.0.0' });
});

// MCP POST - initialize or call tools
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    if (sessionId && transports[sessionId]) {
      // Existing session
      await transports[sessionId].handleRequest(req, res, req.body);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
          console.log(`Session initialized: ${sid}`);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
          console.log(`Session closed: ${sid}`);
        }
      };

      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
        id: null,
      });
    }
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// MCP GET - SSE stream
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

// MCP DELETE - terminate session
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});

const httpServer = createHttpServer(app);
httpServer.listen(config.port, config.host);
httpServer.on('listening', () => {
  console.log(`MCP Map Server listening on http://${config.host}:${config.port}/mcp`);
  console.log(`Health check: http://${config.host}:${config.port}/health`);
  console.log(`Map provider: ${config.mapProvider}`);
  console.log(`Geocoding provider: ${config.geocodingProvider}`);
});
httpServer.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  for (const sid of Object.keys(transports)) {
    try {
      await transports[sid].close();
      delete transports[sid];
    } catch {}
  }
  process.exit(0);
});
