import { describe, it, expect } from 'vitest';
import { searchFlights, formatFlightResults } from './flight-search.js';

describe('searchFlights', () => {
  it('should return flights for valid domestic route', () => {
    const flights = searchFlights('IST', 'AYT', '2026-02-10');
    expect(flights.length).toBeGreaterThanOrEqual(3);
    expect(flights.length).toBeLessThanOrEqual(5);

    for (const f of flights) {
      expect(f.departure.airportCode).toBe('IST');
      expect(f.arrival.airportCode).toBe('AYT');
      expect(f.flightNumber).toBeTruthy();
      expect(f.airline).toBeTruthy();
      expect(f.price.amount).toBeGreaterThan(0);
      expect(f.price.currency).toBe('TRY');
      expect(f.stops).toBe(0); // domestic = direct
    }
  });

  it('should return flights for international route', () => {
    const flights = searchFlights('IST', 'LHR', '2026-03-15');
    expect(flights.length).toBeGreaterThanOrEqual(3);

    for (const f of flights) {
      expect(f.departure.airportCode).toBe('IST');
      expect(f.arrival.airportCode).toBe('LHR');
    }
  });

  it('should resolve city names to airports', () => {
    const flights = searchFlights('Istanbul', 'Antalya', '2026-06-01');
    expect(flights.length).toBeGreaterThanOrEqual(3);
    expect(flights[0].departure.city).toBe('Istanbul');
    expect(flights[0].arrival.city).toBe('Antalya');
  });

  it('should return empty array for unknown airports', () => {
    const flights = searchFlights('XYZ', 'ABC', '2026-01-01');
    expect(flights).toEqual([]);
  });

  it('should return deterministic results for same input', () => {
    const a = searchFlights('IST', 'ESB', '2026-05-20');
    const b = searchFlights('IST', 'ESB', '2026-05-20');
    expect(a).toEqual(b);
  });

  it('should return different results for different dates', () => {
    const a = searchFlights('IST', 'ESB', '2026-05-20');
    const b = searchFlights('IST', 'ESB', '2026-05-21');
    // Flight numbers or times should differ
    expect(a[0].flightNumber).not.toBe(b[0].flightNumber);
  });

  it('should multiply price by passenger count', () => {
    const single = searchFlights('IST', 'ADB', '2026-04-10', 1);
    const double = searchFlights('IST', 'ADB', '2026-04-10', 2);

    expect(double[0].price.amount).toBe(single[0].price.amount * 2);
  });

  it('should sort flights by price ascending', () => {
    const flights = searchFlights('IST', 'AYT', '2026-07-01');
    for (let i = 1; i < flights.length; i++) {
      expect(flights[i].price.amount).toBeGreaterThanOrEqual(flights[i - 1].price.amount);
    }
  });
});

describe('formatFlightResults', () => {
  it('should format flights as card-style text', () => {
    const flights = searchFlights('IST', 'AYT', '2026-02-10');
    const result = formatFlightResults(flights, 'IST', 'AYT', '2026-02-10');

    expect(result).toContain('UCUS SONUCLARI');
    expect(result).toContain('Istanbul (IST)');
    expect(result).toContain('Antalya (AYT)');
    expect(result).toContain('2026-02-10');
    expect(result).toContain('En uygun fiyat');
    expect(result).toContain('TRY');
  });

  it('should show not-found message for empty results', () => {
    const result = formatFlightResults([], 'XYZ', 'ABC', '2026-01-01');
    expect(result).toContain('bulunamadi');
  });
});
