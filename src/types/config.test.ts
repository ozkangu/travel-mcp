import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default config when no env vars set', () => {
    delete process.env.MAP_PROVIDER;
    delete process.env.MAPBOX_TOKEN;
    delete process.env.GEOCODING_PROVIDER;
    delete process.env.CACHE_ENABLED;
    delete process.env.CACHE_TTL;
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.OUTPUT_DIR;

    const config = loadConfig();

    expect(config.mapProvider).toBe('osm');
    expect(config.geocodingProvider).toBe('nominatim');
    expect(config.cacheEnabled).toBe(false);
    expect(config.cacheTTL).toBe(300);
    expect(config.rateLimit.maxRequests).toBe(100);
    expect(config.rateLimit.windowMs).toBe(60000);
    expect(config.outputDir).toBe('/tmp/mcp-maps');
  });

  it('should use env vars when set', () => {
    process.env.MAP_PROVIDER = 'mapbox';
    process.env.MAPBOX_TOKEN = 'test-token';
    process.env.GEOCODING_PROVIDER = 'mapbox';
    process.env.CACHE_ENABLED = 'true';
    process.env.CACHE_TTL = '600';
    process.env.RATE_LIMIT_MAX = '200';
    process.env.RATE_LIMIT_WINDOW_MS = '120000';
    process.env.OUTPUT_DIR = '/custom/dir';

    const config = loadConfig();

    expect(config.mapProvider).toBe('mapbox');
    expect(config.mapboxToken).toBe('test-token');
    expect(config.geocodingProvider).toBe('mapbox');
    expect(config.cacheEnabled).toBe(true);
    expect(config.cacheTTL).toBe(600);
    expect(config.rateLimit.maxRequests).toBe(200);
    expect(config.rateLimit.windowMs).toBe(120000);
    expect(config.outputDir).toBe('/custom/dir');
  });
});
