// List of allowed origins for CORS
const allowedOrigins = [
  'https://jobnexai-windsurf.netlify.app', // Production frontend
  'http://localhost:3000',               // Local dev for Vite/Next.js
  'http://localhost:5173',               // Default local dev for Vite
  'http://localhost:8080',               // Common local dev
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const getCorsHeaders = (origin: string | null) => {
  const headers = {
    ...corsHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
};
