export interface ServerConfig {
  port: number;
  host: string;
  mapProvider: 'osm' | 'mapbox';
  mapboxToken?: string;
  geocodingProvider: 'nominatim' | 'mapbox';
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  outputDir: string;
}

export function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    mapProvider: (process.env.MAP_PROVIDER as 'osm' | 'mapbox') || 'osm',
    mapboxToken: process.env.MAPBOX_TOKEN,
    geocodingProvider: (process.env.GEOCODING_PROVIDER as 'nominatim' | 'mapbox') || 'nominatim',
    cacheEnabled: process.env.CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10),
    rateLimit: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    },
    outputDir: process.env.OUTPUT_DIR || '/tmp/mcp-maps',
  };
}
