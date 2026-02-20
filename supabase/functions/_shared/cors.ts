/**
 * CORS Configuration for Supabase Edge Functions
 *
 * SECURITY: Never use '*' for Access-Control-Allow-Origin in production
 * All origins must be explicitly whitelisted
 */

// List of allowed origins for CORS
const allowedOrigins = [
  // Production domains
  'https://jobnexai.com',
  'https://www.jobnexai.com',
  'https://app.jobnexai.com',
  'https://jobnexai-windsurf.netlify.app',
  'https://jobnexai.netlify.app',
  // Staging
  'https://staging.jobnexai.com',
  // Local development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8888',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// Default origin for requests without valid origin header
const DEFAULT_ORIGIN = 'https://jobnexai.com';

/**
 * Get CORS headers for a specific origin
 * SECURITY: Only returns the origin if it's in the allowed list
 */
export const getCorsHeaders = (origin: string | null): Record<string, string> => {
  // Validate origin against whitelist
  const isAllowed = origin && allowedOrigins.includes(origin);
  const allowedOrigin = isAllowed ? origin : DEFAULT_ORIGIN;

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, accept-language, content-language',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
};

/**
 * @deprecated Use getCorsHeaders(origin) instead for proper origin validation
 * This export is kept for backward compatibility but should be migrated
 */
export const corsHeaders = getCorsHeaders(null);
