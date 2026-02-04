import { describe, it, expect } from 'vitest';
import { calculateDistance, isInBoundingBox } from './distance.js';

describe('calculateDistance', () => {
  it('should calculate distance between Istanbul and Ankara in km', () => {
    const istanbul: [number, number] = [41.0082, 28.9784];
    const ankara: [number, number] = [39.9334, 32.8597];
    const result = calculateDistance(istanbul, ankara, 'km');

    // Known distance is ~350km
    expect(result.distance).toBeGreaterThan(340);
    expect(result.distance).toBeLessThan(360);
    expect(result.unit).toBe('km');
  });

  it('should calculate distance in miles', () => {
    const istanbul: [number, number] = [41.0082, 28.9784];
    const ankara: [number, number] = [39.9334, 32.8597];
    const result = calculateDistance(istanbul, ankara, 'mi');

    expect(result.distance).toBeGreaterThan(210);
    expect(result.distance).toBeLessThan(225);
    expect(result.unit).toBe('mi');
  });

  it('should calculate distance in meters', () => {
    const istanbul: [number, number] = [41.0082, 28.9784];
    const ankara: [number, number] = [39.9334, 32.8597];
    const result = calculateDistance(istanbul, ankara, 'm');

    expect(result.distance).toBeGreaterThan(340000);
    expect(result.distance).toBeLessThan(360000);
    expect(result.unit).toBe('m');
  });

  it('should return 0 for same point', () => {
    const point: [number, number] = [41.0082, 28.9784];
    const result = calculateDistance(point, point, 'km');
    expect(result.distance).toBe(0);
  });

  it('should return correct point references', () => {
    const p1: [number, number] = [41.0, 29.0];
    const p2: [number, number] = [40.0, 30.0];
    const result = calculateDistance(p1, p2);
    expect(result.point1).toEqual(p1);
    expect(result.point2).toEqual(p2);
  });

  it('should default to km', () => {
    const p1: [number, number] = [41.0, 29.0];
    const p2: [number, number] = [40.0, 30.0];
    const result = calculateDistance(p1, p2);
    expect(result.unit).toBe('km');
  });
});

describe('isInBoundingBox', () => {
  const turkeyBbox = { north: 42.1, south: 35.8, east: 44.8, west: 26.0 };

  it('should return true for Istanbul (inside Turkey bbox)', () => {
    expect(isInBoundingBox(41.0082, 28.9784, turkeyBbox)).toBe(true);
  });

  it('should return false for London (outside Turkey bbox)', () => {
    expect(isInBoundingBox(51.5074, -0.1278, turkeyBbox)).toBe(false);
  });

  it('should return true for point on boundary', () => {
    expect(isInBoundingBox(42.1, 30.0, turkeyBbox)).toBe(true);
  });
});
