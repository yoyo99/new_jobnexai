// List of allowed origins for CORS
const allowedOrigins = [
  'https://jobnexai-windsurf.netlify.app', // Production frontend
  'http://localhost:3000',               // Local dev for Vite/Next.js
  'http://localhost:5173',               // Default local dev for Vite
  'http://localhost:8080',               // Common local dev
];

export const getCorsHeaders = (origin: string | null) => {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Origin': allowedOrigins[0], // Default to production
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
};
