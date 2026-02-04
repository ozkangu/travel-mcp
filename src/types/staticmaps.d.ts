declare module 'staticmaps' {
  interface StaticMapsOptions {
    width: number;
    height: number;
    tileUrl?: string;
    tileSize?: number;
    tileSubdomains?: string[];
    tileRequestTimeout?: number;
    tileRequestHeader?: Record<string, string>;
    tileRequestLimit?: number;
    zoomRange?: { min?: number; max?: number };
    paddingX?: number;
    paddingY?: number;
    reverseY?: boolean;
  }

  interface MarkerOptions {
    coord: [number, number]; // [lng, lat]
    img?: string;
    height?: number;
    width?: number;
    offsetX?: number;
    offsetY?: number;
  }

  interface LineOptions {
    coords: [number, number][]; // [[lng, lat], ...]
    color?: string;
    width?: number;
  }

  interface PolygonOptions {
    coords: [number, number][]; // [[lng, lat], ...]
    color?: string;
    fill?: string;
    width?: number;
  }

  interface TextOptions {
    coord: [number, number];
    text: string;
    size?: number;
    color?: string;
    font?: string;
    anchor?: string;
  }

  interface ImageResult {
    save(path: string, options?: Record<string, unknown>): Promise<void>;
    buffer(mime: string, options?: Record<string, unknown>): Promise<Buffer>;
  }

  class StaticMaps {
    image: ImageResult;
    constructor(options?: StaticMapsOptions);
    addMarker(options: MarkerOptions): void;
    addLine(options: LineOptions): void;
    addPolygon(options: PolygonOptions): void;
    addText(options: TextOptions): void;
    render(center?: [number, number], zoom?: number): Promise<void>;
  }

  export default StaticMaps;
}
