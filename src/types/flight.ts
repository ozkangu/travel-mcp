export interface Flight {
  flightNumber: string;
  airline: string;
  airlineLogo: string;
  departure: {
    airport: string;
    airportCode: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    city: string;
    time: string;
  };
  duration: string;
  stops: number;
  stopInfo?: string;
  price: {
    amount: number;
    currency: string;
  };
  cabin: string;
  aircraft: string;
  seatsLeft?: number;
}
