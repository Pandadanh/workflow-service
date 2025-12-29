export interface AppConfig {
  port: number;
  environment: string;
  cors: {
    origins: string[];
    credentials: boolean;
  };
  throttling: {
    short: { ttl: number; limit: number };
    medium: { ttl: number; limit: number };
    long: { ttl: number; limit: number };
  };
  swagger: {
    title: string;
    description: string;
    version: string;
    path: string;
  };
}

export const appConfig = (): AppConfig => ({
  port: parseInt(process.env.PORT || '8089', 10),
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origins: process.env.NODE_ENV === 'development' 
      ? [
          'http://localhost:3000',
          'http://localhost:8080',
          'http://localhost:3001',
          'http://localhost:5173',
          'http://127.0.0.1:5500',
        ]
      : [
          'https://badminton-booking-fe.vercel.app',
          'https://smash-club.vercel.app',
          'https://smash-club.app',
          'https://www.smash-club.net',
          'https://smash-club.net',
          'https://badminton-booking-fe-uat.vercel.app',
          'http://127.0.0.1:5500',
        ],
    credentials: true,
  },
  throttling: {
    short: { ttl: 1000, limit: 10 },
    medium: { ttl: 10000, limit: 20 },
    long: { ttl: 60000, limit: 100 },
  },
  swagger: {
    title: 'Badminton Booking API',
    description: 'API documentation for Badminton Booking',
    version: '1.0',
    path: 'api-docs',
  },
});
