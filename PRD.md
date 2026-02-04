# Product Requirements Document: OpenAI MCP Map Server

## 1. Executive Summary

OpenAI Apps SDK için Model Context Protocol (MCP) uyumlu bir harita sunucusu geliştirilecek. Bu sunucu, OpenAI uygulamaları içinde harita görselleştirme, konum işlemleri ve coğrafi veri yönetimi yeteneklerini sağlayacak.

## 2. Problem Statement

OpenAI uygulamaları içinde dinamik harita entegrasyonu ve coğrafi veri işleme yetenekleri mevcut değil. Kullanıcılar konum bazlı sorguları görselleştiremekte zorluk çekiyor ve harita üzerinde etkileşimli işlemler gerçekleştiremiyor.

## 3. Goals & Success Metrics

**Goals:**
- MCP standardına uygun, OpenAI Apps SDK ile entegre çalışan map server
- Coğrafi veri sorgulaması ve görselleştirme desteği
- Gerçek zamanlı harita render ve güncelleme
- Minimal latency ile hızlı yanıt süreleri

**Success Metrics:**
- API yanıt süresi < 500ms
- %99.9 uptime
- Günlük 10K+ harita render talebi desteği
- OpenAI Apps içinde sorunsuz entegrasyon

## 4. Technical Requirements

### 4.1 MCP Protocol Implementation
```typescript
// MCP Server Structure
- Protocol version: latest stable
- Transport: stdio or SSE
- Authentication: API key based
- Rate limiting: 100 req/min per user
```

### 4.2 Core Features

**Feature 1: Map Rendering**
- Statik harita görselleştirme
- Marker, polygon, polyline desteği
- Zoom levels: 1-20
- Map providers: OpenStreetMap, Mapbox (configurable)

**Feature 2: Geocoding & Reverse Geocoding**
- Adres → Koordinat dönüşümü
- Koordinat → Adres dönüşümü
- Fuzzy search desteği
- Türkçe karakter desteği

**Feature 3: Location Operations**
- Mesafe hesaplama (haversine)
- Bounding box içinde konum arama
- Route/directions (optional, gelecek versiyonlar için)

**Feature 4: Data Layers**
- Custom GeoJSON overlay desteği
- POI (Points of Interest) gösterimi
- Heatmap görselleştirme (optional)

### 4.3 MCP Tools Definition

```json
{
  "tools": [
    {
      "name": "render_map",
      "description": "Renders a static map with markers and overlays",
      "inputSchema": {
        "type": "object",
        "properties": {
          "center": {"type": "array", "items": {"type": "number"}},
          "zoom": {"type": "integer", "minimum": 1, "maximum": 20},
          "markers": {"type": "array"},
          "width": {"type": "integer", "default": 800},
          "height": {"type": "integer", "default": 600}
        }
      }
    },
    {
      "name": "geocode",
      "description": "Convert address to coordinates",
      "inputSchema": {
        "type": "object",
        "properties": {
          "address": {"type": "string"},
          "country": {"type": "string", "default": "TR"}
        }
      }
    },
    {
      "name": "reverse_geocode",
      "description": "Convert coordinates to address",
      "inputSchema": {
        "type": "object",
        "properties": {
          "latitude": {"type": "number"},
          "longitude": {"type": "number"}
        }
      }
    },
    {
      "name": "calculate_distance",
      "description": "Calculate distance between two points",
      "inputSchema": {
        "type": "object",
        "properties": {
          "point1": {"type": "array", "items": {"type": "number"}},
          "point2": {"type": "array", "items": {"type": "number"}},
          "unit": {"type": "string", "enum": ["km", "mi", "m"]}
        }
      }
    }
  ]
}
```

## 5. Architecture

### 5.1 Tech Stack
- **Runtime**: Node.js (TypeScript)
- **MCP SDK**: @modelcontextprotocol/sdk
- **Map Rendering**: 
  - Static: staticmaps or sharp + tileset
  - Dynamic: Leaflet (for future interactive features)
