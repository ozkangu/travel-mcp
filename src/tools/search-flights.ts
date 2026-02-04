import { z } from 'zod/v4';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchFlights, formatFlightResults } from '../services/flight-search.js';

export function registerSearchFlightsTool(server: McpServer): void {
  server.registerTool('search_flights', {
    description:
      'Search for available flights between two airports/cities. Returns flight options with airline, times, duration, price and cabin info. Supports Turkish airport codes (IST, SAW, ESB, ADB, AYT, TZX, DLM, BJV, GZT, VAN) and international ones (CDG, LHR, FRA, JFK, DXB, FCO, BCN, AMS, MUC, ATH). You can also search by city name (e.g. "Istanbul", "Ankara").',
    inputSchema: {
      from: z.string().describe('Departure airport code or city name (e.g. "IST", "Istanbul", "Ankara")'),
      to: z.string().describe('Arrival airport code or city name (e.g. "AYT", "Antalya", "London")'),
      date: z.string().describe('Flight date in YYYY-MM-DD format'),
      passengers: z.number().int().min(1).max(9).default(1).describe('Number of passengers'),
    },
  }, async (args) => {
    try {
      const flights = searchFlights(args.from, args.to, args.date, args.passengers);
      const formatted = formatFlightResults(flights, args.from, args.to, args.date);

      const jsonData = flights.map((f) => ({
        flightNumber: f.flightNumber,
        airline: f.airline,
        from: `${f.departure.city} (${f.departure.airportCode})`,
        to: `${f.arrival.city} (${f.arrival.airportCode})`,
        departure: f.departure.time,
        arrival: f.arrival.time,
        duration: f.duration,
        stops: f.stops,
        stopInfo: f.stopInfo,
        cabin: f.cabin,
        aircraft: f.aircraft,
        price: `${f.price.amount.toLocaleString('tr-TR')} ${f.price.currency}`,
        seatsLeft: f.seatsLeft,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: formatted,
          },
          {
            type: 'text' as const,
            text: '\n\n---\nStructured Data (JSON):\n' + JSON.stringify(jsonData, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text' as const, text: `Ucus arama hatasi: ${message}` }],
        isError: true,
      };
    }
  });
}
