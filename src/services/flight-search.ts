import type { Flight } from '../types/flight.js';

interface AirportInfo {
  code: string;
  name: string;
  city: string;
}

const AIRPORTS: Record<string, AirportInfo> = {
  IST: { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul' },
  SAW: { code: 'SAW', name: 'Sabiha Gokcen Airport', city: 'Istanbul' },
  ESB: { code: 'ESB', name: 'Esenboga Airport', city: 'Ankara' },
  ADB: { code: 'ADB', name: 'Adnan Menderes Airport', city: 'Izmir' },
  AYT: { code: 'AYT', name: 'Antalya Airport', city: 'Antalya' },
  TZX: { code: 'TZX', name: 'Trabzon Airport', city: 'Trabzon' },
  DLM: { code: 'DLM', name: 'Dalaman Airport', city: 'Mugla' },
  BJV: { code: 'BJV', name: 'Milas-Bodrum Airport', city: 'Bodrum' },
  GZT: { code: 'GZT', name: 'Gaziantep Airport', city: 'Gaziantep' },
  VAN: { code: 'VAN', name: 'Ferit Melen Airport', city: 'Van' },
  CDG: { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
  LHR: { code: 'LHR', name: 'Heathrow Airport', city: 'London' },
  FRA: { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  JFK: { code: 'JFK', name: 'John F. Kennedy Airport', city: 'New York' },
  DXB: { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai' },
  FCO: { code: 'FCO', name: 'Fiumicino Airport', city: 'Rome' },
  BCN: { code: 'BCN', name: 'El Prat Airport', city: 'Barcelona' },
  AMS: { code: 'AMS', name: 'Schiphol Airport', city: 'Amsterdam' },
  MUC: { code: 'MUC', name: 'Munich Airport', city: 'Munich' },
  ATH: { code: 'ATH', name: 'Eleftherios Venizelos Airport', city: 'Athens' },
};

interface AirlineInfo {
  name: string;
  code: string;
  logo: string;
}

const AIRLINES: AirlineInfo[] = [
  { name: 'Turkish Airlines', code: 'TK', logo: 'https://www.turkishairlines.com/theme/img/logo.svg' },
  { name: 'Pegasus Airlines', code: 'PC', logo: 'https://www.flypgs.com/assets/images/logo.svg' },
  { name: 'AnadoluJet', code: 'TK', logo: 'https://www.anadolujet.com/theme/img/logo.svg' },
  { name: 'SunExpress', code: 'XQ', logo: 'https://www.sunexpress.com/assets/images/logo.svg' },
  { name: 'Lufthansa', code: 'LH', logo: 'https://www.lufthansa.com/content/dam/lh/logo.svg' },
  { name: 'British Airways', code: 'BA', logo: 'https://www.britishairways.com/assets/images/logo.svg' },
  { name: 'Emirates', code: 'EK', logo: 'https://www.emirates.com/content/dam/images/logo.svg' },
];

const AIRCRAFT_TYPES = [
  'Boeing 737-800', 'Boeing 737 MAX 8', 'Boeing 777-300ER', 'Boeing 787-9 Dreamliner',
  'Airbus A320neo', 'Airbus A321neo', 'Airbus A330-300', 'Airbus A350-900',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function resolveAirport(input: string): AirportInfo | null {
  const upper = input.toUpperCase().trim();

  // Direct code match
  if (AIRPORTS[upper]) return AIRPORTS[upper];

  // City name match
  const byCity = Object.values(AIRPORTS).find(
    (a) => a.city.toUpperCase() === upper || a.city.toUpperCase().startsWith(upper),
  );
  if (byCity) return byCity;

  // Fuzzy match on name or city
  const fuzzy = Object.values(AIRPORTS).find(
    (a) =>
      a.name.toUpperCase().includes(upper) ||
      a.city.toUpperCase().includes(upper) ||
      upper.includes(a.city.toUpperCase()),
  );
  return fuzzy || null;
}

function isDomestic(from: AirportInfo, to: AirportInfo): boolean {
  const turkishCodes = ['IST', 'SAW', 'ESB', 'ADB', 'AYT', 'TZX', 'DLM', 'BJV', 'GZT', 'VAN'];
  return turkishCodes.includes(from.code) && turkishCodes.includes(to.code);
}

function generateFlightDuration(from: AirportInfo, to: AirportInfo, rand: () => number): { hours: number; minutes: number } {
  const domestic = isDomestic(from, to);
  if (domestic) {
    const hours = 1;
    const minutes = Math.floor(rand() * 40) + 10; // 1h10m - 1h50m
    return { hours, minutes };
  }
  // International
  const hours = Math.floor(rand() * 8) + 2; // 2h - 10h
  const minutes = Math.floor(rand() * 50) + 5;
  return { hours, minutes };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function addTime(hour: number, minute: number, addHours: number, addMinutes: number): { hour: number; minute: number } {
  let totalMinutes = hour * 60 + minute + addHours * 60 + addMinutes;
  totalMinutes = totalMinutes % (24 * 60);
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

export function searchFlights(
  from: string,
  to: string,
  date: string,
  passengers: number = 1,
): Flight[] {
  const fromAirport = resolveAirport(from);
  const toAirport = resolveAirport(to);

  if (!fromAirport || !toAirport) {
    return [];
  }

  const seed = hashString(`${fromAirport.code}-${toAirport.code}-${date}`);
  const rand = seededRandom(seed);

  const domestic = isDomestic(fromAirport, toAirport);
  const flightCount = Math.floor(rand() * 3) + 3; // 3-5 flights

  const availableAirlines = domestic
    ? AIRLINES.filter((a) => ['TK', 'PC', 'XQ'].includes(a.code))
    : AIRLINES;

  const flights: Flight[] = [];

  // Generate departure times spread throughout the day
  const departureTimes = [
    { hour: 6, minute: Math.floor(rand() * 50) + 5 },
    { hour: 8, minute: Math.floor(rand() * 55) },
    { hour: 11, minute: Math.floor(rand() * 55) },
    { hour: 14, minute: Math.floor(rand() * 55) },
    { hour: 17, minute: Math.floor(rand() * 55) },
    { hour: 20, minute: Math.floor(rand() * 50) },
    { hour: 22, minute: Math.floor(rand() * 30) },
  ].slice(0, flightCount);

  for (let i = 0; i < flightCount; i++) {
    const airline = availableAirlines[Math.floor(rand() * availableAirlines.length)];
    const duration = generateFlightDuration(fromAirport, toAirport, rand);
    const depTime = departureTimes[i];
    const arrTime = addTime(depTime.hour, depTime.minute, duration.hours, duration.minutes);

    const flightNum = `${airline.code}${Math.floor(rand() * 900) + 100}`;

    // Price logic
    let basePrice: number;
    if (domestic) {
      basePrice = Math.floor(rand() * 1500) + 500; // 500-2000 TRY
    } else {
      basePrice = Math.floor(rand() * 8000) + 2000; // 2000-10000 TRY
    }

    // Some variation factors
    const isEarlyMorning = depTime.hour < 7;
    const isLateNight = depTime.hour >= 21;
    if (isEarlyMorning || isLateNight) basePrice = Math.floor(basePrice * 0.8);

    const stops = domestic ? 0 : (rand() > 0.6 ? 1 : 0);
    let stopInfo: string | undefined;
    if (stops === 1) {
      const transitAirports = Object.values(AIRPORTS).filter(
        (a) => a.code !== fromAirport.code && a.code !== toAirport.code,
      );
      const transit = transitAirports[Math.floor(rand() * transitAirports.length)];
      stopInfo = `${transit.city} (${transit.code}) - ${Math.floor(rand() * 2) + 1}h aktarma`;
    }

    const cabin = rand() > 0.8 ? 'Business' : 'Economy';
    if (cabin === 'Business') basePrice = Math.floor(basePrice * 2.8);

    const seatsLeft = Math.floor(rand() * 8) + 1;

    flights.push({
      flightNumber: flightNum,
      airline: airline.name,
      airlineLogo: airline.logo,
      departure: {
        airport: fromAirport.name,
        airportCode: fromAirport.code,
        city: fromAirport.city,
        time: formatTime(depTime.hour, depTime.minute),
      },
      arrival: {
        airport: toAirport.name,
        airportCode: toAirport.code,
        city: toAirport.city,
        time: formatTime(arrTime.hour, arrTime.minute),
      },
      duration: `${duration.hours}h ${duration.minutes}m`,
      stops,
      stopInfo,
      price: {
        amount: basePrice * passengers,
        currency: 'TRY',
      },
      cabin,
      aircraft: AIRCRAFT_TYPES[Math.floor(rand() * AIRCRAFT_TYPES.length)],
      seatsLeft: seatsLeft <= 5 ? seatsLeft : undefined,
    });
  }

  // Sort by price
  flights.sort((a, b) => a.price.amount - b.price.amount);

  return flights;
}

function formatFlightCard(flight: Flight, index: number): string {
  const divider = '━'.repeat(48);
  const thinDivider = '─'.repeat(48);

  const stopsBadge = flight.stops === 0 ? '  Direkt Ucus' : `  ${flight.stops} Aktarma`;
  const seatsWarning = flight.seatsLeft ? `\n  Son ${flight.seatsLeft} koltuk!` : '';
  const stopDetail = flight.stopInfo ? `\n  Aktarma: ${flight.stopInfo}` : '';

  const priceStr = flight.price.amount.toLocaleString('tr-TR');

  return `
${divider}
  ${flight.airline}                     ${flight.flightNumber}
${thinDivider}

  ${flight.departure.airportCode}                                    ${flight.arrival.airportCode}
  ${flight.departure.city}                            ${flight.arrival.city}

  ${flight.departure.time}  ────────  ${flight.duration}  ────────  ${flight.arrival.time}

  ${flight.aircraft}
  Kabin: ${flight.cabin}${stopsBadge}${stopDetail}
${thinDivider}
  ${priceStr} ${flight.price.currency}${seatsWarning}
${divider}`;
}

export function formatFlightResults(flights: Flight[], from: string, to: string, date: string): string {
  if (flights.length === 0) {
    return `"${from}" -> "${to}" rotasi icin ${date} tarihinde ucus bulunamadi.\n\nLutfen havaalani kodlarini (IST, ESB, ADB, AYT vb.) veya sehir isimlerini kontrol edin.`;
  }

  const header = `
${'='.repeat(48)}
  UCUS SONUCLARI
  ${flights[0].departure.city} (${flights[0].departure.airportCode})  ->  ${flights[0].arrival.city} (${flights[0].arrival.airportCode})
  Tarih: ${date}
  ${flights.length} ucus bulundu
${'='.repeat(48)}`;

  const cards = flights.map((f, i) => formatFlightCard(f, i)).join('\n');

  const cheapest = flights[0];
  const footer = `
${'─'.repeat(48)}
  En uygun fiyat: ${cheapest.price.amount.toLocaleString('tr-TR')} ${cheapest.price.currency}
  (${cheapest.airline} ${cheapest.flightNumber} - ${cheapest.departure.time})
${'─'.repeat(48)}`;

  return header + '\n' + cards + '\n' + footer;
}