- **Geocoding**: Nominatim (OSM) veya Mapbox Geocoding API
- **Storage**: Cache için Redis (optional)

### 5.2 System Design
```
┌─────────────────┐
│  OpenAI App     │
│   (ChatGPT)     │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│  MCP Map Server │
│   ├─ Tools      │
│   ├─ Resources  │
│   └─ Prompts    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Maps  │ │Geocode│
│ API   │ │  API  │
└───────┘ └───────┘
```

### 5.3 Configuration
```typescript
interface ServerConfig {
  mapProvider: 'osm' | 'mapbox';
  mapboxToken?: string;
  geocodingProvider: 'nominatim' | 'mapbox';
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}
```

## 6. Implementation Plan

### Phase 1: MVP (Week 1-2)
- MCP server boilerplate setup
- Basic map rendering (statik)
- Geocoding/reverse geocoding
- OpenAI Apps SDK entegrasyonu

### Phase 2: Enhancement (Week 3)
- Marker customization
- GeoJSON overlay support
- Distance calculation
- Cache layer implementation

### Phase 3: Optimization (Week 4)
- Performance tuning
- Error handling iyileştirmeleri
- Comprehensive testing
- Documentation

## 7. API Examples

### Example 1: Render Map
```typescript
// User: "Show me a map of Istanbul with Taksim Square marked"
await client.callTool({
  name: "render_map",
  arguments: {
    center: [41.0369, 28.9850],
    zoom: 13,
    markers: [{
      position: [41.0369, 28.9850],
      label: "Taksim Square"
    }],
    width: 1200,
    height: 800
  }
});
```

### Example 2: Geocoding
```typescript
// User: "What are the coordinates of Ankara Esenboğa Airport?"
await client.callTool({
  name: "geocode",
  arguments: {
    address: "Ankara Esenboğa Airport",
    country: "TR"
  }
});
// Returns: { lat: 40.1281, lon: 32.9951, display_name: "..." }
```

## 8. Non-Functional Requirements

### 8.1 Performance
- Map render: < 500ms
- Geocoding: < 300ms
- Concurrent requests: 50+

### 8.2 Security
- API key validation
- Rate limiting per client
- Input sanitization
- CORS policy

### 8.3 Scalability
- Horizontal scaling ready
- Stateless design
- Redis cache için hazır

### 8.4 Monitoring
- Request/response logging
- Error tracking (Sentry compatible)
- Performance metrics
- Health check endpoint

## 9. Dependencies & Licensing

### Core Dependencies
- `@modelcontextprotocol/sdk` - MIT
- `express` - MIT (for optional HTTP transport)
- `axios` - MIT (API calls)
- `sharp` - Apache 2.0 (image processing)
- `staticmaps` - MIT

**License**: Apache 2.0 (SARP projesi ile uyumlu)

## 10. Testing Strategy

- Unit tests: Tool implementations
- Integration tests: MCP protocol flow
- E2E tests: OpenAI Apps içinde
- Load tests: 100 concurrent users

## 11. Documentation Deliverables

1. **README.md**: Setup ve kullanım
2. **API.md**: Tool specifications
3. **CONTRIBUTING.md**: Geliştirme guidelines
4. **EXAMPLES.md**: Use case örnekleri

## 12. Future Considerations

- Interactive map desteği (WebSocket)
- Real-time location tracking
- Custom tile server entegrasyonu
- Routing/directions API
- 3D map rendering
- Offline map cache

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits (3rd party) | High | Cache layer + fallback providers |
| MCP spec değişiklikleri | Medium | SDK versiyonlama + backward compatibility |
| Performance bottlenecks | High | Load testing + caching strategy |
| Map provider maliyetleri | Medium | OSM fallback + quota monitoring |

---

**Target Launch**: 4 weeks  
**Team Size**: 1 developer (sen)  
**Effort Estimate**: 80-100 hours